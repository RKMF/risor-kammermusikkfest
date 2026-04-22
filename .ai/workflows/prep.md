Prepare the local dev environment and start a new working branch: $ARGUMENTS

**Mode:** Execution workflow.

## Use This When
- starting a new feature or bugfix session
- resetting local dev servers before implementation
- creating a fresh branch from `staging`

Read `AGENTS.md` first. Use `.ai/workflows/refresh.md` instead if you only need context recovery.

## Step 1: Clear Existing Dev Servers
```bash
lsof -ti:4321,3333 | xargs kill -9 2>/dev/null
lsof -ti:4321,3333 || echo "Ports clear"
```

## Step 2: Start Dev Servers From Subdirectories
Do not rely on the root dev scripts as the default startup path.

```bash
cd studio && npm run dev
cd frontend && npm run dev
```

Verify:
```bash
lsof -ti:3333 && echo "Studio on 3333" || echo "Studio failed"
lsof -ti:4321 && echo "Frontend on 4321" || echo "Frontend failed"
```

## Step 3: Create the Working Branch
Update from `staging` first:

```bash
git checkout staging && git pull origin staging
```

If no branch name is supplied, ask for one. Use:
- `feature/<name>` for new features
- `fix/<name>` for bug fixes
- `chore/<name>` for maintenance

Then:
```bash
git checkout -b <branch-type>/<branch-name>
git push -u origin <branch-name>
```

## Step 4: Confirm Ready
Report:
- whether both servers are running
- current branch name
- whether the branch was pushed successfully

## Rules
- Always start from `staging`, never `main`
- Always start dev servers from `studio/` and `frontend/`
- Push the new branch immediately so work is backed up
