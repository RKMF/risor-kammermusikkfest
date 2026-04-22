Restore context after chat loss, handoff, or returning to an in-progress repo state.

**Mode:** Read-only context restore.

Use this when you need to re-orient without changing branches, starting servers, or doing fresh environment setup.

## Use This When
- resuming after clearing chat or losing context
- handing the repo to a different agent
- returning to ongoing work and needing a quick state check

## Load Context
1. Read `AGENTS.md`
2. Read `docs/PROJECT_GUIDE.md` if you need deeper repo context
3. Read the workflow for the task only if one clearly applies
4. Read `.ai/instructions/...` or `.ai/memory/...` only when the task needs that detail

## Check Repo State
Run:
- `git status --short`
- `git branch --show-current`
- `lsof -ti:3333,4321 || echo "No servers"`

Confirm:
- current branch
- whether there are existing uncommitted changes
- whether Studio or frontend servers are already running

## Rules That Get Lost
- Read files before editing (never from memory)
- Keep solutions simple and compatible with current editorial workflows
- Do not create or expand docs unless the task actually requires documentation changes
- Feature branches from staging, never main
- Start dev servers from `studio/` and `frontend/`, not from root defaults
- Kill servers before starting new ones
- Squash merge disposable branches into staging; preserve ancestry for staging/main promotion and sync
- Capture repeated lessons in `.ai/memory/` instead of re-explaining them every session
