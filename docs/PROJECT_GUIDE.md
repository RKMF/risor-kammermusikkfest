# Project Guide

This guide covers intent, constraints, and workflow rules. Use code, config, manifests, and schema files as the source of truth for implementation details.

## 1. Philosophy

This is a production festival site. Simplicity means focused, maintainable, and safe.

Non-negotiable standards:
- security and secret hygiene
- readable code and working types
- accessibility and semantic HTML
- deliberate dependency changes
- verification on critical paths

This project is:
- a bilingual festival website with real editorial workflows
- a repo that favors stable patterns over novelty
- a site where publishing behavior matters as much as frontend output

This project is not:
- a playground for speculative abstraction
- a place to weaken validation or editorial safety to move faster
- a repo where framework churn is treated as progress

Decision order:
1. Preserve security and editorial correctness.
2. Solve a real user or maintainer problem.
3. Choose the simplest professional solution for this site.

## 2. Source of Truth

Prefer these files over prose when you need implementation facts:
- `package.json`, `frontend/package.json`, `studio/package.json`
- `frontend/astro.config.mjs`
- `studio/sanity.config.ts`
- frontend and Studio source files

Documentation roles:
- `README.md`: front door for humans
- `AGENTS.md`: minimal repo-wide AI briefing
- `.ai/`: workflows, instructions, specialists, and memory
- `docs/PROJECT_GUIDE.md`: intent, constraints, and non-obvious rules

If a rule is obvious from code or config, link to the source or fix the structure instead of duplicating it here.

## 3. Project-Specific Constraints

### Editorial and content rules
- Norwegian is the source language.
- English should mirror Norwegian structure unless there is a deliberate reason not to.
- Keep content modeling schema-led and editor-friendly.
- Custom Studio actions and publishing behavior are part of the editorial contract; verify them after relevant Studio changes.

### Frontend architecture
- The site favors server-rendered Astro plus small amounts of targeted client behavior.
- HTMX is a deliberate choice for server-shaped interactions; do not replace simple HTMX flows with heavier client-state patterns without a real need.
- HTMX is self-hosted and must go through the repo's sync/check workflow when updated.

### Type generation
- Sanity schema changes require regenerating and committing `frontend/sanity/sanity.types.ts`.
- Treat generated Sanity types as part of the schema contract, not disposable local output.

### Development sessions
- Read files before editing them.
- Fresh sessions should use the repo workflows in `.ai/workflows/` rather than relying on memory.
- Starting dev servers from the monorepo root is not the reliable default for fresh sessions.

## 4. Workflow Rules

### Git and release flow
- Start work from `staging`, not `main`.
- Release flow is `feature/* -> staging -> main`.
- `staging` and `main` are permanent branches tied to deployments and must not be deleted.
- Use squash merge for disposable work branches into `staging`.
- Use a merge commit for `staging` → `main` so production promotes the exact tested branch history.
- After production release, sync `staging` back to the released `main` tip so the permanent branches stay ancestry-aligned.
- Use the repo workflows for preparation and release:
  - `.ai/workflows/preparation.md`
  - `.ai/workflows/dev-release.md`
  - `.ai/workflows/live-release.md`

### Verification expectations
- Verify the area you changed before finishing.
- Dependency, config, schema, and build-tooling changes require local frontend and Studio verification.
- Studio schema changes require more than type-checking; verify the editorial behavior they affect.

### Dependency changes
- Treat package updates as maintenance work, not background churn.
- Prefer intentional upgrades over broad updates.
- Treat major upgrades as migrations with explicit verification.
- Keep shared build-tooling at the root and runtime ownership in `frontend/` or `studio/`.

## 5. AI and Documentation Usage

Use the smallest layer that fits the task:
- `AGENTS.md` for baseline repo constraints
- `.ai/workflows/` for procedures
- `.ai/instructions/` for stable standards
- `.ai/specialists/` for domain-specific judgment
- `.ai/memory/` for repeated gotchas and durable decisions

Good documentation candidates:
- non-obvious workflow constraints
- repeated failure modes
- architectural choices that are easy to undo accidentally
- rationale for patterns that would otherwise look arbitrary

Bad documentation candidates:
- framework tutorials
- config inventories
- values copied from manifests or config files
- commentary that merely narrates what the code already shows

## 6. File Placement Rules

Keep files at the repo root only when they are one of:
- a product root
- shared workspace infrastructure
- deploy or CI configuration
- a first-contact document

This repo intentionally treats `.ai/` as first-class shared infrastructure. Tool-specific files should stay at root only when the tool requires that placement for correct repo-scoped behavior.
