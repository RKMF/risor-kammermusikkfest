# Repo Audit: 2026-04-13

Current baseline audited from `staging` at `c518517`.

This audit assumes the stack choice is deliberate and correct:

- Sanity
- Astro
- HTMX
- Vercel
- Vite
- TypeScript

The question is not whether to replace that stack. The question is whether the repo now reflects that stack cleanly, safely, and maintainably for a solo maintainer.

## Overall Judgment

The repo is in a materially better state than it was before the April 12-13 changes.

What is now structurally good:

- Vercel install/build behavior is deterministic.
- HTMX is integrated in a browser-first way and hardened.
- shared carousel behavior is internally coherent with native scroll snap.
- CI now enforces the HTMX vendored-asset contract.
- GitHub workflows use pinned actions and explicit low privileges.

What still needs work:

- documentation does not match the actual stack or current architecture
- some repo protections are still local convention rather than tracked/shared behavior
- root dependency ownership is not fully clean or fully explained
- frontend CI coverage is still narrow

This is not "bad vibe coding". It is a real production repo that had accumulated upgrade debt, stale assumptions, and some under-governed maintenance patterns.

## Current Architecture Fit

### Frontend

- Astro SSR on Vercel is the active delivery model.
- HTMX is used as browser-side progressive enhancement rather than as a Vite-bundled application dependency.
- TypeScript is used for typechecking and generated Sanity types.
- `@astrojs/react` is still required because the repo uses React-backed functionality in the frontend stack.

Assessment:

- This is a coherent frontend model.
- The current implementation now matches the intended tool roles better than before.

### Studio

- Sanity Studio is a separate workspace with Sanity `5.20.0`.
- Studio-specific dependencies are largely isolated correctly.
- CodeMirror packages are explicitly pinned in support of the Vision/runtime stabilization work.

Assessment:

- This is a coherent Studio model.
- The remaining complexity is mostly normal Sanity Studio complexity, not repo confusion.

### Cross-stack fit

- Vite is now treated as shared build tooling at the monorepo root instead of a frontend-only runtime concern.
- `vercel.json` builds only the frontend workspace and installs from the lockfile with `npm ci`.
- HTMX no longer depends on bundler behavior for safe browser use.

Assessment:

- The stack components are now working in concert rather than leaning on accidental compatibility.

## Dependency Ownership Matrix

### Root `package.json`

Keep:

- `vite`
  - Shared build tool ownership at monorepo level.
- `typescript`
  - Shared toolchain dependency used across workspaces and scripts.
- `@types/react`
  - Reasonable shared type baseline for React-dependent workspaces.
- `overrides.sanity`
  - Intentional version pin for repo-wide Sanity consistency.

Investigate further before removing:

- `sanity`
  - May be redundant with the Studio workspace dependency.
  - Also may still be useful for root-level consistency and CLI/tooling resolution.
  - Do not remove without a targeted verification pass.
- `react`, `react-dom`, `react-is`, `styled-components`
  - These are duplicated in workspaces and may only be present at root for hoisting consistency.
  - They are not obviously required by root scripts.
  - Treat as cleanup candidates, not immediate removals.

### `frontend/package.json`

Clearly correct ownership:

- `astro`, `@astrojs/react`, `@astrojs/vercel`, `@astrojs/sitemap`
- `@sanity/client`, `@sanity/image-url`, `groq`, `astro-portabletext`
- `htmx.org`
- `@vercel/analytics`, `@vercel/speed-insights`
- `vitest`, `@vitest/ui`, `happy-dom`

Notes:

- HTMX remains a package dependency even though the browser asset is vendored. That is correct because the vendored file is sourced from the installed package.
- `sync:htmx` and `check:htmx` are now part of the maintenance contract and should remain.

### `studio/package.json`

Clearly correct ownership:

- `sanity`, `@sanity/vision`, `@sanity/locale-nb-no`
- CodeMirror packages used for Studio runtime stability
- `sanity-plugin-asset-source-unsplash`
- `eslint`, `prettier`, `vitest`, `happy-dom`

Notes:

- Studio dependency ownership is clearer than root dependency ownership.
- No obvious removals should be attempted without verifying actual schema/plugin usage.

## Cleanup Candidates

### Safe to clean up later

- stale documentation references to:
  - Astro 5
  - Sanity 4
  - `astro-htmx`
  - old preview assumptions
