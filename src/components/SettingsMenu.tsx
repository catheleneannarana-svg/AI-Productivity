import React from 'react';
import { Sliders, Volume2, Moon, Sun, CheckCircle2, Trash2, KeyRound, Clock, Heart } from 'lucide-react';
import { GameSettings } from '../types';
import { playSuccessSound } from '../audio';

interface SettingsMenuProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onClearHighScores: () => void;
}

export default function SettingsMenu({
  settings,
  onUpdateSettings,
  onClearHighScores
}: SettingsMenuProps) {

  const handleSensitivityChange = (val: number) => {
    onUpdateSettings({
      ...settings,
      sensitivity: val
    });
  };

  const handleLevelIntervalChange = (val: number) => {
    onUpdateSettings({
      ...settings,
      predictionInterval: val
    });
  };

  const handleVolumeChange = (val: number) => {
    const updatedSettings = {
      ...settings,
      volume: val
    };
    onUpdateSettings(updatedSettings);
    // Play sound feedback to hear volume level
    playSuccessSound(val);
  };

  const handleKeybindChange = (action: 'jump' | 'duck', key: string) => {
    onUpdateSettings({
      ...settings,
      keyboardControls: {
        ...settings.keyboardControls,
        [action]: key
      }
    });
  };

  return (
    <div className="border-2 border-emerald-900/50 bg-neutral-950 rounded-2xl p-5 font-mono text-emerald-400 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 border-b border-emerald-950 pb-3 mb-4">
        <Sliders className="h-5 w-5 text-emerald-400" />
        <h2 className="text-xs font-black tracking-widest uppercase text-white">
          CALIBRATION_STAGE_SYSTEM.cfg
        </h2>
      </div>

      <div className="space-y-5 text-xs">
        {/* Dark Mode force status visual */}
        <div className="flex items-center justify-between border-b border-emerald-950/40 pb-3">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <Moon className="h-4 w-4" />
            <span className="uppercase text-[9px] font-bold">THEME SKIN MODE STATE</span>
          </div>
          <span className="text-[10px] bg-emerald-950 border border-emerald-500/20 text-white font-bold px-2 py-0.5 rounded uppercase">
            NEON COSMIC [DARK]
          </span>
        </div>

        {/* Model Threshold/Sensitivity slider */}
        <div className="space-y-2 border-b border-emerald-950/40 pb-3">
          <div className="flex justify-between items-center text-[9px] font-bold">
            <span className="uppercase text-emerald-600">NEURAL DETECTION CONFIDENCE THRESHOLD</span>
            <span className="text-white">{Math.round(settings.sensitivity * 100)}% Match</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="0.98"
            step="0.02"
            value={settings.sensitivity}
            onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-900 rounded appearance-none cursor-pointer accent-emerald-500"
          />
          <p className="text-[9px] text-emerald-800 leading-tight">
            Adjust confidence threshold required to register camera poses. Lower sensitivity activates moves easier but might capture false poses.
          </p>
        </div>

        {/* Prediction Interval Interval ms */}
        <div className="space-y-2 border-b border-emerald-950/40 pb-3">
          <div className="flex justify-between items-center text-[9px] font-bold">
            <span className="uppercase flex items-center gap-1 text-emerald-600">
              <Clock className="h-3.5 w-3.5 shrink-0" /> GESTURE INFERENCE POLLING INTERVAL
            </span>
            <span className="text-white">{settings.predictionInterval}ms</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[50, 100, 200].map((ms) => (
              <button
                key={ms}
                onClick={() => handleLevelIntervalChange(ms)}
                className={`py-1.5 text-[9px] font-bold rounded border ${
                  settings.predictionInterval === ms
                    ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold'
                    : 'border-emerald-950 text-emerald-600 hover:text-emerald-400 bg-transparent'
                }`}
              >
                {ms}ms {ms === 50 ? '(SNAP)' : ms === 100 ? '(MID)' : '(SLOW)'}
              </button>
            ))}
          </div>
        </div>

        {/* Volume dynamic controller */}
        <div className="space-y-2 border-b border-emerald-950/40 pb-3">
          <div className="flex justify-between items-center text-[9px] font-bold">
            <span className="uppercase flex items-center gap-1 text-emerald-600">
              <Volume2 className="h-4 w-4 shrink-0" /> CHIPTUNE SOUND VOL_SYS
            </span>
            <span className="text-white">{Math.round(settings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={settings.volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-900 rounded appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Keyboard rebindings */}
        <div className="space-y-2 border-b border-emerald-950/40 pb-3">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-emerald-600 mb-1.5">
            <KeyRound className="h-4 w-4 shrink-0" /> MANUAL ACTION KEYBIND REGISTRY
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[8px] text-emerald-700 uppercase mb-1">
                JUMP DIRECTION KEY
              </label>
              <input
                type="text"
                maxLength={10}
                className="w-full border border-emerald-950 bg-black/60 rounded-lg px-2 py-1 uppercase text-center focus:border-emerald-500 focus:outline-none"
                value={settings.keyboardControls.jump}
                onChange={(e) => handleKeybindChange('jump', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-[8px] text-emerald-700 uppercase mb-1">
                DUCK DIRECTION KEY
              </label>
              <input
                type="text"
                maxLength={10}
                className="w-full border border-emerald-950 bg-black/60 rounded-lg px-2 py-1 uppercase text-center focus:border-emerald-500 focus:outline-none"
                value={settings.keyboardControls.duck}
                onChange={(e) => handleKeybindChange('duck', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Destruction settings */}
        <div className="flex items-center justify-between pt-1">
          <div className="font-mono">
            <span className="block text-[9px] text-emerald-600 font-bold uppercase">WIPE CACHED MATRIX RECORDS</span>
            <span className="text-[8px] text-emerald-800 leading-none">Discard high scores history.</span>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Delete all scores inside local high score history? This action is permanent.')) {
                onClearHighScores();
              }
            }}
            className="flex items-center gap-1.5 border border-red-950 bg-red-955/20 text-red-400 hover:text-white hover:bg-red-500 rounded-lg px-3 py-1.5 text-[9px] font-bold uppercase transition-all"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            WIPE_DATA
          </button>
        </div>
      </div>
    </div>
  );
}

