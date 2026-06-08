# Decisions

Durable project decisions that future sessions are likely to need.

Use this file for:
- architectural choices with reasoning
- workflow decisions that affect implementation
- repo conventions that are easy to miss from local inspection alone

Do not use this file for:
- session notes
- temporary experiments
- facts already obvious from the codebase

## Current Decisions

- Feature work starts from `staging`, and production releases flow through `staging -> main`.
- Disposable feature/fix/chore branches squash into `staging`; permanent-branch promotion from `staging` to `main` uses a merge commit and then syncs `staging` back to `main`.
- Sanity schema changes require root-level `npm run typegen`, and the generated `frontend/sanity/sanity.types.ts` stays tracked.
- The monorepo uses one root npm lockfile, and dependency updates should be produced under the pinned repo runtime (`.nvmrc` + root `packageManager`) so `npm ci` stays deterministic in CI.
- The root npm `overrides.sanity` entry is intentional and should only move during deliberate Studio/Sanity maintenance so the Studio dependency tree stays on one Sanity release line.
- Runtime pin changes are deliberate maintenance: review them during dependency/tooling updates, move `.nvmrc` and root `package.json` together, and verify with `npm ci`, tests, and builds under the proposed runtime before accepting the new baseline.
- Shared AI guidance should live in repo-owned files (`AGENTS.md`, `.ai/`, `docs/`), not tool-specific folders.
