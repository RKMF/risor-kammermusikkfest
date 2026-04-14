Release `staging` to production: $ARGUMENTS

**Mode:** Verify state first, then execute the production release steps.

Flow: `staging` → `main` → verify content parity between `main` and `staging` → verify Studio deployment if relevant

## Use This When
- `staging` has already been tested and is ready for production
- the next step is a production PR into `main`
- the local repo is ready to finish the release and confirm `main` and `staging` still match in content after the squash merge

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

## Step 4: Check `main` and `staging` Content Parity
After a squash merge, branch histories diverge. In this repository, protected branches currently disallow merge commits, so do not assume a `main` → `staging` sync PR is possible.

Run:

```bash
git fetch origin main staging
git diff --stat origin/main..origin/staging
```

Interpret the result:
- if the diff is empty, `main` and `staging` are already aligned in content and no sync PR is needed
- if the diff is not empty, stop and inspect before creating any follow-up PR
- only create a `main` → `staging` sync PR if repository policy allows the required merge method

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
- whether `main` and `staging` are content-identical locally
- whether Studio files changed
- whether Studio deployment needs follow-up
- production URL and Studio URL if relevant

## Rules
- release to production only from `staging`
- never delete `staging` or `main`
- use squash merge for `staging` → `main`
- verify `main` and `staging` content parity after the production merge
- do not force a `main` → `staging` sync step that conflicts with current branch protection rules
