Start or resume an AI session in this repo.

**Mode:** Read-only for context restore. Execution only when the task requires server or branch setup.

## Use This When
- starting a new AI session in the repo
- resuming work after clearing chat or losing context
- handing the repo to a different agent and needing a clean baseline

## Step 1: Load Context in Order
1. Read `AGENTS.md`
2. Read `docs/PROJECT_GUIDE.md` only if the task needs deeper repo context
3. Read the relevant `.ai/workflows/...` file if the task matches a known procedure
4. Read `.ai/instructions/...` or `.ai/memory/...` only when the task needs that detail

## Step 2: Check Repo State
Run:

```bash
git status --short
git branch --show-current
lsof -ti:3333,4321 || echo "No servers"
```

Confirm:
- current branch
- whether there are existing uncommitted changes
- whether Studio or frontend servers are already running

## Step 3: Choose the Right Next Workflow
- New feature or bugfix session needing local dev servers: use `.ai/workflows/preparation.md`
- Content research or content drafting: use `.ai/workflows/content.md`
- Content validation or performer/profile cross-checks: use `.ai/workflows/content-validate.md`
- Translation or NO/EN sync: use `.ai/workflows/translate.md`
- Release work: use `.ai/workflows/dev-release.md` or `.ai/workflows/live-release.md`
- General coding/debugging without full environment reset: continue directly after context restore

## Rules That Get Lost
- Read files before editing; never rely on previous-session memory
- Start feature work from `staging`, never `main`
- Start dev servers from `studio/` and `frontend/`, not from root defaults
- Keep solutions simple and compatible with current editorial workflows
- Do not create or expand docs unless the task actually requires documentation changes
- Capture repeated lessons in `.ai/memory/` instead of re-explaining them every session
