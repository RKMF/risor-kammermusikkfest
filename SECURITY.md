# Security Guidelines

This document outlines the security measures in place to protect sensitive data in this repository.

## 🔒 Public Repository Notice

**This repository is PUBLIC.** All committed code is visible to anyone on the internet. Never commit secrets, API keys, passwords, or sensitive data.

---

## 🛡️ Protection Layers

### Layer 1: .gitignore

Files automatically excluded from git tracking:
- `.env` files (all variants: `.env.local`, `.env.production`, etc.)
- API tokens and keys (`*token*`, `*secret*`, `*apikey*`)
- SSL certificates (`*.pem`, `*.key`, `*.cert`)
- Build artifacts (`dist/`, `node_modules/`, `.vercel/`)
- IDE settings (`.vscode/`, `.idea/`)

✅ **Only `.env.example` should be committed** (with placeholder values only)

### Layer 2: Pre-Commit Hook (Automated)

An automated script runs before every commit to check for:

1. **Accidental .env files**
2. **API keys and tokens** (common patterns)
3. **Large files** (warning only)
4. **node_modules** (should never be committed)

---

## 📋 How It Works

### Normal Workflow (Secrets Prevented)

```bash
# Stage your changes
git add .

# Try to commit
git commit -m "Add new feature"

# ✅ Hook runs automatically:
# 🔍 Running pre-commit security checks...
# → Checking for .env files...
# → Scanning for API keys and tokens...
# → Checking for large files...
# → Checking for node_modules...
# ✅ All security checks passed!
# Proceeding with commit...
```

### If Secrets Detected

```bash
git commit -m "Update config"

# ❌ Hook blocks commit:
# ❌ ERROR: Potential secrets detected in staged changes!
#
# Pattern found: API_KEY.*=.*[a-zA-Z0-9]{20,}
# + SANITY_API_READ_TOKEN=sk_1234567890abcdef1234567890
#
# 💡 Tips:
#   1. Use environment variables instead of hardcoded secrets
#   2. Add secrets to .env file (already in .gitignore)
#   3. Use placeholders like 'your_token_here' in .env.example
```

**The commit is BLOCKED** until you remove the secrets.

---

## 🚨 Emergency Bypass (Use Carefully!)

**Only use this if the hook is giving a false positive:**

```bash
git commit --no-verify -m "Safe commit with false positive"
```

⚠️ **WARNING:** This bypasses ALL security checks. Only use if you're absolutely certain there are no secrets.

---

## ✅ Best Practices

### Before Every Commit

```bash
# 1. Review what you're committing
git status
git diff

# 2. Search for potential secrets manually
git diff --cached | grep -iE '(token|key|secret|password)'

# 3. Verify .env files aren't staged
git status | grep -E '\.env$|\.env\.'

# 4. Commit (hook runs automatically)
git commit -m "Your message"
```

### Setting Up Environment Variables

**DO NOT commit:**
```bash
# ❌ WRONG - In source code
const API_KEY = "sk_1234567890abcdef1234567890"
```

**DO commit:**
```bash
# ✅ CORRECT - In source code
const API_KEY = import.meta.env.SANITY_API_READ_TOKEN
```

**Store secrets in `.env`** (already gitignored):
```bash
# frontend/.env (NOT committed)
SANITY_API_READ_TOKEN=sk_1234567890abcdef1234567890
```

**Document in `.env.example`** (safe to commit):
```bash
# frontend/.env.example (committed)
SANITY_API_READ_TOKEN=your_read_token_here
```

---

## 🔍 What The Hook Checks

### 1. Environment Files

**Blocked:**
- `.env`
- `.env.local`
- `.env.production`
- `.env.development`
- `.env.staging`
- `.env.test`

**Allowed:**
- `.env.example` (placeholders only!)

### 2. Secret Patterns

The hook scans for these patterns:
- `SANITY_AUTH_TOKEN=<20+ chars>`
- `SANITY_API_READ_TOKEN=sk<chars>`
- `API_KEY=<20+ chars>`
- `SECRET=<20+ chars>`
- `PASSWORD=<8+ chars>`
- `sk_live_*` / `pk_live_*` (Stripe keys)
- `sk_test_*` / `pk_test_*` (Stripe test keys)
- `BEGIN PRIVATE KEY` (SSL certificates)

**Exceptions (allowed):**
- `your_*_here` (placeholders)
- `example` (documentation)
- `placeholder` (templates)

### 3. Large Files

**Warning (not blocked):**
- Files over 500KB

The hook warns you but allows the commit. Consider if large files should be in `.gitignore`.

### 4. node_modules

**Blocked:**
- Any file in `node_modules/`

Dependencies should NEVER be committed. They're installed via `package.json`.

---

## 🔧 Troubleshooting

### Hook Not Running

If the hook doesn't run automatically:

```bash
# Check if hook exists
ls -la .git/hooks/pre-commit

# Make it executable
chmod +x .git/hooks/pre-commit

# Test it manually
.git/hooks/pre-commit
```

### False Positives

If the hook blocks a legitimate commit:

1. **Review the flagged pattern** - Is it really safe?
2. **Use a placeholder instead** - e.g., `your_token_here`
3. **If truly safe** - Bypass with `--no-verify` (use sparingly!)

### Hook Stops Working After Git Pull

The `.git/hooks/` directory is NOT tracked by git. If you clone the repository fresh or the hook gets deleted:

```bash
# Re-create the hook
# Copy the script from another team member
# Or re-run the setup script (if provided)
```

**Note:** Future developers will need to set up the hook after cloning. Consider documenting this in your onboarding process.

---

## 🎯 For New Team Members

### Initial Setup After Clone

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Create `.env` file:**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your own API tokens
   ```

3. **Verify pre-commit hook:**
   ```bash
   ls -la .git/hooks/pre-commit
   # If missing, ask team for the hook script
   ```

4. **Test the hook:**
   ```bash
   # Try committing a secret (it should block you)
   echo "API_KEY=sk_1234567890test" > test-secret.txt
   git add test-secret.txt
   git commit -m "Test"
   # Expected: Hook blocks the commit

   # Clean up
   git restore --staged test-secret.txt
   rm test-secret.txt
   ```

---

## 📚 Additional Security Measures

### GitHub Secret Scanning

GitHub automatically scans public repositories for known secret patterns and alerts repository owners. This is a backup layer if secrets accidentally get committed.

### Environment Variables in Production

**For Vercel deployment:**
1. Go to Vercel project settings
2. Add environment variables under "Environment Variables"
3. Never hardcode production secrets in code

**For GitHub Actions (CI/CD):**
1. Go to Repository Settings → Secrets and variables → Actions
2. Add secrets (e.g., `SANITY_AUTH_TOKEN`)
3. Reference in workflows as `${{ secrets.SECRET_NAME }}`

---

## 🚨 If Secrets Are Accidentally Committed

If you realize secrets were committed:

1. **Immediately rotate the secret:**
   - Go to Sanity dashboard
   - Revoke the exposed token
   - Generate a new token

2. **Remove from git history:**
   ```bash
   # WARNING: This rewrites git history!
   # Coordinate with team before doing this
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/secret/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push (if coordinated with team):**
   ```bash
   git push origin --force --all
   ```

4. **Notify team members** to re-clone or sync with the cleaned history

---

## 📞 Questions?

- Security concerns? Contact the project lead
- False positives? Document them in this file
- New secret patterns to detect? Update the pre-commit hook

Remember: **When in doubt, don't commit it.** It's easier to be safe than to clean up leaked secrets later.
