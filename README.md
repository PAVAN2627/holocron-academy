# Holocron Academy

Holocron Academy is a Next.js 14 (App Router) project built for the UI Strikes Back Hackathon.

The core idea: register learning modules as **generative UI components** with Tambo, then let natural-language prompts render the right UI at the right time.

## Stack

- Next.js 14 (App Router)
- Tailwind CSS
- shadcn/ui
- Tambo React SDK (`@tambo-ai/react`)
- Package manager: Bun (`bun.lock`, `packageManager` in `package.json`)

## Local dev

```bash
bun install
bun dev
```

Then open http://localhost:3000.

### Tambo API key

To enable the in-app "Tambo Console", set:

```bash
NEXT_PUBLIC_TAMBO_API_KEY=...your_key...
```

This is read in `src/config/env.ts` and passed into `TamboProvider` (client-side). Treat it as a public key.

If the key is not set, the home page still renders the demo modules, but the Tambo chat UI is hidden.

## What’s implemented

### Tambo provider + config

- `src/app/providers.tsx` wraps the app with `TamboProvider` (only when a public API key is present).
- `src/tambo/tamboConfig.tsx` exports `tamboComponents` (the registered component list):
  - `AdaptiveQuiz`
  - `GalaxyModule`
  - `DroidCodeLab`

### Modules

- `AdaptiveQuiz` (`src/components/tambo/AdaptiveQuiz.tsx`)
  - Validates answers with a Zod schema
  - Triggers a `LessonSlide` when the score is below 60%
- `GalaxyModule` (`src/components/tambo/GalaxyModule.tsx`)
  - Renders "planets" as learning milestones
- `DroidCodeLab` (`src/components/tambo/DroidCodeLab.tsx`)
  - Live code editor that highlights syntax errors in "Sith Red"

### Galactic Terminal theme

The CRT scanline / terminal vibe lives in `src/app/globals.css` via the `galactic-terminal` body class.

## About Charlie

This repo was initialized and scaffolded by Charlie (autonomous engineering) working from a GitHub issue task.
