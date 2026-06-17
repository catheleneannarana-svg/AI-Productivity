# AGENTS.md

## What lives here
This repository is built and maintained with the help of AI coding agents, including Google's **Antigravity** agent. This file serves as the core onboarding document, style guide, and operational ruleset for agents operating on this codebase.

---

## 🎮 Project Overview: Neon-Runner
**Neon-Runner** is a Teachable Machine model-driven gesture platformer game built using React 19, TypeScript, and Vite. The UI is designed with a premium, cyber-neon bento-grid aesthetic. It classifies real-time video feeds from a webcam via Teachable Machine models to trigger in-game commands (e.g., jumping, ducking) to dodge obstacles.

### Key Directory Structure
*   `src/App.tsx`: Core game orchestration, bento UI layouts, global tab navigation, and localStorage state synchronization.
*   `src/components/`:
    *   [GameCanvas.tsx](file:///c:/Users/DTC%20USER/Desktop/Arana/AI-Productivity/src/components/GameCanvas.tsx): HTML5 Canvas game rendering, player physics, obstacle collision checks, and game loop.
    *   [TeachableController.tsx](file:///c:/Users/DTC%20USER/Desktop/Arana/AI-Productivity/src/components/TeachableController.tsx): Webcam interface, TensorFlow.js / Teachable Machine classifier loader, prediction loop.
    *   [SettingsMenu.tsx](file:///c:/Users/DTC%20USER/Desktop/Arana/AI-Productivity/src/components/SettingsMenu.tsx): Config for prediction interval, volume, sensitivity, and resetting scores.
    *   [Instructions.tsx](file:///c:/Users/DTC%20USER/Desktop/Arana/AI-Productivity/src/components/Instructions.tsx): UI rules manual for human runners.
*   `src/types.ts`: Application type definitions (e.g. `GameState`, `GameSettings`, `ScoreRecord`).
*   `src/audio.ts`: Web Audio API synthesizer for retro-style in-game sounds.
*   `src/index.css`: Tailwinds and CSS variables establishing the cyberpunk bento aesthetic.

---

## 🛠️ Developer Setup & Commands
Ensure you run the following commands to test code correctness:
- **Install Dependencies**: `npm install`
- **Start Local Server**: `npm run dev` (running at `http://localhost:3000`)
- **Lint/Type Check**: `npm run lint` (runs `tsc --noEmit`)
- **Build Production Bundle**: `npm run build`

### Environment Variables
Setup a local configuration by copying `.env.example` to `.env.local`:
- `GEMINI_API_KEY`: Required for Gemini AI API integrations.
- `APP_URL`: Local or production server URL.

---

## 🤖 Agentic Workflow Guidelines

### 1. Task Lifecycle
- **Read Backlog**: Before starting work, review [TASKS.md](file:///c:/Users/DTC%20USER/Desktop/Arana/AI-Productivity/TASKS.md).
- **Update Status**: Set task status to `[/]` (in-progress) and `[x]` (completed) as you proceed. Do not leave the backlog stale.
- **Write Plans**: For complex architectural changes, write a draft plan to `implementation_plan.md` and await user approval before proceeding.

### 2. Prompt Documentation
- Use [PROMPTS.md](file:///c:/Users/DTC%20USER/Desktop/Arana/AI-Productivity/PROMPTS.md) to record prompts that generated production code, citing the date, model, prompt intent, and output quality evaluation.

### 3. Coding & Styling Standards
- **TypeScript**: Strictly enforce typing; do not use `any` unless absolutely unavoidable. All configuration modifications must update [types.ts](file:///c:/Users/DTC%20USER/Desktop/Arana/AI-Productivity/src/types.ts).
- **Tailwind CSS v4**: Leverage Tailwind for styling. Keep the cyber bento visual identity consistent (utilize `emerald` neon borders, dark backgrounds `bg-black` or `bg-neutral-950`, and monospace styling `font-mono`).
- **Aesthetic Excellence**: Ensure high responsiveness, elegant dark-mode UI, and micro-interactions/animations (`motion` library).

---

## 🛡️ Responsible AI Rules
- **Human Review**: Every model output must be reviewed by a human before it is merged.
- **Data Protection**: Do not hardcode or commit credentials, API keys, or personal data to source control. Use environment variables.
- **Escalation**: If a model or agent produces wrong outputs, gets stuck in an execution loop, or behaves unexpectedly, stop the command execution immediately and prompt the user for direction.
- **Dual Verification**: High-risk changes (e.g. integrations, authentication, payment code) require a secondary human reviewer.
