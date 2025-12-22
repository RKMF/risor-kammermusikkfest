Prepare development environment and start new feature branch: $ARGUMENTS

Read @docs/PROJECT_GUIDE.md before proceeding.

## Step 1: Kill Existing Dev Servers
```bash
lsof -ti:4321,3333 | xargs kill -9 2>/dev/null
lsof -ti:4321,3333 || echo "Ports clear"
```

## Step 2: Start Dev Servers

**IMPORTANT: Start from subdirectories, not root.** Root `npm run dev:studio` does NOT work reliably.

```bash
cd studio && npm run dev    # Background task, wait for "ready"
cd frontend && npm run dev  # Background task, wait for "ready"
```

Verify:
```bash
lsof -ti:3333 && echo "Studio on 3333" || echo "Studio failed"
lsof -ti:4321 && echo "Frontend on 4321" || echo "Frontend failed"
```

## Step 3: Prepare Git Branch

```bash
git checkout staging && git pull origin staging
```

Ask user for feature name if not in $ARGUMENTS. Branch naming:
- `feature/<name>` - New features
- `fix/<name>` - Bug fixes
- `chore/<name>` - Maintenance

```bash
git checkout -b <branch-type>/<branch-name>
git push -u origin <branch-name>
```

Push immediately so work is backed up from the start.

## Step 4: Confirm Ready

Report: servers running, branch name, branch pushed to GitHub.

## Rules
- ALWAYS kill existing servers first (prevents port conflicts)
- ALWAYS start servers from subdirectories (not root npm scripts)
- ALWAYS create branch from staging (never from main)
- ALWAYS push new branch immediately
- If $ARGUMENTS is empty, ask for feature name
