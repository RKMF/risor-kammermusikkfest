# Security Guidelines

**This repository is PUBLIC.** All committed code is visible to anyone. Never commit secrets, API keys, passwords, or sensitive data.

---

## Protection Layers

### Layer 1: .gitignore

Automatically excluded from git:
- `.env` files (all variants)
- API tokens and keys (`*token*`, `*secret*`, `*apikey*`)
- SSL certificates (`*.pem`, `*.key`, `*.cert`)
- Build artifacts (`dist/`, `node_modules/`, `.vercel/`)

Only `.env.example` should be committed (with placeholders only).

### Layer 2: Pre-Commit Hook

An automated script runs before every commit checking for:
1. Accidental `.env` files
2. API keys and tokens (pattern matching)
3. Large files (warning only)
4. `node_modules` directory

---

## Detected Patterns

The hook scans for patterns matching:
- Sanity tokens and API keys
- Generic API keys, secrets, passwords
- Stripe live/test keys
- SSL private key headers

**Allowed exceptions:** Placeholders like `your_token_here`, `example`, `placeholder`

---

## When Secrets Are Detected

The hook blocks the commit and shows which pattern was matched. The commit is **BLOCKED** until you remove the secrets.

---

## Emergency Bypass

**Only use for confirmed false positives:**

```bash
git commit --no-verify -m "Safe commit with false positive"
```

This bypasses ALL security checks. Use sparingly.

---

## Correct Pattern

**Wrong:** Hardcoding secrets directly in source code

**Correct:** Use environment variables via `import.meta.env.YOUR_VAR`

**Store secrets in `.env`** (gitignored), reference via env vars in code.

---

## If Secrets Are Accidentally Committed

1. **Immediately rotate the secret:**
   - Go to Sanity dashboard
   - Revoke the exposed token
   - Generate a new token

2. **Remove from git history:**
   ```bash
   # WARNING: Rewrites git history - coordinate with team first
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/secret/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push (after team coordination):**
   ```bash
   git push origin --force --all
   ```

4. **Notify team** to re-clone or sync

---

## GitHub Actions

### Known Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| **Overprivileged `GITHUB_TOKEN`** | Every workflow declares an explicit `permissions` block scoped to the minimum needed (e.g., `contents: read`). This prevents a compromised step from writing to the repo, creating releases, or accessing other scopes. |
| **Mutable action tags** | Third-party actions are pinned to full commit SHAs instead of version tags (e.g., `actions/checkout@f43a0e5ff2bd294095638e18286ca9a3d1956744` rather than `@v4`). Tags can be moved after the fact; SHAs cannot. A comment after the SHA notes the version for readability. |
| **Secrets in workflow files** | Deploy credentials (`SANITY_AUTH_TOKEN`, `SANITY_STUDIO_PROJECT_ID`, etc.) are stored as encrypted GitHub repository secrets and injected via `${{ secrets.* }}`. They never appear in workflow YAML or logs. |

### Workflow: Deploy Sanity Studio

File: `.github/workflows/deploy.yml`

- **Trigger:** Pushes to `main` that change files under `studio/`
- **Permissions:** `contents: read` (checkout only; deploy uses a separate `SANITY_AUTH_TOKEN`)
- **Actions pinned to SHA:** `actions/checkout`, `actions/setup-node`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Hook not running | `chmod +x .git/hooks/pre-commit` |
| False positive | Review pattern, use placeholder, or `--no-verify` |
| Hook missing after clone | Copy from team member (`.git/hooks/` not tracked) |

---

**When in doubt, don't commit it.** It's easier to be safe than to clean up leaked secrets.
