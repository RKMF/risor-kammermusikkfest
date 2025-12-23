Release current feature branch to staging: $ARGUMENTS

Flow: feature branch → staging (testing.kammermusikkfest.no)

## Step 1: Verify State
```bash
git status
git branch --show-current
```
Must be on feature branch (feature/*, fix/*, chore/*). If on staging or main, abort.

## Step 2: Handle Uncommitted Changes
If uncommitted changes exist, show them and ask if they should be committed.

## Step 3: TypeGen (if schema changed)
```bash
git diff --name-only staging | grep "^studio/schemaTypes/"
```

If schema files changed, run typegen before proceeding:
```bash
cd studio && npm run extract-schema
cd ../frontend && npm run typegen
git add frontend/sanity/extract.json frontend/sanity/sanity.types.ts
git commit -m "chore: Regenerate Sanity types"
```

## Step 3b: TypeCheck
```bash
cd frontend && npm run typecheck
cd ../studio && npx tsc --noEmit
```
If errors exist, fix them before proceeding. Do not push code with type errors.

## Step 4: Push and Create PR
```bash
git push origin <branch-name>
gh pr create --base staging --title "<descriptive title>"
```
Include summary of changes in PR body.

## Step 5: Merge to Staging
```bash
gh pr merge --squash --delete-branch
```
`--delete-branch` deletes the feature branch (source), NOT staging (target).

## Step 6: Update Local
```bash
git checkout staging && git pull origin staging
```

## Step 7: Confirm
Report: PR URL, whether typegen ran, remind to test before `/live-release`.

## Rules
- NEVER run from staging or main branch
- ALWAYS use squash merge
- ALWAYS delete the feature branch after merge
- NEVER delete staging or main branches under any circumstances
- ALWAYS run typegen if schema files changed
- ALWAYS run typecheck before pushing (catches errors locally)
- Ask before committing uncommitted changes
