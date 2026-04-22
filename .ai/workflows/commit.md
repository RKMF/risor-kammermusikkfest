Organize current local work into logical commits on the correct working branch: $ARGUMENTS

**Mode:** Inspect first, then prepare the branch and create commits. Do not release.

This workflow is for commit hygiene before `.ai/workflows/dev-release.md`.

## Use This When
- you have accumulated local work and want it split into reviewable commits
- you are not ready to push or open a PR yet
- you want one working branch with several logical commits

## Step 1: Verify Current State
Run:
```bash
git status --short
git branch --show-current
```

Interpret the result:
- if on `main`, stop; do not commit feature work there
- if on `staging` with uncommitted work, create a new working branch before committing
- if already on `feature/*`, `fix/*`, or `chore/*`, continue on that branch

Branch naming:
- `feature/<name>` for feature work
- `fix/<name>` for bug fixes
- `chore/<name>` for maintenance

Rule:
- use one working branch for one coherent body of work
- use several logical commits on that branch when needed
- do not create several branches just to mirror commit boundaries

## Step 2: Classify Changes
- inspect the current diff before staging anything
- separate unrelated repo guidance/docs changes from product/code changes unless they clearly belong together
- identify change groups by coherent behavior, subsystem, or deliverable
- avoid splitting tightly coupled files across commits

## Step 3: Propose Commit Boundaries
- prefer a small number of meaningful commits
- do not collapse everything into one dump commit if there are clear logical boundaries
- do not over-fragment work into tiny commits with weak standalone meaning
- use best judgment and only stop to ask if the grouping is genuinely ambiguous or risky

## Step 4: Create Commits
- stage one logical group at a time
- write descriptive commit messages
- keep regenerated artifacts with the commit that required them
- if schema or query changes require `frontend/sanity/sanity.types.ts`, include it in the same logical commit

## Step 5: Run Needed Checks
Run the minimum checks needed to validate the grouped work.

At minimum:
- run `npm run typegen` when schema files changed
- run targeted frontend or Studio checks when the grouped changes affect them

Do not push, open a PR, or merge in this workflow.

## Step 6: Report Outcome
Report:
- current branch name
- commits created
- whether `typegen` ran
- any remaining uncommitted files
- whether the branch is ready for `.ai/workflows/dev-release.md`

## Rules
- never commit feature work directly on `main`
- if currently on `staging`, branch off before committing new work
- one branch can contain several logical commits
- commit grouping should follow the actual work structure, not arbitrary file chunks
- this workflow prepares work; `.ai/workflows/dev-release.md` handles push/PR/merge to `staging`
