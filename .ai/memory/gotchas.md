# Gotchas

Recurring pitfalls, fragile workflows, and non-obvious repo behavior that have caused wasted work before.

Use this file for:
- repeat mistakes by agents or contributors
- awkward repo behavior worth warning about
- operational quirks that are cheaper to remember than rediscover

Do not use this file for:
- one-off incidents
- speculative warnings
- issues that should be fixed in code or scripts instead

## Current Gotchas

- Starting dev servers from the monorepo root is not the reliable default; start them from `studio/` and `frontend/`.
- Type generation is part of the schema contract in this repo; forgetting to commit `frontend/sanity/sanity.types.ts` after schema changes breaks downstream expectations.
- Shared workflow docs previously drifted into tool-specific references; keep cross-links pointed at repo-owned `.ai/` paths.