- local-only pre-commit hook being treated in docs like a shared safeguard

### Keep, but document later

- HTMX vendored browser build plus `sync:htmx` and `check:htmx`
- CodeMirror pinning/dedupe strategy around Sanity Vision
- root-level Vite ownership
- `robots.txt` disallow for `/preview`
  - no current preview route exists
  - this is harmless compatibility residue, not urgent breakage

### Investigate further before changing

- root-level `sanity`, `react`, `react-dom`, `react-is`, `styled-components`
- any root/workspace duplication that may currently be stabilizing the install tree

## Upgrade Readiness Summary

### Sanity / Studio

Current state:

- upgraded to `5.20.0`
- Studio preview/presentation coupling has been reduced
- Vision/CodeMirror compatibility is explicitly handled

Routine updates:

- patch/minor Sanity and Studio-adjacent updates should now be less risky than before

Needs special care:

- Sanity majors
- anything touching Vision, CodeMirror integration, or custom Studio actions

### Astro / Vite / Vercel

Current state:

- Astro `6.1.5`
- Vite owned at root
- Vercel install/build path is deterministic

Routine updates:

- Astro minor/patch updates
- Vite minor updates if Astro compatibility remains intact

Needs special care:

- changes that affect Vercel install/build topology
- Astro major upgrades
- moving shared build tooling back into workspace-local ownership

### HTMX

Current state:

- self-hosted browser build
- configured with `allowEval: false` and `allowScriptTags: false`
- CI and release flow verify asset sync

Routine updates:

- HTMX version bumps paired with `npm run sync:htmx --workspace=frontend`

Needs special care:

- any change that reintroduces bundler-managed HTMX loading
- use of HTMX features that depend on eval-based behavior

### TypeScript

Current state:

- pinned to `5.9.3`
- used consistently across root, frontend, and studio

Routine updates:

- patch/minor updates should be manageable

Needs special care:

- changes that affect generated Sanity types
- stricter compiler behavior impacting Studio custom components and frontend query typing

## Security and Privacy Posture

### Repo-tracked posture

Good:

- no hardcoded live secrets found in tracked code reviewed during this audit
- workflow permissions are explicit and minimal (`contents: read`)
- actions are pinned by SHA
- deploy secrets are referenced via GitHub Secrets
- `.env.example` files clearly separate placeholders from real secrets
- HTMX runtime hardening removes avoidable eval/script-tag risk

Important clarifications:

- Sanity project ID and dataset are public identifiers, not secrets
- `SANITY_API_READ_TOKEN` and `SANITY_AUTH_TOKEN` are secrets and are handled as such in repo-tracked configuration

Limitations:

- this audit cannot verify the actual secret values
- this audit cannot verify token scopes, rotation, expiry, or whether stale secrets still exist in GitHub, Sanity, or Vercel

### Repo-visible concerns

- the pre-commit security story is overstated in documentation because the hook is local-only in `.git/hooks/pre-commit`
- `.gitignore` has very broad secret-pattern rules; this is protective, but it can also hide legitimate files if naming conventions are not careful

## External Secret Review Checklist

Review outside the repo:

- GitHub repository secrets
  - remove secrets no longer used by workflows
  - confirm minimum required scopes
  - confirm no obsolete deploy tokens remain
- Sanity tokens
  - confirm only needed tokens still exist
  - confirm least-privilege access
  - revoke stale or broad tokens
- Vercel environment variables
  - confirm only active variables remain
  - verify staging vs production values are correct
  - remove stale variables tied to removed preview flows

## Prioritized Remediation

### Work first

- run a targeted cleanup pass on root dependency ownership
- confirm which root dependencies are intentional versus only historical
- keep the current build topology stable while doing that cleanup

### Work later

- broaden frontend CI so it covers meaningful frontend changes, not only HTMX infra paths
- convert the local pre-commit hook into a tracked/shared safeguard if the repo should enforce that behavior consistently

### Finish last

- update `docs/PROJECT_GUIDE.md`, `docs/SECURITY.md`, and related internal docs to match the final architecture
- update `README.md` last as the public-facing summary once the repo state is settled

## Acceptance Criteria For The Next Cleanup Phase

- root dependency ownership is decision-complete
- leftover architecture is explicitly categorized as remove, keep, or compatibility shim
- upgrade-sensitive maintenance rules are known without relying on memory
- external secret review is completed manually in GitHub, Sanity, and Vercel
