import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2, Trophy, HelpCircle, Sparkles } from 'lucide-react';
import { GameState, GameAction, GameSettings, Player, Obstacle, Collectible, BackgroundElement, Particle, ScoreRecord } from '../types';
import { playJumpSound, playSlideSound, playCoinSound, playExplosionSound } from '../audio';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  activeAction: GameAction;
  settings: GameSettings;
  score: number;
  setScore: (score: number) => void;
  highScores: ScoreRecord[];
  onNewHighScore: (newScore: number) => void;
  isTeachableActive: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 300;
const GROUND_Y = 240;

export default function GameCanvas({
  gameState,
  setGameState,
  activeAction,
  settings,
  score,
  setScore,
  highScores,
  onNewHighScore,
  isTeachableActive
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 });
  const [localHighScore, setLocalHighScore] = useState<number>(0);
  
  // Game Loop references
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // Dynamic Game State values in refs for the loop
  const playerRef = useRef<Player>({
    x: 80,
    y: GROUND_Y - 45,
    width: 34,
    height: 45,
    vy: 0,
    gravity: 0.55,
    jumpForce: -10,
    isGrounded: true,
    status: 'running',
    animFrame: 0,
    animTimer: 0
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const backgroundElementsRef = useRef<BackgroundElement[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  // Spawning frequencies and timers
  const obstacleTimerRef = useRef<number>(0);
  const coinTimerRef = useRef<number>(0);
  const gameSpeedRef = useRef<number>(5);
  const scoreAccumulatorRef = useRef<number>(0);
  const canDoubleJumpRef = useRef<boolean>(true);

  // Read latest activeAction in reference to avoid closure bindings in the requestAnimationFrame loop
  const activeActionRef = useRef<GameAction>('NONE');
  const prevActionRef = useRef<GameAction>('NONE');

  useEffect(() => {
    activeActionRef.current = activeAction;
  }, [activeAction]);

  // Load local high score on start
  useEffect(() => {
    if (highScores.length > 0) {
      setLocalHighScore(Math.max(...highScores.map(h => h.score)));
    }
  }, [highScores]);

  // Listen for resize and keep canvas scaled
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleResize = () => {
      const containerWidth = containerRef.current?.getBoundingClientRect().width || 800;
      // Keep ratio 800:300
      const calculatedHeight = Math.min(300, (containerWidth * 300) / 800);
      setDimensions({
        width: containerWidth,
        height: calculatedHeight
      });
    };

    handleResize();
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;

      const key = e.key.toLowerCase();
      const jumpKey = settings.keyboardControls.jump.toLowerCase();
      const duckKey = settings.keyboardControls.duck.toLowerCase();

      if (key === jumpKey || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        triggerPlayerJump();
      } else if (key === duckKey || e.key === 'ArrowDown') {
        e.preventDefault();
        triggerPlayerDuck(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      const key = e.key.toLowerCase();
      const duckKey = settings.keyboardControls.duck.toLowerCase();

      if (key === duckKey || e.key === 'ArrowDown') {
        triggerPlayerDuck(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, settings]);

  // Handle Teachable machine edge-triggered inputs
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const currentAction = activeAction;
    const prevAction = prevActionRef.current;

    if (currentAction !== prevAction) {
      // Edge trigger JUMP
      if (currentAction === 'JUMP') {
        triggerPlayerJump();
      }
      
      // Toggle ducking state
      if (currentAction === 'DUCK') {
        triggerPlayerDuck(true);
      } else if (prevAction === 'DUCK') {
        triggerPlayerDuck(false);
      }

      prevActionRef.current = currentAction;
    }
  }, [activeAction, gameState]);

  // Jump trigger code block
  const triggerPlayerJump = () => {
    const p = playerRef.current;
    if (p.isGrounded) {
      p.vy = p.jumpForce;
      p.isGrounded = false;
      p.status = 'jumping';
      canDoubleJumpRef.current = true;
      playJumpSound(settings.volume);
      // Spawn lift-off particles
      spawnParticles(p.x + p.width/2, GROUND_Y, '#94a3b8', 8);
    } else if (canDoubleJumpRef.current) {
      // Double jump!
      p.vy = p.jumpForce * 0.85; // Slightly weaker double jump
      canDoubleJumpRef.current = false;
      playJumpSound(settings.volume);
      spawnParticles(p.x + p.width/2, p.y + p.height, '#38bdf8', 12);
    }
  };

  // Duck trigger code block
  const triggerPlayerDuck = (isDucking: boolean) => {
    const p = playerRef.current;
    if (isDucking) {
      p.status = 'ducking';
      // Adjust dimensions immediately so collider boxes compress
      p.width = 44;
      p.height = 28;
      p.y = GROUND_Y - 28;
      // Fast fall if airbome
      if (!p.isGrounded) {
        p.vy = 8; // slamming speed down
        spawnParticles(p.x + p.width/2, p.y, '#e0f2fe', 4);
      } else {
        playSlideSound(settings.volume);
      }
    } else {
      p.status = 'running';
      p.width = 34;
      p.height = 45;
      p.y = GROUND_Y - 45;
    }
  };

  // Particles generator
  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: (Math.sin(angle) * speed) - 1.5, // bias upward
        color,
        size: 2 + Math.random() * 4,
        life: 1.0,
        maxLife: 30 + Math.random() * 40
      });
    }
  };

  // Initialize elements for game start
  const resetGame = () => {
    playerRef.current = {
      x: 80,
      y: GROUND_Y - 45,
      width: 34,
      height: 45,
      vy: 0,
      gravity: 0.55,
      jumpForce: -10.5,
      isGrounded: true,
      status: 'running',
      animFrame: 0,
      animTimer: 0
    };

    obstaclesRef.current = [];
    collectiblesRef.current = [];
    particlesRef.current = [];
    
    // Seed background elements (clouds & distant structures)
    backgroundElementsRef.current = [
      { x: 100, y: 50, width: 60, height: 20, speed: 0.2, type: 'CLOUD' },
      { x: 350, y: 70, width: 80, height: 25, speed: 0.3, type: 'CLOUD' },
      { x: 600, y: 40, width: 50, height: 18, speed: 0.15, type: 'CLOUD' },
      { x: 150, y: 160, width: 120, height: 80, speed: 0.5, type: 'MOUNTAIN' },
      { x: 500, y: 165, width: 150, height: 75, speed: 0.4, type: 'RUINS' }
    ];

    gameSpeedRef.current = 5.2;
    scoreAccumulatorRef.current = 0;
    setScore(0);
    obstacleTimerRef.current = 0;
    coinTimerRef.current = 0;
    canDoubleJumpRef.current = true;
    prevActionRef.current = 'NONE';
  };

  const startGame = () => {
    resetGame();
    setGameState('PLAYING');
    lastTimeRef.current = performance.now();
  };

  const handleGameOver = () => {
    setGameState('GAMEOVER');
    playerRef.current.status = 'crashed';
    playExplosionSound(settings.volume);
    
    // Crash debris blowout
    const p = playerRef.current;
    spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#ef4444', 25);
    spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#f59e0b', 15);
    
    // Cancel animation loop
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    // Process high scores
    onNewHighScore(score);
  };

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const elapsed = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      update(elapsed);
      render(ctx);

      if (gameState === 'PLAYING') {
        requestRef.current = requestAnimationFrame(gameLoop);
      }
    };

    if (gameState === 'PLAYING') {
      requestRef.current = requestAnimationFrame(gameLoop);
    } else {
      // If we are on START or GAMEOVER screen, render static scenery in idle mode
      render(ctx);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState, dimensions, settings.darkMode]);

  // Updating Physics states
  const update = (elapsed: number) => {
    const activeTM = isTeachableActive;
    
    // 1. Progress current score over frames
    scoreAccumulatorRef.current += 1;
    if (scoreAccumulatorRef.current >= 5) {
      setScore(score + 1);
      scoreAccumulatorRef.current = 0;
      
      // Speed up game slowly
      if (score > 0 && score % 150 === 0 && gameSpeedRef.current < 12) {
        gameSpeedRef.current += 0.45;
      }
    }

    // Boost running speed if Teachable mapped RUN is active
    let runSpeedMultiplier = 1.0;
    if (activeTM && activeActionRef.current === 'RUN') {
      runSpeedMultiplier = 1.35; // Sprint mode!
    }
    const currentSpeed = gameSpeedRef.current * runSpeedMultiplier;

    // 2. Update Player physics
    const p = playerRef.current;
    
    // Apply gravity
    p.vy += p.gravity;
    p.y += p.vy;

    // Land on ground
    if (p.y >= GROUND_Y - p.height) {
      p.y = GROUND_Y - p.height;
      p.vy = 0;
      p.isGrounded = true;
      if (p.status === 'jumping') {
        p.status = 'running';
      }
    }

    // Character runner legs animation
    p.animTimer += 1;
    if (p.animTimer > (currentSpeed > 8 ? 4 : 6)) {
      p.animFrame = (p.animFrame + 1) % 2;
      p.animTimer = 0;
      
      // Spawn ground puff trail if running
      if (p.isGrounded && p.status === 'running') {
        particlesRef.current.push({
          x: p.x + 4,
          y: GROUND_Y - 2,
          vx: -currentSpeed * 0.4,
          vy: -Math.random() * 0.8,
          color: settings.darkMode ? '#4b5563' : '#cbd5e1',
          size: 2 + Math.random() * 5,
          life: 1.0,
          maxLife: 20 + Math.random() * 15
        });
      }
    }

    // 3. Update Background elements
    backgroundElementsRef.current.forEach(bg => {
      bg.x -= bg.speed * currentSpeed * 0.5;
      if (bg.x + bg.width < 0) {
        bg.x = CANVAS_WIDTH + Math.random() * 100;
        bg.y = bg.type === 'CLOUD' 
          ? 20 + Math.random() * 80 
          : bg.type === 'STAR' 
          ? 10 + Math.random() * 120 
          : bg.y;
      }
    });

    // 4. Update and spawn Obstacles
    obstacleTimerRef.current += 1;
    const minSpawnInterval = Math.max(50, 110 - Math.round(currentSpeed * 4));
    
    if (obstacleTimerRef.current > minSpawnInterval + Math.random() * 80) {
      spawnObstacle();
      obstacleTimerRef.current = 0;
    }

    // Move and filter offscreen obstacles
    const activeObstacles = obstaclesRef.current;
    for (let i = activeObstacles.length - 1; i >= 0; i--) {
      const obs = activeObstacles[i];
      obs.x -= currentSpeed;

      // Animating obstacle wings (Pterodactyl)
      if (obs.type === 'PTERODACTYL') {
        obs.animTimer += 1;
        if (obs.animTimer > 8) {
          obs.animFrame = (obs.animFrame + 1) % 2;
          obs.animTimer = 0;
        }
      }

      // Check pixel collision with Dino
      if (checkCollision(p, obs)) {
        handleGameOver();
        return;
      }

      if (obs.x + obs.width < 0) {
        activeObstacles.splice(i, 1);
      }
    }

    // 5. Update and spawn Collectible Stars
    coinTimerRef.current += 1;
    if (coinTimerRef.current > 180 + Math.random() * 180) {
      spawnCollectible();
      coinTimerRef.current = 0;
    }

    const activeCoins = collectiblesRef.current;
    for (let j = activeCoins.length - 1; j >= 0; j--) {
      const coin = activeCoins[j];
      coin.x -= currentSpeed;
      coin.pulseTimer += 0.1;

      // Check collision with Dino
      if (!coin.collected && checkCollision(p, coin)) {
        coin.collected = true;
        setScore(score + coin.points);
        playCoinSound(settings.volume);
        spawnParticles(coin.x + 8, coin.y + 8, '#fbbf24', 14);
        activeCoins.splice(j, 1);
        continue;
      }

      if (coin.x + coin.width < 0) {
        activeCoins.splice(j, 1);
      }
    }

    // 6. Update particles explosion array
    const activeParticles = particlesRef.current;
    for (let k = activeParticles.length - 1; k >= 0; k--) {
      const prt = activeParticles[k];
      prt.x += prt.vx;
      prt.y += prt.vy;
      prt.life -= 1.0 / prt.maxLife;

      if (prt.life <= 0) {
        activeParticles.splice(k, 1);
      }
    }
  };

  // Obstacle Spawner Configuration
  const spawnObstacle = () => {
    const rand = Math.random();
    let type: Obstacle['type'] = 'CACTUS_S';
    let width = 20;
    let height = 35;
    let y = GROUND_Y - height;

    if (rand < 0.28) {
      type = 'CACTUS_S';
      width = 16;
      height = 34;
      y = GROUND_Y - height;
    } else if (rand < 0.55) {
      type = 'CACTUS_L';
      width = 34;
      height = 42;
      y = GROUND_Y - height;
    } else if (rand < 0.8) {
      type = 'PTERODACTYL';
      width = 32;
      height = 24;
      // High or Mid heights
      y = Math.random() > 0.5 ? GROUND_Y - 26 : GROUND_Y - 60;
    } else {
      type = 'FIRE_PIT';
      width = 24;
      height = 14;
      y = GROUND_Y - height;
    }

    // Do not spawn too close to existing obstacles
    if (obstaclesRef.current.length > 0) {
      const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
      if (CANVAS_WIDTH - lastObs.x < 220) {
        return; // Skip spawning to avoid impossible double barriers
      }
    }

    obstaclesRef.current.push({
      id: Math.random().toString(),
      type,
      x: CANVAS_WIDTH,
      y,
      width,
      height,
      speed: gameSpeedRef.current,
      animFrame: 0,
      animTimer: 0
    });
  };

  // Collectible Coin Spawner Configuration
  const spawnCollectible = () => {
    const h = Math.random() > 0.5 ? GROUND_Y - 25 : GROUND_Y - 68;
    
    // Ensure it doesn't overlap perfectly with an obstacle being coordinates
    collectiblesRef.current.push({
      id: Math.random().toString(),
      collected: false,
      x: CANVAS_WIDTH,
      y: h,
      width: 16,
      height: 16,
      pulseTimer: 0,
      points: 40 // bonus points
    });
  };

  // AABB bounding box collision formula
  const checkCollision = (rect1: { x: number; y: number; width: number; height: number }, rect2: { x: number; y: number; width: number; height: number }) => {
    // Add minor 2px safety padding inside hitbox for pixel-perfection
    const padding = 2;
    return (
      rect1.x + padding < rect2.x + rect2.width - padding &&
      rect1.x + rect1.width - padding > rect2.x + padding &&
      rect1.y + padding < rect2.y + rect2.height - padding &&
      rect1.y + rect1.height - padding > rect2.y + padding
    );
  };

  // Retro Canvas Drawer
  const render = (ctx: CanvasRenderingContext2D) => {
    const isDark = settings.darkMode;
    
    // Fill deep nostalgic background
    ctx.fillStyle = isDark ? '#111827' : '#ecfdf5';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid screen background lines
    ctx.strokeStyle = isDark ? 'rgba(75,85,99,0.08)' : 'rgba(16,185,129,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let j = 0; j < CANVAS_HEIGHT; j += 20) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(CANVAS_WIDTH, j);
      ctx.stroke();
    }

    // Parallax background items
    backgroundElementsRef.current.forEach(bg => {
      if (bg.type === 'CLOUD') {
        ctx.fillStyle = isDark ? 'rgba(55,65,81,0.6)' : 'rgba(255,255,255,0.85)';
        // Draw pixel-style floating block clouds
        ctx.fillRect(bg.x, bg.y, bg.width, bg.height - 4);
        ctx.fillRect(bg.x - 10, bg.y + 4, bg.width + 20, bg.height - 8);
      } else if (bg.type === 'MOUNTAIN') {
        ctx.fillStyle = isDark ? '#1f2937' : '#d1fae5';
        ctx.beginPath();
        ctx.moveTo(bg.x, GROUND_Y);
        ctx.lineTo(bg.x + bg.width/2, bg.y);
        ctx.lineTo(bg.x + bg.width, GROUND_Y);
        ctx.fill();
      } else if (bg.type === 'RUINS') {
        ctx.fillStyle = isDark ? '#182232' : '#a7f3d0';
        ctx.fillRect(bg.x, bg.y, bg.width, GROUND_Y - bg.y);
        // Cut out cute square windows
        ctx.fillStyle = isDark ? '#374151' : '#ecfdf5';
        for (let wx = bg.x + 8; wx < bg.x + bg.width - 8; wx += 16) {
          for (let wy = bg.y + 10; wy < GROUND_Y - 14; wy += 20) {
            ctx.fillRect(wx, wy, 8, 8);
          }
        }
      }
    });

    // Draw Ground Platform strip
    ctx.fillStyle = isDark ? '#374151' : '#059669';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 4);
    
    // Ground Dirt Underlayer
    ctx.fillStyle = isDark ? '#1f2937' : '#10b981';
    ctx.fillRect(0, GROUND_Y + 4, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    // Draw pixel dashes on scrolling ground
    ctx.fillStyle = isDark ? '#4b5563' : '#34d399';
    const offset = (Math.floor(score * 2.5)) % 60;
    for (let gx = -10; gx < CANVAS_WIDTH + 20; gx += 40) {
      ctx.fillRect(gx - offset, GROUND_Y + 12, 12, 3);
      ctx.fillRect(gx - offset + 18, GROUND_Y + 24, 6, 3);
    }

    // Draw Obstacles
    obstaclesRef.current.forEach(obs => {
      if (obs.type === 'CACTUS_S') {
        ctx.fillStyle = isDark ? '#10b981' : '#047857';
        // Left main stalk
        ctx.fillRect(obs.x + 4, obs.y, 8, obs.height);
        // Side branches
        ctx.fillRect(obs.x, obs.y + 10, 5, 4);
        ctx.fillRect(obs.x, obs.y + 6, 4, 8);
        ctx.fillRect(obs.x + 11, obs.y + 14, 5, 4);
        ctx.fillRect(obs.x + 12, obs.y + 10, 4, 8);
      } else if (obs.type === 'CACTUS_L') {
        ctx.fillStyle = isDark ? '#34d399' : '#065f46';
        // Stalk 1
        ctx.fillRect(obs.x + 4, obs.y + 8, 8, obs.height - 8);
        ctx.fillRect(obs.x, obs.y + 16, 5, 4);
        ctx.fillRect(obs.x, obs.y + 12, 4, 8);
        // Stalk 2 (taller main)
        ctx.fillRect(obs.x + 14, obs.y, 8, obs.height);
        ctx.fillRect(obs.x + 21, obs.y + 10, 5, 4);
        ctx.fillRect(obs.x + 22, obs.y + 6, 4, 8);
        // Stalk 3 (short)
        ctx.fillRect(obs.x + 24, obs.y + 18, 6, obs.height - 18);
      } else if (obs.type === 'PTERODACTYL') {
        ctx.fillStyle = isDark ? '#f43f5e' : '#be123c';
        // Main flat wingless body block
        ctx.fillRect(obs.x + 4, obs.y + 6, 22, 10);
        // Beak
        ctx.fillRect(obs.x, obs.y + 8, 5, 4);
        // Animated wing flap
        if (obs.animFrame === 0) {
          // Wing Up
          ctx.fillRect(obs.x + 10, obs.y, 8, 7);
        } else {
          // Wing Down
          ctx.fillRect(obs.x + 10, obs.y + 15, 8, 7);
        }
      } else if (obs.type === 'FIRE_PIT') {
        // Red charcoal container
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obs.x, obs.y + 8, obs.width, obs.height - 8);
        // Yellow animated crackling fire flames
        ctx.fillStyle = '#f59e0b';
        const numFlames = Math.floor(obs.width / 4);
        const cycle = Math.floor(score / 3) % 4;
        for (let fx = 0; fx < numFlames; fx++) {
          const flameH = 4 + ((fx + cycle) % 5) * 2;
          ctx.fillRect(obs.x + fx * 4, obs.y + 8 - flameH, 3, flameH);
        }
      }
    });

    // Draw Coins / Stars
    collectiblesRef.current.forEach(coin => {
      // Glow pulse shimmer effect
      const breathe = Math.sin(coin.pulseTimer) * 2;
      ctx.fillStyle = '#fbbf24'; // beautiful pure gold
      
      // Draw pixelated star/coin shape
      const cx = coin.x;
      const cy = coin.y + breathe;
      ctx.fillRect(cx + 5, cy, 6, 16);
      ctx.fillRect(cx, cy + 5, 16, 6);
      ctx.fillRect(cx + 3, cy + 3, 10, 10);
      
      // Star core highlight shiny
      ctx.fillStyle = '#fffdf5';
      ctx.fillRect(cx + 6, cy + 6, 4, 4);
    });

    // Draw Running Particles
    particlesRef.current.forEach(prt => {
      ctx.fillStyle = prt.color;
      ctx.globalAlpha = prt.life;
      ctx.fillRect(prt.x, prt.y, prt.size, prt.size);
    });
    ctx.globalAlpha = 1.0; // reset transparency

    // Draw beautiful 8-Bit Pixel Player Dino
    const p = playerRef.current;
    ctx.fillStyle = isDark ? '#f3f4f6' : '#1f2937';

    if (p.status === 'crashed') {
      // Draw dead dino with spinning spiral eyes
      ctx.fillRect(p.x, p.y + 10, p.width, p.height - 10);
      ctx.fillStyle = '#ef4444'; // Red collision highlights
      ctx.fillRect(p.x + 6, p.y + 16, 4, 4);
      ctx.fillRect(p.x + p.width - 12, p.y + 16, 4, 4);
    } else if (p.status === 'ducking') {
      // Ducking player blockier shape
      ctx.fillRect(p.x, p.y, p.width, p.height);
      // Eye block
      ctx.fillStyle = isDark ? '#111827' : '#ecfdf5';
      ctx.fillRect(p.x + p.width - 10, p.y + 6, 4, 4);
    } else {
      // Normal running/jumping posture
      // Main head block
      ctx.fillRect(p.x + 10, p.y, 22, 16);
      // Neck of Dino
      ctx.fillRect(p.x + 10, p.y + 14, 18, 8);
      // Belly trunk body of Dino
      ctx.fillRect(p.x, p.y + 20, 26, 16);
      // Tiny arm claw
      ctx.fillRect(p.x + 24, p.y + 22, 6, 3);
      // Tail
      ctx.fillRect(p.x - 4, p.y + 22, 6, 6);
      
      // Eye block
      ctx.fillStyle = isDark ? '#111827' : '#ecfdf5';
      ctx.fillRect(p.x + 24, p.y + 4, 4, 4);

      // Alternating legs
      ctx.fillStyle = isDark ? '#f3f4f6' : '#1f2937';
      if (p.isGrounded && p.status === 'running') {
        if (p.animFrame === 0) {
          // Left Foot down, Right Foot up
          ctx.fillRect(p.x + 4, p.y + 36, 6, 9);
          ctx.fillRect(p.x + 16, p.y + 36, 6, 5);
        } else {
          // Right Foot down, Left Foot up
          ctx.fillRect(p.x + 4, p.y + 36, 6, 5);
          ctx.fillRect(p.x + 16, p.y + 36, 6, 9);
        }
      } else {
        // Airborne pose: feet tucked tightly
        ctx.fillRect(p.x + 4, p.y + 36, 6, 6);
        ctx.fillRect(p.x + 16, p.y + 36, 6, 6);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Visual Canvas Framing */}
      <div 
        ref={containerRef}
        className="relative w-full border-2 border-emerald-950 bg-[#02231c]/10 rounded-2xl overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.6)]"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block w-full h-auto pixelated select-none"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Live Active Neural Indicator inside Canvas corner */}
        {isTeachableActive && gameState === 'PLAYING' && (
          <div className="absolute top-4 left-4 bg-emerald-950/95 border border-emerald-500/45 backdrop-blur-md px-2.5 py-1 flex items-center gap-1.5 font-mono text-[8px] tracking-widest text-emerald-400 uppercase rounded-lg shadow select-none">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-350"></span>
            </span>
            TM_NEURAL_LINKED
          </div>
        )}

        {/* Canvas overlays depending on Game State */}
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
            <div className="flex gap-1 mb-2 items-center justify-center px-4 py-2 border border-emerald-950/80 text-emerald-400 bg-neutral-900/95 font-mono text-center animate-pulse tracking-tight text-[10px] uppercase rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
              <span>TEACHABLE GESTURE DEMO INTERFACE</span>
            </div>
            
            <h1 className="font-mono text-lg md:text-2xl font-black text-white uppercase tracking-wider mb-4 text-shadow-glow">
              8-BIT TEACHABLE DINO
            </h1>
            
            {/* Play button */}
            <button
              onClick={startGame}
              className="group border border-emerald-500/20 hover:border-emerald-400 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 font-mono text-xs font-black tracking-widest uppercase rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] active:translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Play className="h-4 w-4 shrink-0 fill-current" />
              EXECUTE_RUN.bin (START)
            </button>

            <span className="mt-4 font-mono text-[8.5px] text-emerald-800 tracking-wider">
              {isTeachableActive ? 'CONTROLS OVERRIDE: YOUR CUSTOM WEBCAM POSES_SYS' : 'CONTROLS DETECTED: [SPACE/UP] JUMP • [DOWN] DUCK'}
            </span>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
            <span className="font-mono text-red-500 text-xs tracking-widest uppercase font-black animate-pulse mb-1">
              SYSTEM_CRASH_DETECTED
            </span>
            <h1 className="font-mono text-2xl font-black text-white uppercase tracking-widest mb-2">
              GAME OVER
            </h1>
            
            <div className="font-mono text-[10px] text-zinc-300 uppercase shrink-0 px-4 py-2 border border-emerald-950 bg-black/90 rounded-xl mb-4 max-w-xs w-full">
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">FINAL_SCORE:</span>
                <span className="font-bold text-emerald-400">{score}</span>
              </div>
              <div className="flex justify-between gap-4 mt-0.5">
                <span className="text-zinc-500">HI_SCORE:</span>
                <span className="font-bold text-cyan-400">{localHighScore}</span>
              </div>
            </div>

            {/* Restart button */}
            <button
              onClick={startGame}
              className="group border border-emerald-500/20 hover:border-emerald-400 bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2.5 font-mono text-xs font-black tracking-widest uppercase rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] active:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              REDEPLOY_RUN.sh
            </button>
          </div>
        )}
      </div>

      {/* Visual Stats Board below canvas */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="border border-emerald-950 bg-neutral-950 rounded-xl p-3 font-mono shadow-[0_4px_12px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center">
          <span className="text-[8px] text-emerald-800 uppercase tracking-widest">LIVE_CORE_SCORE</span>
          <span className="text-lg font-black text-white leading-tight">
            {score.toString().padStart(5, '0')}
          </span>
        </div>

        <div className="border border-emerald-950 bg-neutral-950 rounded-xl p-3 font-mono shadow-[0_4px_12px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center">
          <span className="text-[8px] text-emerald-800 uppercase tracking-widest flex items-center gap-1">
            <Trophy className="h-3 w-3 text-cyan-400 shrink-0" /> PEAK_ALL_TIME_HIGH
          </span>
          <span className="text-lg font-black text-cyan-400 leading-tight">
            {localHighScore.toString().padStart(5, '0')}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 border border-emerald-950 bg-neutral-950 rounded-xl p-3 font-mono shadow-[0_4px_12px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center gap-0.5">
          <span className="text-[8px] text-emerald-800 uppercase tracking-widest">ACTIVE_DRIVER_LINK</span>
          <span className={`text-[10px] font-black uppercase flex items-center gap-1 truncate max-w-full ${isTeachableActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {isTeachableActive ? '🤖 TM_NEURAL_INF' : '⌨️ KEYBOARD_PORT'}
          </span>
        </div>
      </div>
    </div>
  );
}
