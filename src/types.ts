/**
 * Types & Interfaces for 8-Bit Teachable Platformer
 */

export type GameState = 'START' | 'PLAYING' | 'GAMEOVER' | 'CALIBRATING';

export type GameAction = 'JUMP' | 'DUCK' | 'RUN' | 'NONE';

export interface GameSettings {
  sensitivity: number;        // Confidence threshold (0.0 to 1.0)
  predictionInterval: number; // Delay in ms between predictions (e.g., 100ms)
  volume: number;             // Audio volume (0 to 1)
  darkMode: boolean;          // Theme flag
  keyboardControls: {
    jump: string;             // Speed keys
    duck: string;
  };
}

export interface ScoreRecord {
  score: number;
  date: string;
  isTeachableModel: boolean;
  playerName: string;
}

export interface ClassMapping {
  className: string;
  action: GameAction;
}

export interface TeachableModelConfig {
  modelUrl: string;
  modelType: 'image' | 'pose';
  isPlaying: boolean;
  classes: string[];
  mappings: Record<string, GameAction>; // map className -> GameAction
}

export interface GameEntity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends GameEntity {
  vy: number;
  gravity: number;
  jumpForce: number;
  isGrounded: boolean;
  status: 'running' | 'jumping' | 'ducking' | 'crashed';
  animFrame: number;
  animTimer: number;
}

export type ObstacleType = 'CACTUS_S' | 'CACTUS_L' | 'PTERODACTYL' | 'FIRE_PIT';

export interface Obstacle extends GameEntity {
  id: string;
  type: ObstacleType;
  speed: number;
  animFrame: number;
  animTimer: number;
}

export interface Collectible extends GameEntity {
  id: string;
  collected: boolean;
  pulseTimer: number;
  points: number;
}

export interface BackgroundElement {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'CLOUD' | 'STAR' | 'MOUNTAIN' | 'RUINS';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number; // 0 to 1 decay
  maxLife: number;
}
