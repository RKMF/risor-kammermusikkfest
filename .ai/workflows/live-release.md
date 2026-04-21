Release `staging` to production: $ARGUMENTS

**Mode:** Verify state first, then execute the production release steps.

Flow: `staging` → `main` with merge commit → sync `staging` to the released `main` tip → verify Studio deployment if relevant

## Use This When
- `staging` has already been tested and is ready for production
- the next step is a production PR into `main`
- the local repo is ready to finish the release and keep the permanent branches ancestry-aligned after promotion

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
gh pr merge --merge
```

Use a merge commit for `staging` → `main`.
Do not use `--delete-branch`; `staging` must remain.
Never delete `staging` or `main` as part of this workflow.

If repository settings or branch protection block merge commits for the production PR, stop and fix that policy first instead of falling back to squash.

## Step 4: Sync `staging` To The Released `main` Tip
Required path:

```bash
git fetch origin main staging
git checkout staging
git merge --ff-only origin/main
git push origin staging
```

This step must be a direct fast-forward so `staging` ends on the exact same commit as the released `main` tip.
Do not replace this with a PR-based sync merge; that creates a staging-only merge commit and breaks exact branch sync.
Do not use squash or rebase for the sync step.
Do not delete `staging` or `main` during or after the sync step.
If permissions or branch protection block this fast-forward push, stop and fix that policy before treating the workflow as complete.

## Step 5: Verify Permanent-Branch Alignment
Run:

```bash
git fetch origin main staging
git rev-list --left-right --count origin/main...origin/staging
git diff --stat origin/main..origin/staging
```

Interpret the result:
- `git diff --stat` should be empty after the sync step
- `git rev-list --left-right --count` should show `0	0` after the sync step
- if either check is not clean, stop and inspect before claiming the release is complete

## Step 6: Update Local Branches
```bash
git checkout main && git pull origin main
git checkout staging && git pull origin staging
```

## Step 7: Check Studio Deployment Need
```bash
git diff main~1..main --name-only | grep "^studio/"
```

If Studio files changed:
- verify the GitHub Actions deployment
- if needed, deploy manually with `cd studio && npm run deploy`

## Step 8: Report Outcome
Report:
- production PR URL
- merge method used
- whether `staging` was synced to the released `main` tip
- whether the direct fast-forward sync completed successfully
- whether `main` and `staging` are ancestry-aligned locally
- whether Studio files changed
- whether Studio deployment needs follow-up
- production URL and Studio URL if relevant

## Rules
- release to production only from `staging`
- never delete `staging` or `main`
- no command in this workflow may delete `staging` or `main`, directly or indirectly
- use a merge commit for `staging` → `main`
- sync `staging` to the released `main` tip immediately after production release
- use a direct `--ff-only` sync so `main` and `staging` end on the same commit
- do not fall back to squash for permanent-branch promotion or sync
