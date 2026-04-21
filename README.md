# Risør Kammermusikkfest Website

Bilingual (Norwegian/English) festival website built with Astro and Sanity CMS.

## Quick Start

Use Node.js `22.x` LTS.

```bash
npm install
npm run typegen
npm run dev:studio    # http://localhost:3333
npm run dev:frontend  # http://localhost:4321
```

Create `frontend/.env.local` from `frontend/.env.example` before running the frontend against real content.

## Core Scripts

```bash
npm run build
npm run test
npm run lint
npm run typecheck
```

Deployment flow: `feature/* -> staging -> main`
Feature branches squash into `staging`; production promotion from `staging` to `main` should preserve ancestry and then sync `staging` to the released `main` tip.

## Repo Layout

```
frontend/   Astro frontend and generated Sanity types
studio/     Sanity Studio and schema definitions
docs/       Human-facing project documentation
.ai/        AI workflows, instructions, specialists, and memory
```

## Read Next

- [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) for the full developer handbook
- [AGENTS.md](AGENTS.md) for the minimal repo briefing used by AI assistants
- [.ai/README.md](.ai/README.md) for repo-owned AI workflows and instructions

## Build

```bash
npm run build
```
