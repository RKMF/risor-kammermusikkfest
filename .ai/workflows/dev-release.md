Release the current working branch to `staging`: $ARGUMENTS

**Mode:** Verify state first, then execute the release steps.

Flow: `feature/*` or `fix/*` or `chore/*` → `staging` (`testing.kammermusikkfest.no`)

## Use This When
- the working branch is ready for staging deployment and review
- local checks are complete or ready to be run now
- the next step is a PR into `staging`

## Step 1: Verify Current State
Run:
```bash
git status
git branch --show-current
```

Interpret the result:
- if on `main`, stop; work should not be released from `main`
- if already on a feature branch, continue
- if on `staging` with uncommitted work, create a new working branch from that state before proceeding

Branch naming:
- `feature/<name>` for new features
- `fix/<name>` for bug fixes
- `chore/<name>` for maintenance

## Step 2: Resolve Uncommitted Work
- show uncommitted changes before releasing
- if changes should be included, commit them on the working branch before continuing
- if changes should not be included, stop and clean up the branch state first

## Step 3: Run Required Checks
Check whether schema files changed relative to `staging`:
```bash
git diff --name-only staging | grep "^studio/schemaTypes/"
```

If schema files changed:
```bash
npm run typegen
git add frontend/sanity/sanity.types.ts
git commit -m "chore: Regenerate Sanity types"
```

Then run verification:
```bash
cd frontend && npm run typecheck
cd frontend && npm run check:htmx
cd ../studio && npx tsc --noEmit
```

Do not proceed with type or HTMX check failures.

## Step 4: Push and Open the PR
```bash
git push origin <branch-name>
gh pr create --base staging --title "<descriptive title>"
```

Include a short summary of the shipped changes in the PR body.

## Step 5: Merge to Staging
```bash
gh pr merge --squash --delete-branch
```

`--delete-branch` removes the source branch only, not `staging`.

## Step 6: Sync Local Staging
```bash
git checkout staging && git pull origin staging
```

## Step 7: Report Outcome
Report:
- PR URL
- whether typegen ran
- that `staging` is updated locally
- whether the branch was deleted after merge
- that production release, if needed, should continue via `.ai/workflows/live-release.md`

## Rules
- never release from `main`
- use squash merge for branch → `staging`
- delete the feature branch after merge
- never delete `staging` or `main`
- run typegen when schema files changed
- run `npm run check:htmx` for frontend changes before release
- do not proceed with failing local verification
