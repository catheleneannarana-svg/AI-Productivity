import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, AlertTriangle, CheckCircle2, Cpu, Eye, HelpCircle, Gamepad2 } from 'lucide-react';
import { TeachableModelConfig, GameAction, GameSettings } from '../types';
import { playSuccessSound } from '../audio';

interface TeachableControllerProps {
  modelConfig: TeachableModelConfig;
  onChangeConfig: (config: TeachableModelConfig) => void;
  onAction: (action: GameAction) => void;
  settings: GameSettings;
}

// Dynamically load external scripts
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

const ACTION_COLORS: Record<GameAction, string> = {
  JUMP: 'bg-emerald-500 border-emerald-700 text-black',
  DUCK: 'bg-cyan-500 border-cyan-700 text-black',
  RUN: 'bg-amber-500 border-amber-700 text-black',
  NONE: 'bg-zinc-800 border-zinc-900 text-zinc-400'
};

export default function TeachableController({
  modelConfig,
  onChangeConfig,
  onAction,
  settings
}: TeachableControllerProps) {
  const [libsLoading, setLibsLoading] = useState(false);
  const [libsReady, setLibsReady] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  const [webcamActive, setWebcamActive] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  
  const [predictions, setPredictions] = useState<Record<string, number>>({});
  const [currentTriggeredAction, setCurrentTriggeredAction] = useState<GameAction>('NONE');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const lastPredictionTimeRef = useRef<number>(0);

  // Stop everything on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Sync isPlaying state - turn on/off predictions and webcam
  useEffect(() => {
    if (modelConfig.isPlaying && modelReady) {
      if (!webcamActive) {
        startWebcam();
      }
    }
  }, [modelConfig.isPlaying, modelReady]);

  // Load TensorFlow.js and Teachable Machine libraries from CDN
  const initLibraries = async (type: 'image' | 'pose'): Promise<boolean> => {
    if ((window as any).tf && ((type === 'image' && (window as any).tmImage) || (type === 'pose' && (window as any).tmPose))) {
      return true;
    }

    setLibsLoading(true);
    setLoadingError(null);
    try {
      // 1. Load standard TensorFlow.js first
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
      
      // 2. Load the specific Teachable Machine library requested
      if (type === 'image') {
        await loadScript('https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js');
      } else {
        await loadScript('https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8.5/dist/teachablemachine-pose.min.js');
      }
      
      setLibsReady(true);
      setLibsLoading(false);
      return true;
    } catch (err: any) {
      console.error(err);
      setLoadingError('Failed to load neural network libraries from CDN. Please verify internet connection.');
      setLibsLoading(false);
      return false;
    }
  };

  // Start HTML5 Webcam stream
  const startWebcam = async () => {
    setLoadingError(null);
    try {
      if (streamRef.current) return; // already active

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setWebcamActive(true);
    } catch (err: any) {
      console.error('Webcam access error:', err);
      setLoadingError('Webcam access was denied. Please allow camera permissions to control via gestures.');
      setWebcamActive(false);
    }
  };

  // Stop Webcam stream
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  // Standardize teachable machine model URL
  const formatModelUrl = (url: string) => {
    let formatted = url.trim();
    if (!formatted) return '';
    if (!formatted.endsWith('/')) {
      formatted += '/';
    }
    // Handle URLs missing protocol
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'https://' + formatted;
    }
    return formatted;
  };

  // Download and Load the model JSON & Metadata
  const connectModel = async () => {
    const formattedUrl = formatModelUrl(modelConfig.modelUrl);
    if (!formattedUrl) {
      setLoadingError('Please enter a valid Teachable Machine share link.');
      return;
    }

    setModelLoading(true);
    setLoadingError(null);
    setModelReady(false);
    setPredictions({});

    // Ensure TF & TM scripts are loaded
    const loaded = await initLibraries(modelConfig.modelType);
    if (!loaded) {
      setModelLoading(false);
      return;
    }

    try {
      // Fetch classes/labels list from metadata file
      const metaResponse = await fetch(`${formattedUrl}metadata.json`);
      if (!metaResponse.ok) {
        throw new Error('Could not fetch metadata.json. Is the share link correct?');
      }
      const metadata = await metaResponse.json();
      const labels: string[] = metadata.classes || metadata.labels || [];
      
      if (labels.length === 0) {
        throw new Error('No classes detected inside the model metadata.');
      }

      // Load model itself
      const modelJsonUrl = `${formattedUrl}model.json`;
      const metadataJsonUrl = `${formattedUrl}metadata.json`;
      
      let loadedModel: any = null;
      if (modelConfig.modelType === 'image') {
        const tmImage = (window as any).tmImage;
        loadedModel = await tmImage.load(modelJsonUrl, metadataJsonUrl);
      } else {
        const tmPose = (window as any).tmPose;
        loadedModel = await tmPose.load(modelJsonUrl, metadataJsonUrl);
      }

      modelRef.current = loadedModel;

      // Automatically construct or pair action maps based on label names (case insensitive)
      const newMappings: Record<string, GameAction> = {};
      const lowerLabels = labels.map(l => l.toLowerCase().trim());

      labels.forEach((label) => {
        const val = label.toLowerCase().trim();
        if (val.includes('jump') || val.includes('up') || val.includes('high') || val.includes('leap')) {
          newMappings[label] = 'JUMP';
        } else if (val.includes('duck') || val.includes('down') || val.includes('slide') || val.includes('crouch')) {
          newMappings[label] = 'DUCK';
        } else if (val.includes('run') || val.includes('forward') || val.includes('move')) {
          newMappings[label] = 'RUN';
        } else {
          newMappings[label] = 'NONE';
        }
      });

      // Default the primary non-action label if all mapped to NONE
      const hasJump = Object.values(newMappings).includes('JUMP');
      const hasDuck = Object.values(newMappings).includes('DUCK');

      // If no smart keywords match, just bind sequentially
      if (!hasJump && !hasDuck) {
        if (labels.length >= 2) {
          newMappings[labels[0]] = 'NONE'; // idle
          newMappings[labels[1]] = 'JUMP';
          if (labels[2]) newMappings[labels[2]] = 'DUCK';
        } else if (labels.length === 1) {
          newMappings[labels[0]] = 'JUMP';
        }
      }

      onChangeConfig({
        ...modelConfig,
        modelUrl: formattedUrl,
        classes: labels,
        mappings: newMappings
      });

      setModelReady(true);
      playSuccessSound(settings.volume);

      // Turn on webcam automatic
      await startWebcam();
      
      // Start inference loop
      startPredictionLoop();
    } catch (err: any) {
      console.error(err);
      setLoadingError(err.message || 'Error loading model assets. Double-check model share URL and internet connection.');
    } finally {
      setModelLoading(false);
    }
  };

  // Inference Loop using RequestAnimationFrame with elapsed timers
  const startPredictionLoop = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const predictFrame = async () => {
      const now = performance.now();
      const timeSinceLast = now - lastPredictionTimeRef.current;

      // Throttle predictions to settings.predictionInterval for frame performance
      if (timeSinceLast >= settings.predictionInterval && videoRef.current && modelRef.current && webcamActive) {
        lastPredictionTimeRef.current = now;

        try {
          let rawPredictions: any[] = [];
          
          if (modelConfig.modelType === 'image') {
            rawPredictions = await modelRef.current.predict(videoRef.current);
          } else {
            // Pose inference is 2-step
            const poseEstimate = await modelRef.current.estimatePose(videoRef.current);
            if (poseEstimate && poseEstimate.pose) {
              rawPredictions = await modelRef.current.predict(poseEstimate.posenetOutput);
            } else {
              // fallback to direct video predict if pose fails to detect
              rawPredictions = await modelRef.current.predict(videoRef.current);
            }
          }

          // Map predictions to key-value state
          const newPredictions: Record<string, number> = {};
          let maxProp: string = '';
          let maxVal: number = -1;

          rawPredictions.forEach((pred: { className: string; probability: number }) => {
            newPredictions[pred.className] = pred.probability;
            if (pred.probability > maxVal) {
              maxVal = pred.probability;
              maxProp = pred.className;
            }
          });

          setPredictions(newPredictions);

          // Evaluate winning prediction against confidence sensitivity config
          if (maxProp && maxVal >= settings.sensitivity) {
            const mappedAction = modelConfig.mappings[maxProp] || 'NONE';
            if (modelConfig.isPlaying) {
              onAction(mappedAction);
              setCurrentTriggeredAction(mappedAction);
            }
          } else {
            if (modelConfig.isPlaying) {
              onAction('NONE');
              setCurrentTriggeredAction('NONE');
            }
          }
        } catch (e) {
          // Throttled logging to avoid spam
          console.debug('Prediction cycle skipped:', e);
        }
      }

      animationRef.current = requestAnimationFrame(predictFrame);
    };

    animationRef.current = requestAnimationFrame(predictFrame);
  };

  // Stop predicting and pause
  const togglePlayInference = () => {
    const isPlayingNew = !modelConfig.isPlaying;
    onChangeConfig({
      ...modelConfig,
      isPlaying: isPlayingNew
    });
    if (isPlayingNew && modelReady) {
      startWebcam().then(() => startPredictionLoop());
    } else {
      stopWebcam();
    }
  };

  // Fallback demo simulator: click to activate mockup predictions
  const simulateClassTrigger = (cls: string) => {
    const samplePred: Record<string, number> = {};
    modelConfig.classes.forEach(c => {
      samplePred[c] = c === cls ? 0.98 : 0.02;
    });
    setPredictions(samplePred);
    
    const mappedAction = modelConfig.mappings[cls] || 'NONE';
    onAction(mappedAction);
    setCurrentTriggeredAction(mappedAction);
  };

  return (
    <div className="border-2 border-emerald-900/50 bg-neutral-950 rounded-2xl p-5 font-mono text-emerald-400 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 border-b border-emerald-950 pb-3 mb-4">
        <Cpu className="h-5 w-5 text-emerald-400 animate-pulse" />
        <h2 className="text-xs font-black tracking-widest uppercase text-white">
          NEURAL_STAGE_INTERFACE.io
        </h2>
      </div>

      <div className="space-y-5">
        {/* Model Setup Link */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
            TEACHABLE_MACHINE_WEB_KEY
          </label>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              className="w-full border border-emerald-950 bg-black/60 rounded-lg px-3 py-2 text-xs text-white placeholder-emerald-800 focus:border-emerald-500 focus:outline-none transition-colors"
              placeholder="https://teachablemachine.withgoogle.com/models/..."
              value={modelConfig.modelUrl}
              onChange={(e) => onChangeConfig({ ...modelConfig, modelUrl: e.target.value })}
            />
            
            <div className="flex gap-2 justify-end">
              {/* Type Toggle icon */}
              <button
                type="button"
                onClick={() => onChangeConfig({ ...modelConfig, modelType: modelConfig.modelType === 'image' ? 'pose' : 'image' })}
                disabled={modelLoading}
                className="border border-emerald-950 bg-neutral-900/80 rounded-lg px-3 py-1.5 text-[10px] uppercase font-bold text-emerald-400 hover:text-white transition-colors"
              >
                TYPE: {modelConfig.modelType}
              </button>
              
              <button
                onClick={connectModel}
                disabled={modelLoading}
                className="flex items-center gap-1.5 border border-emerald-400/30 bg-emerald-500/90 hover:bg-emerald-400 text-black px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] disabled:opacity-40"
              >
                {modelLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                CONNECT_NODE
              </button>
            </div>
          </div>
          <p className="text-[9px] text-emerald-800 leading-tight">
            Copy instructions: Export model as <strong className="text-white">Tensorflow.js Upload link</strong>, paste URL here. Supports Image / Pose.
          </p>
        </div>

        {/* Display Status Alerts */}
        {loadingError && (
          <div className="flex items-start gap-2 border border-red-500/30 bg-red-950/20 rounded-xl p-3 text-red-400 text-[10px] uppercase leading-relaxed shadow-[0_0_15px_rgba(239,68,68,0.05)]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span>{loadingError}</span>
          </div>
        )}

        {libsLoading && (
          <div className="flex items-center gap-2 border border-amber-500/30 bg-amber-950/20 rounded-xl p-3 text-amber-400 text-[10px] uppercase shadow-[0_0_15px_rgba(245,158,11,0.05)]">
            <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
            <span>Streaming TF.js bundles from remote servers, standby...</span>
          </div>
        )}

        {/* Live Webcam Preview Block */}
        <div className="grid grid-cols-1 gap-4">
          <div className="relative border-2 border-emerald-950 bg-black aspect-video rounded-xl overflow-hidden">
            {/* Webcam video stream */}
            <video
              ref={videoRef}
              muted
              playsInline
              className={`absolute inset-0 h-full w-full object-cover -scale-x-100 ${
                webcamActive ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-300`}
            />

            {!webcamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <Camera className="h-6 w-6 text-emerald-900 mb-2" />
                <span className="text-[9px] uppercase tracking-wider text-emerald-800">
                  CAMERA_CELL_OFFLINE
                </span>
                <span className="text-[8px] max-w-xs text-emerald-900 mt-1 uppercase">
                  Feed turns on when remote model is connected.
                </span>
              </div>
            )}

            {/* PIP indicator showing webcam stream predictions active */}
            {webcamActive && (
              <div className="absolute top-2 left-2 bg-red-650 px-2 py-0.5 border border-red-500 text-white text-[8px] rounded-full animate-pulse flex items-center gap-1.5 shadow">
                <span className="h-1 w-1 rounded-full bg-white block" />
                CAM_FEED_LIVE
              </div>
            )}
            
            {/* Display active output state overlay */}
            {modelReady && modelConfig.isPlaying && (
              <div className="absolute bottom-2 right-2 bg-neutral-950/90 border border-emerald-950 rounded-lg px-2 py-1 text-[8px] flex items-center gap-1 text-white uppercase font-black">
                <Eye className="h-3 w-3 text-emerald-400" />
                GESTURE: <span className="text-emerald-400">{currentTriggeredAction}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 border border-emerald-950 rounded-xl p-3 bg-neutral-900/30">
            {/* Model Info Area */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`h-2 w-2 rounded-full border border-black ${modelReady ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-neutral-800'}`} />
                <span className="text-[10px] font-black uppercase text-emerald-600">
                  CHIP_CONNECTION_TEST
                </span>
              </div>
              
              {modelReady ? (
                <div className="space-y-1">
                  <div className="text-[9px] text-emerald-550 leading-tight">
                    INTEGRATED MODEL DETECTED WEIGHTS. {modelConfig.classes.length} TARGET CLASSES COMPILED.
                  </div>
                  <div className="text-[8px] text-zinc-500 flex items-center gap-1 uppercase">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" /> webcam neural logic linked.
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-[9px] text-emerald-800 leading-tight">
                    NO MODEL LINKED YET. YOU MAY PAIR DEMO LABELS TO INSTRUCT SENSORY FEEDBACK OR USE THE KEYBOARD ARROWS.
                  </p>
                  
                  {/* Load Demo button */}
                  <button
                    onClick={() => {
                      // Seed custom sample mapping so users can play around instantly
                      onChangeConfig({
                        modelUrl: 'https://teachablemachine.withgoogle.com/models/sample-demo/',
                        modelType: 'image',
                        isPlaying: false,
                        classes: ['Idle Pose', 'Hand Raise (Jump)', 'Duck Pose'],
                        mappings: {
                          'Idle Pose': 'NONE',
                          'Hand Raise (Jump)': 'JUMP',
                          'Duck Pose': 'DUCK'
                        }
                      });
                      setModelReady(true);
                      playSuccessSound(settings.volume);
                    }}
                    className="border border-emerald-800/60 hover:bg-emerald-950/40 text-emerald-400 rounded-lg px-2.5 py-1 text-[8px] font-bold active:translate-y-0.5 leading-normal"
                  >
                    🚀 CONNECT_DEMO_NODE
                  </button>
                </div>
              )}
            </div>

            {/* Webcam feed toggles */}
            {modelReady && (
              <div className="mt-2 pt-2 border-t border-emerald-950">
                <button
                  onClick={togglePlayInference}
                  className={`w-full rounded-lg py-2.5 text-[10px] font-black text-center uppercase tracking-widest transition-colors ${
                    modelConfig.isPlaying
                      ? 'bg-red-500 text-white border border-red-400'
                      : 'bg-emerald-500 text-black hover:bg-emerald-400'
                  }`}
                >
                  {modelConfig.isPlaying ? '⏸ PAUSE NEURAL MATRIX' : '▶ START NEURAL CONTROLS'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mapping & Confidence Horizontal Bars */}
        {modelConfig.classes.length > 0 && (
          <div className="border border-emerald-950 rounded-2xl p-4 bg-neutral-900/20">
            <div className="flex items-center justify-between pb-2 border-b border-dashed border-emerald-950/60">
              <span className="text-[9px] font-bold uppercase text-emerald-700">
                WAVEFORM MATRIX_CONFIDENCE
              </span>
              <span className="text-[8px] text-emerald-800">
                INTERVAL_{settings.predictionInterval}MS
              </span>
            </div>

            <div className="mt-3.5 space-y-4">
              {modelConfig.classes.map((cls) => {
                const probability = predictions[cls] || 0;
                const mappedAction = modelConfig.mappings[cls] || 'NONE';
                const isOverThreshold = probability >= settings.sensitivity;

                return (
                  <div key={cls} className="text-[10px]">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1 text-white">
                      <div className="flex items-center gap-1.5">
                        {/* Simulation trigger */}
                        <button
                          type="button"
                          onClick={() => simulateClassTrigger(cls)}
                          title="Simulate this gesture input trigger"
                          className="p-1 rounded bg-black border border-emerald-950 text-emerald-700 hover:text-emerald-400 transition-colors"
                        >
                          <Gamepad2 className="h-3 w-3" />
                        </button>
                        <span className="font-mono tracking-tight uppercase">
                          {cls}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-emerald-600">
                          PROB: {(probability * 100).toFixed(0)}%
                        </span>
                        
                        {/* Action mapping selection drop-down */}
                        <select
                          value={mappedAction}
                          onChange={(e) => {
                            const newAct = e.target.value as GameAction;
                            onChangeConfig({
                              ...modelConfig,
                              mappings: {
                                ...modelConfig.mappings,
                                [cls]: newAct
                              }
                            });
                          }}
                          className="border border-emerald-950 bg-black text-emerald-400 px-1 py-0.5 text-[9px] font-mono uppercase focus:outline-none rounded"
                        >
                          <option value="NONE">- IDLE -</option>
                          <option value="JUMP">JUMP</option>
                          <option value="DUCK">DUCK</option>
                          <option value="RUN">RUN SPEED</option>
                        </select>
                      </div>
                    </div>

                    {/* Progress Bar Confidence Meter */}
                    <div className="relative h-3 w-full bg-neutral-900 border border-emerald-950 rounded overflow-hidden">
                      {/* Threshold Tick Line */}
                      <div
                        className="absolute h-full w-0.5 bg-red-500 z-10"
                        style={{ left: `${settings.sensitivity * 100}%` }}
                        title={`Threshold sensitivity: ${(settings.sensitivity * 100).toFixed(0)}%`}
                      />

                      {/* Decisive overlay bar */}
                      <div
                        className="h-full border-r border-emerald-900 transition-all duration-75"
                        style={{
                          width: `${probability * 100}%`,
                          backgroundColor: isOverThreshold
                            ? mappedAction === 'JUMP'
                              ? '#10b981'
                              : mappedAction === 'DUCK'
                              ? '#06b6d4'
                              : mappedAction === 'RUN'
                              ? '#f59e0b'
                              : '#6b7280'
                            : '#1f2937'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-3 flex justify-end">
              <span className="text-[7.5px] text-emerald-805 uppercase font-mono tracking-tighter">
                *vertical red marker indicates confidence threshold ({Math.round(settings.sensitivity * 100)}%) required
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
