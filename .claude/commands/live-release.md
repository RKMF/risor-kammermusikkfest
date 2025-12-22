Release staging to production: $ARGUMENTS

Flow: staging → main → sync → deploy studio (if needed)

## Step 1: Verify State
```bash
git status
git branch --show-current
```
Must be on staging branch. If on feature branch, abort and tell user to run `/dev-release` first.

## Step 2: Create PR to Main
```bash
gh pr create --base main --head staging --title "Release: <description>"
```
Include summary of what's being released in PR body.

## Step 3: Merge to Main
```bash
gh pr merge --squash
```
**CRITICAL: Do NOT use --delete-branch (never delete staging)**

## Step 4: Sync Main Back to Staging

After squash merge, branches diverge. Sync to keep them aligned:
```bash
gh pr create --base staging --head main --title "Sync: main → staging"
gh pr merge --merge
```
**CRITICAL: Use regular merge (--merge), NOT squash**

## Step 5: Update Local
```bash
git checkout main && git pull origin main
git checkout staging && git pull origin staging
```

## Step 6: Studio Deployment
```bash
git diff main~1..main --name-only | grep "^studio/"
```
If studio files changed: GitHub Actions auto-deploys, or manual: `cd studio && npm run deploy`

## Step 7: Verify
Report: production URL, studio URL (if changed), staging synced.

## Rules
- NEVER run from a feature branch (use `/dev-release` first)
- NEVER delete staging or main branches
- ALWAYS use squash merge for staging → main
- ALWAYS use regular merge for main → staging sync
- ALWAYS complete the sync step
