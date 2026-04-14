Release `staging` to production: $ARGUMENTS

**Mode:** Verify state first, then execute the production release steps.

Flow: `staging` → `main` → sync `main` back to `staging` → verify Studio deployment if relevant

## Use This When
- `staging` has already been tested and is ready for production
- the next step is a production PR into `main`
- the local repo is ready to finish the release and resync branch history

## Step 1: Verify Current State
Run:
```bash
git status
git branch --show-current
```

Interpret the result:
- if on `staging`, continue
- if on a feature branch, stop and finish `.ai/workflows/dev-release.md` first
- if on `main`, stop; production release should originate from `staging`

## Step 2: Create the Production PR
```bash
gh pr create --base main --head staging --title "Release: <description>"
```

Include a short summary of what is being released in the PR body.

## Step 3: Merge Into Main
```bash
gh pr merge --squash
```

Use squash merge for `staging` → `main`.
Do not use `--delete-branch`; `staging` must remain.

## Step 4: Sync Main Back to Staging
After a squash merge, branch histories diverge. Sync them immediately:

```bash
gh pr create --base staging --head main --title "Sync: main → staging"
gh pr merge --merge
```

Use a regular merge for `main` → `staging` sync, not squash.

## Step 5: Update Local Branches
```bash
git checkout main && git pull origin main
git checkout staging && git pull origin staging
```

## Step 6: Check Studio Deployment Need
```bash
git diff main~1..main --name-only | grep "^studio/"
```

If Studio files changed:
- verify the GitHub Actions deployment
- if needed, deploy manually with `cd studio && npm run deploy`

## Step 7: Report Outcome
Report:
- production PR URL
- whether `main` and `staging` are synced locally
- whether Studio files changed
- whether Studio deployment needs follow-up
- production URL and Studio URL if relevant

## Rules
- release to production only from `staging`
- never delete `staging` or `main`
- use squash merge for `staging` → `main`
- use regular merge for `main` → `staging`
- always complete the sync-back step after production release
