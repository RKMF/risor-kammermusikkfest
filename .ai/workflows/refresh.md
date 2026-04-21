Clear conversation and restore context.

**Mode:** Read-only context restore.

Use `.ai/workflows/start.md` as the primary startup workflow. This file is the short version for after context loss or chat clearing.

## Do This
1. Read `AGENTS.md`
2. Read `docs/PROJECT_GUIDE.md` if you need deeper repo context
3. Run: `git status && git branch --show-current`
4. Run: `lsof -ti:3333,4321 || echo "No servers"`

## Rules That Get Lost
- Read files before editing (never from memory)
- No .md files unless asked
- No emojis unless asked
- Simple > clever, working > perfect
- Kill servers before starting new ones
- Feature branches from staging, never main
- Squash merge disposable branches into staging; preserve ancestry for staging/main promotion and sync
