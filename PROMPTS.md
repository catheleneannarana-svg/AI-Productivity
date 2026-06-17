# PROMPTS.md

> A personal library of every prompt that worked (or didn't). Date, model, intent, prompt, output quality (1-5).

## M1 — Model comparison
- **Date:** 2026-06-15
- **Model:** Gemini 2.0 Flash
- **Intent:** Compare models on EU AI Act summary
- **Prompt:** `"Summarise the EU AI Act in 5 bullets and cite the articles."`
- **Output quality:** 4/5 — accurate but missing recency.

## M3 — RTCF refactor
- **Date:** 2026-06-15
- **Model:** Gemini
- **Intent:** Rewrite a sloppy prompt using RTCF
- **Prompt:** `"Role: senior policy analyst. Task: summarise. Context: ... Format: ..."`
  - **Output quality:** 5/5

## Agent setup
[AGENTS.md](file:///c:/Users/DTC%20USER/Desktop/Arana/AI-Productivity/AGENTS.md) — updated for agentic coding guidelines.

## M4 — Local Teachable Machine model wiring
- **Date:** 2026-06-17
- **Model:** Antigravity (Google DeepMind)
- **Intent:** Wire bundled /model/ Teachable Machine files to game controls; happy→JUMP, sad→DUCK.
- **Prompt:** `"I added the model files from teachable machine. Use the model to control the runner. Use happy for jump, and use Sad for crouch."`
- **Changes:** vite.config.ts publicDir set to project root; TeachableController updated with LOCAL_MODEL_URL constant, emotion keyword auto-mapping, urlOverride in connectModel(), and quick-connect UI button.
- **Output quality:** 5/5 — clean refactor, no lint errors, preserves all existing manual URL flow.