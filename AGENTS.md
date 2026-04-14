# Agent Briefing

This is the canonical AI-agnostic briefing for this repository. Keep it short, current, and limited to repo-specific guidance that an agent cannot reliably infer from the codebase alone.

## Core Rules

- Read files before editing them. Do not work from memory or prior session assumptions.
- Keep changes simple, stable, and compatible with current editorial workflows.
- Prefer project-scoped MCP integrations when they provide better access than CLI or web search.
- Do not add new documentation unless the task actually requires documentation changes.
- Keep repo-owned AI guidance in this file, `.ai/`, and `docs/` rather than tool-owned folders.

## Repo-Specific Workflow Constraints

- Start feature work from `staging`, not `main`.
- Release flow is `feature/* -> staging -> main`.
- Start dev servers from `studio/` and `frontend/` subdirectories; the root dev scripts are not the reliable default for fresh sessions.
- After schema changes, run `npm run typegen` from the repo root and commit the updated `frontend/sanity/sanity.types.ts`.
- HTMX is self-hosted from `frontend/public/vendor/htmx.min.js`; if HTMX is updated, run the frontend sync/check workflow rather than swapping CDN usage ad hoc.

## MCP Defaults

- Prefer repo-scoped MCP access over account-wide access.
- Default targets in this repo:
  - Sanity project `dnk98dp0`, dataset `production`
  - GitHub repository `RKMF/risor-kammermusikkfest`
  - Vercel team `risor-kammermusikkfests-projects`, project `risor-kammermusikkfest-frontend`
- If a connected MCP server appears to point at a different project, team, repository, or dataset, stop and say so instead of guessing.

## Verification Defaults

- Verify the specific area you changed before finishing.
- For dependency, config, schema, or build-tooling changes, treat local frontend and Studio verification as required.
- For Studio schema changes, verify type generation and editorial behavior, not just TypeScript compilation.

## Documentation Hierarchy

- `README.md`: human-facing front door for setup, build, deploy, and links
- `AGENTS.md`: minimal always-loaded briefing for any agent
- `.ai/instructions/`: stable standards and reference rules
- `.ai/workflows/`: task-specific procedures
- `.ai/specialists/`: focused expert briefs
- `docs/PROJECT_GUIDE.md`: full repo guide and deeper rationale
- `.ai/memory/`: recurring gotchas and durable decisions worth reusing across sessions

If something keeps needing explanation, capture it in `.ai/memory/` or the appropriate repo-owned instruction file. If a rule is discoverable from code or config, prefer fixing the codebase or linking to the source of truth instead of expanding this file.
