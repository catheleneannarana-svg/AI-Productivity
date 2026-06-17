import React, { useState, useEffect } from 'react';
import { Trophy, Gamepad2, Sliders, HelpCircle, Activity, Cpu, Calendar, User, Trash2, ShieldAlert, Zap } from 'lucide-react';
import { GameState, GameAction, GameSettings, TeachableModelConfig, ScoreRecord } from './types';
import GameCanvas from './components/GameCanvas';
import TeachableController from './components/TeachableController';
import SettingsMenu from './components/SettingsMenu';
import Instructions from './components/Instructions';
import { playSuccessSound } from './audio';

// Default configurations
const DEFAULT_SETTINGS: GameSettings = {
  sensitivity: 0.80,
  predictionInterval: 100,
  volume: 0.4,
  darkMode: true, // Preset dark mode for Bento cyber neon aesthetic
  keyboardControls: {
    jump: 'ArrowUp',
    duck: 'ArrowDown'
  }
};

const DEFAULT_MODEL_CONFIG: TeachableModelConfig = {
  modelUrl: '',
  modelType: 'image',
  isPlaying: false,
  classes: [],
  mappings: {}
};

export default function App() {
  // Game orchestration state
  const [gameState, setGameState] = useState<GameState>('START');
  const [activeAction, setActiveAction] = useState<GameAction>('NONE');
  const [score, setScore] = useState<number>(0);
  
  // Storage backed states
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [modelConfig, setModelConfig] = useState<TeachableModelConfig>(DEFAULT_MODEL_CONFIG);
  const [highScores, setHighScores] = useState<ScoreRecord[]>([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'neural' | 'settings' | 'manual'>('neural');
  const [playerName, setPlayerName] = useState<string>('DINO_RIDER');

  // Load configuration and data from Local Storage on mount
  useEffect(() => {
    try {
      // 1. Settings
      const savedSettings = localStorage.getItem('TEACHABLE_DINO_SETTINGS');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed, darkMode: true }); // keep dark mode true for bento
      } else {
        setSettings({ ...DEFAULT_SETTINGS, darkMode: true });
      }

      // 2. Model Settings (helps avoid re-pasting URLs)
      const savedModel = localStorage.getItem('TEACHABLE_DINO_MODEL_CONFIG');
      if (savedModel) {
        const parsed = JSON.parse(savedModel);
        setModelConfig({ ...DEFAULT_MODEL_CONFIG, ...parsed, isPlaying: false }); // Start paused
      }

      // 3. High Scores list
      const savedScores = localStorage.getItem('TEACHABLE_DINO_HIGH_SCORES');
      if (savedScores) {
        setHighScores(JSON.parse(savedScores));
      } else {
        // Seed default starting high scores for retro aesthetic context
        const seedScores: ScoreRecord[] = [
          { score: 1200, playerName: 'NES_MASTER', date: '2026-06-15', isTeachableModel: false },
          { score: 680, playerName: 'AI_PIONEER', date: '2026-06-16', isTeachableModel: true },
          { score: 340, playerName: 'DINO_CHAMP', date: '2026-06-16', isTeachableModel: false }
        ];
        setHighScores(seedScores);
        localStorage.setItem('TEACHABLE_DINO_HIGH_SCORES', JSON.stringify(seedScores));
      }

      // 4. Player Name
      const savedName = localStorage.getItem('TEACHABLE_DINO_PLAYER_NAME');
      if (savedName) {
        setPlayerName(savedName);
      }
    } catch (e) {
      console.warn('Error reading local storage:', e);
    }
  }, []);

  // Sync Dark Mode class list globally (Bento theme is dark-focused always)
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Save Settings to Local Storage
  const handleUpdateSettings = (newSettings: GameSettings) => {
    const updated = { ...newSettings, darkMode: true }; // force dark mode for Neon aesthetic
    setSettings(updated);
    localStorage.setItem('TEACHABLE_DINO_SETTINGS', JSON.stringify(updated));
  };

  // Save Model config to Local Storage
  const handleUpdateModelConfig = (newConfig: TeachableModelConfig) => {
    setModelConfig(newConfig);
    // Persist url, mappings, classes for user convenience
    localStorage.setItem(
      'TEACHABLE_DINO_MODEL_CONFIG',
      JSON.stringify({
        modelUrl: newConfig.modelUrl,
        modelType: newConfig.modelType,
        classes: newConfig.classes,
        mappings: newConfig.mappings
      })
    );
  };

  // Append & Track new High Score
  const handleNewHighScore = (finalScore: number) => {
    const isTeachableUsed = modelConfig.classes.length > 0 && modelConfig.isPlaying;
    const newRecord: ScoreRecord = {
      score: finalScore,
      playerName: playerName.trim() || 'DINO_RIDER',
      date: new Date().toISOString().split('T')[0],
      isTeachableModel: isTeachableUsed
    };

    const updated = [...highScores, newRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Keep top 5 only

    setHighScores(updated);
    localStorage.setItem('TEACHABLE_DINO_HIGH_SCORES', JSON.stringify(updated));
  };

  const handleClearHighScores = () => {
    setHighScores([]);
    localStorage.removeItem('TEACHABLE_DINO_HIGH_SCORES');
  };

  const handleActionInput = (action: GameAction) => {
    setActiveAction(action);
  };

  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('TEACHABLE_DINO_PLAYER_NAME', name);
  };

  const maxHistoricalScore = highScores.length > 0 ? Math.max(...highScores.map(h => h.score)) : 0;

  return (
    <div className="min-h-screen bg-black text-emerald-400 font-mono bento-grid-bg transition-colors duration-300 pb-16 flex flex-col justify-between">
      {/* Container holding Bento structure */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-4 space-y-6">
        
        {/* HEADER BENTO CARD: 2-column or 3-column layout */}
        <header className="border-2 border-emerald-900/50 bg-neutral-950 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0px_4px_24px_rgba(16,185,129,0.04)]">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center gap-2.5 justify-center md:justify-start">
              <span className="p-1.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 rounded-lg animate-pulse">
                <Gamepad2 className="h-5 w-5" />
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase italic text-white flex items-end gap-2 leading-none">
                NEON-RUNNER <span className="text-emerald-400 text-xs font-mono tracking-widest not-italic">v1.0</span>
              </h1>
            </div>
            <p className="text-xs text-emerald-600 uppercase tracking-wider font-mono">
              Model-driven gesture platformer
            </p>
          </div>

          {/* Stat panel header cells resembling Bento counters */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-center md:text-right">
            <div className="px-4 py-1.5 border border-emerald-950 bg-neutral-900/40 rounded-xl">
              <p className="text-[9px] text-emerald-700 uppercase tracking-widest leading-none mb-1">ALL-TIME BEST</p>
              <p className="text-2xl font-black text-emerald-400 tracking-tight leading-none">
                {maxHistoricalScore.toString().padStart(6, '0')}
              </p>
            </div>
            
            <div className="px-4 py-1.5 border border-emerald-950 bg-neutral-900/40 rounded-xl">
              <p className="text-[9px] text-emerald-700 uppercase tracking-widest leading-none mb-1">CURRENT ATTEMPT</p>
              <p className="text-2xl font-black text-white tracking-tight leading-none">
                {score.toString().padStart(6, '0')}
              </p>
            </div>

            {/* Target name input */}
            <div className="px-4 py-1.5 border border-emerald-950 bg-neutral-900/40 rounded-xl flex items-center gap-2">
              <div>
                <p className="text-[9px] text-emerald-700 uppercase tracking-widest leading-none mb-1 text-left">PILOT SIGNATURE</p>
                <input
                  type="text"
                  className="bg-transparent text-xs font-bold text-white uppercase outline-none w-24 border-b border-dashed border-emerald-700 focus:border-emerald-400 tracking-wider"
                  placeholder="PLAYER_NAME"
                  value={playerName}
                  onChange={(e) => handlePlayerNameChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        </header>

        {/* CORE GRID: 12 col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT BENTO BLOCK (8 spans) - Game play arena */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Play Screen card */}
            <div className="bg-neutral-950 border-2 border-emerald-900/50 rounded-2xl p-4 md:p-6 shadow-[0px_4px_30px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-900 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">STAGE_MONITOR.run</span>
                </div>
                <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  {gameState === 'PLAYING' ? 'SIMULATION_ON' : 'STANDBY'}
                </span>
              </div>

              <GameCanvas
                gameState={gameState}
                setGameState={setGameState}
                activeAction={activeAction}
                settings={settings}
                score={score}
                setScore={setScore}
                highScores={highScores}
                onNewHighScore={handleNewHighScore}
                isTeachableActive={modelConfig.classes.length > 0 && modelConfig.isPlaying}
              />
            </div>

            {/* High score leaderboard Bento Box */}
            <div className="bg-neutral-950 border-2 border-emerald-950 bg-neutral-950/80 rounded-2xl p-6">
              <div className="flex items-center justify-between border-b border-emerald-950 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4.5 w-4.5 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Historical_Record_Matrix
                  </h3>
                </div>
                <span className="text-[8px] text-zinc-500 uppercase font-mono">Durable Cloud Sync Available</span>
              </div>

              <div className="font-mono text-xs">
                {highScores.length === 0 ? (
                  <div className="text-center py-8 text-neutral-600">
                    EMPTY RECORD MATRIX. FINISH THE RUNWAY TO WRITE THE FIRST SIGNATURE.
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="grid grid-cols-12 gap-2 text-emerald-800 border-b border-emerald-950/70 pb-2 text-[10px] font-bold uppercase">
                      <span className="col-span-2 text-center">RANK</span>
                      <span className="col-span-4">SIGNATURE</span>
                      <span className="col-span-3">INPUT CHIP</span>
                      <span className="col-span-3 text-right">HIGH_SCORE</span>
                    </div>

                    {highScores.map((record, index) => (
                      <div
                        key={index}
                        className={`grid grid-cols-12 gap-2 py-3 border-b border-emerald-950/20 items-center hover:bg-neutral-900/30 transition-colors px-1 rounded-lg ${
                          index === 0 ? 'text-white font-extrabold bg-emerald-950/10 border-l-2 border-l-emerald-500 pl-2' : 'text-neutral-300'
                        }`}
                      >
                        <span className="col-span-2 text-center font-bold text-emerald-500">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="col-span-4 font-mono tracking-wide uppercase truncate">
                          {record.playerName}
                        </span>
                        <span className="col-span-3 text-[10px]">
                          {record.isTeachableModel ? (
                            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                              Neural_TM
                            </span>
                          ) : (
                            <span className="bg-zinc-900 text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded text-[8px] uppercase">
                              Manual_KB
                            </span>
                          )}
                        </span>
                        <span className="col-span-3 text-right font-black tracking-tight text-white">
                          {record.score.toString().padStart(6, '0')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT BENTO BLOCK (4 spans) - Interactive console panel */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Bento tab trigger cells */}
            <div className="grid grid-cols-3 gap-2 bg-neutral-950 border border-emerald-950 p-1.5 rounded-xl">
              <button
                onClick={() => setActiveTab('neural')}
                className={`py-2 rounded-lg flex flex-col items-center justify-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wide transition-all ${
                  activeTab === 'neural'
                    ? 'bg-emerald-500 text-black font-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-zinc-500 hover:text-emerald-400'
                }`}
              >
                <Cpu className="h-3.5 w-3.5" />
                NEURAL
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 rounded-lg flex flex-col items-center justify-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wide transition-all ${
                  activeTab === 'settings'
                    ? 'bg-emerald-500 text-black font-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-zinc-500 hover:text-emerald-400'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                SETTINGS
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`py-2 rounded-lg flex flex-col items-center justify-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wide transition-all ${
                  activeTab === 'manual'
                    ? 'bg-emerald-500 text-black font-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-zinc-500 hover:text-emerald-400'
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                MANUAL
              </button>
            </div>

            {/* Active Switcher Board view holding component cards */}
            <div className="shadow-lg">
              {activeTab === 'neural' && (
                <TeachableController
                  modelConfig={modelConfig}
                  onChangeConfig={handleUpdateModelConfig}
                  onAction={handleActionInput}
                  settings={settings}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsMenu
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onClearHighScores={handleClearHighScores}
                />
              )}

              {activeTab === 'manual' && (
                <Instructions />
              )}
            </div>

            {/* Mini environmental diagnostic Bento card */}
            <div className="bg-neutral-950 border border-emerald-950/40 rounded-2xl p-4 font-mono text-[10px] space-y-2.5">
              <div className="flex justify-between items-center text-emerald-800">
                <span className="uppercase">ENVIRONMENT_TELEMETRY</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-neutral-400">
                <div className="p-2 border border-emerald-950 bg-neutral-900/30 rounded-lg">
                  <p className="text-[8px] text-zinc-500 uppercase">LOCAL STATE</p>
                  <p className="font-bold text-white text-[10px] truncate">PERSISTED</p>
                </div>
                <div className="p-2 border border-emerald-950 bg-neutral-900/30 rounded-lg">
                  <p className="text-[8px] text-zinc-500 uppercase">DIFFICULTY</p>
                  <p className="font-bold text-emerald-400 text-[10px]">DYNAMIC_SCALING</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Cyberpunk Footer bar */}
      <footer className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-12 text-center text-[9px] text-zinc-600 font-mono tracking-wider">
        <span>🤖 GESTURE CONSOLE DRIVER LOADED • LOCAL STORAGE PERSISTENCE: ON • ACTIVE RENDER MODE: NEON BENTO DX</span>
      </footer>
    </div>
  );
}

