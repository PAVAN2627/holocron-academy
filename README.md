# Holocron Academy

Core scaffold for **Holocron Academy** (UI Strikes Back Hackathon): a Next.js 14 App Router project with Tailwind + shadcn/ui, powered by **Tambo** for Generative UI.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Tambo React SDK (`@tambo-ai/react`)

## Getting started

Install deps:

```bash
pnpm install
```

Create a local env file:

```bash
cp .env.example .env.local
```

Set the key:

```bash
NEXT_PUBLIC_TAMBO_API_KEY=...
```

Run the dev server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Tambo integration

We register three components (with Zod prop schemas) in `src/tambo/config.ts`:

- `AdaptiveQuiz`: schema-driven question list + grading. If the user's score is below `passingScorePercent` (default 60%), the quiz renders a `LessonSlide` remediation.
- `GalaxyModule`: progress tracker that renders milestones as planets.
- `DroidCodeLab`: live code editor with syntax validation; errors are highlighted in **Sith Red**.

The provider wiring lives in `src/app/providers.tsx`.

For Agent-mode streaming, there is also a Mastra-powered route at `src/app/api/tambo/route.ts`.

## Galactic Terminal theme

The "Wow" CRT/scanline theme is implemented in `src/app/globals.css` and applied via the `galactic-terminal` class on `<body>`.

## Built with Charlie

This repo was initialized and scaffolded autonomously (project setup, UI structure, and the initial Tambo registry/components) by Charlie.
