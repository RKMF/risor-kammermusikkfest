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
- Shared AI guidance should live in repo-owned files (`AGENTS.md`, `.ai/`, `docs/`), not tool-specific folders.
