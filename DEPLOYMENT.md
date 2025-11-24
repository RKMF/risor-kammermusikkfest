# Deployment Guide: Vercel + Custom Domain

This guide walks you through deploying the **Risør Kammermusikkfest** website to Vercel with separate staging and production environments.

## Overview

- **Staging**: `staging` branch → `https://testing.kammermusikkfest.no`
- **Production**: `main` branch → `https://kammermusikkfest.no` (future)
- **Same Vercel Project**: Both environments in one project

---

## Prerequisites

- [x] Vercel account (already have)
- [x] Access to Webhuset DNS management (already have)
- [x] GitHub repository connected to Vercel
- [ ] Sanity API token (read access)

---

## Step 1: Create Vercel Project

### 1.1 Import Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository: `Risør kammermusikkfest`

### 1.2 Configure Project Settings

**IMPORTANT**: Click **"Edit"** next to Root Directory and configure:

- **Framework Preset**: Astro
- **Root Directory**: `frontend` ⚠️ **CRITICAL** - Must point to frontend workspace
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install --legacy-peer-deps` ⚠️ **REQUIRED**
- **Node.js Version**: 20.x

> **Why `--legacy-peer-deps`?** Your project uses NPM workspaces and requires this flag to install correctly.

### 1.3 Don't Deploy Yet!

Click **"Configure Project"** but **DO NOT** click "Deploy" yet. We need to add environment variables first.

---

## Step 2: Add Environment Variables

In Vercel project settings, go to **Settings → Environment Variables**.

Add the following variables:

### Required Variables

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `PUBLIC_SANITY_PROJECT_ID` | `dnk98dp0` | All |
| `PUBLIC_SANITY_DATASET` | `production` | All |
| `PUBLIC_SANITY_API_VERSION` | `2025-01-01` | All |
| `SANITY_API_READ_TOKEN` | `[GET FROM SANITY]` | All |
| `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` | `true` | All |
| `PUBLIC_SANITY_STUDIO_URL` | `https://dnk98dp0.sanity.studio` | All |
| `NODE_ENV` | `production` | All |

### Branch-Specific Variables

| Variable Name | Production (main) | Preview (staging) |
|---------------|-------------------|-------------------|
| `SITE_URL` | `https://kammermusikkfest.no` | `https://testing.kammermusikkfest.no` |

### How to Get Sanity API Token

1. Go to [sanity.io/manage](https://manage.sanity.io)
2. Select project: `dnk98dp0`
3. Go to **API → Tokens**
4. Click **"Add API token"**
5. Name: `Vercel Read Token`
6. Permissions: **Viewer** (read-only)
7. Copy the token and paste into Vercel environment variables

---

## Step 3: Initial Deployment

### 3.1 Deploy Staging Branch

1. In Vercel dashboard, go to **Deployments**
2. Click **"Deploy"** or push a commit to the `staging` branch
3. Vercel will automatically deploy the staging branch as a **Preview deployment**
4. You'll get a temporary URL like: `risor-kammermusikkfest-git-staging-yourteam.vercel.app`

### 3.2 Verify Build Success

Check the deployment logs. If it fails:
- Verify `--legacy-peer-deps` is in Install Command
- Verify Root Directory is set to `frontend`
- Check environment variables are set correctly

---

## Step 4: Add Custom Domain (Staging)

### 4.1 Add Domain in Vercel

1. Go to **Settings → Domains**
2. Click **"Add Domain"**
3. Enter: `testing.kammermusikkfest.no`
4. Vercel will show DNS configuration instructions

### 4.2 Assign to Staging Branch

⚠️ **IMPORTANT**: After adding the domain:

1. Click on `testing.kammermusikkfest.no` in the domains list
2. Under **"Git Branch"**, select `staging`
3. Save

This ensures the subdomain always points to the staging branch deployment.

---

## Step 5: Configure DNS at Webhuset

Vercel will provide DNS records. You need to add these in Webhuset's control panel.

### Option A: CNAME Record (Recommended)

Log into Webhuset and add:

```
Type: CNAME
Name: testing.kammermusikkfest.no
Value: cname.vercel-dns.com.
TTL: 3600
```

### Option B: A Records (If CNAME Not Supported)

```
Type: A
Name: testing.kammermusikkfest.no
Value: 76.76.21.21
TTL: 3600
```

```
Type: A
Name: testing.kammermusikkfest.no
Value: 76.76.21.142
TTL: 3600
```

```
Type: A
Name: testing.kammermusikkfest.no
Value: 76.76.21.164
TTL: 3600
```

> **Note**: Vercel's IP addresses may change. Always use the values shown in your Vercel dashboard.

### 5.1 Wait for DNS Propagation

- **Minimum**: 5-10 minutes
- **Maximum**: 24-48 hours (rare)
- **Typical**: 30-60 minutes

Check status: `dig testing.kammermusikkfest.no` or use [whatsmydns.net](https://www.whatsmydns.net/)

---

## Step 6: Verify Deployment

Once DNS propagates:

1. Visit `https://testing.kammermusikkfest.no`
2. Check that the site loads correctly
3. Open browser console (F12) and check for errors
4. Verify content loads from Sanity
5. Test navigation between pages

### Troubleshooting

**Site shows 404:**
- DNS not propagated yet (wait longer)
- Domain not assigned to correct branch in Vercel
- Check Vercel deployment status

**500 Error:**
- Check Vercel deployment logs
- Verify all environment variables are set
- Check `SANITY_API_READ_TOKEN` is valid

**Content not loading:**
- Verify `PUBLIC_SANITY_PROJECT_ID` is correct
- Check `SANITY_API_READ_TOKEN` has read permissions
- Verify `PUBLIC_SANITY_DATASET` is `production`

**CSS not loading:**
- Check build logs for Astro build errors
- Verify output directory is set to `dist`

---

## Step 7: Configure Sanity Studio Preview (Optional)

To enable visual editing from Sanity Studio pointing to your staging site:

### 7.1 Add Environment Variable to Sanity Deploy

When you deploy Sanity Studio, you can set an environment variable:

```bash
cd studio
npx sanity deploy --env SANITY_STUDIO_PREVIEW_URL=https://testing.kammermusikkfest.no
```

Or configure it in Sanity project settings at [sanity.io/manage](https://manage.sanity.io).

---

## Future: Production Deployment

When ready to deploy `main` branch to production:

### 1. Add Production Domain

1. In Vercel: **Settings → Domains → Add Domain**
2. Enter: `kammermusikkfest.no` (or `www.kammermusikkfest.no`)
3. Assign to `main` branch
4. Configure DNS at Webhuset similarly

### 2. Update Environment Variables

Ensure `SITE_URL` is set correctly for production:
- Production environment: `https://kammermusikkfest.no`

### 3. Deploy

Push to `main` branch, and Vercel will automatically deploy to production.

---

## Automatic Deployments

Vercel's GitHub integration automatically deploys:

- **Push to `main`** → Production deployment
- **Push to `staging`** → Staging deployment (testing.kammermusikkfest.no)
- **Pull requests** → Preview deployments (temporary URLs)

No manual deploys needed - just push to GitHub!

---

## Project Structure

This is a **monorepo** with two workspaces:

```
/
├── frontend/          ← Astro app (deploys to Vercel)
│   ├── src/
│   ├── dist/          ← Build output
│   └── package.json
├── studio/            ← Sanity Studio (deploys to Sanity hosting)
│   └── package.json
├── vercel.json        ← Vercel configuration
└── package.json       ← Root workspace config
```

**Vercel only deploys the frontend.** The Studio deploys separately via:

```bash
cd studio
npm run deploy
```

---

## Important Notes

⚠️ **Root Directory**: Always verify Vercel is configured with `frontend` as the root directory

⚠️ **Install Command**: Must use `npm install --legacy-peer-deps`

⚠️ **Environment Variables**: Never commit `.env` files - always use Vercel dashboard

⚠️ **Branch Assignment**: Double-check domains are assigned to correct branches

⚠️ **Sanity Studio**: Deploys separately to Sanity hosting, not to Vercel

---

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Astro + Vercel**: [docs.astro.build/en/guides/deploy/vercel/](https://docs.astro.build/en/guides/deploy/vercel/)
- **Webhuset Support**: Contact for DNS help
- **Sanity Docs**: [sanity.io/docs](https://www.sanity.io/docs)

---

## Quick Reference

### Vercel Dashboard URLs
- Project settings: `https://vercel.com/[your-team]/[project-name]/settings`
- Environment variables: `https://vercel.com/[your-team]/[project-name]/settings/environment-variables`
- Domains: `https://vercel.com/[your-team]/[project-name]/settings/domains`

### Common Commands
```bash
# Local development (frontend)
cd frontend
npm run dev

# Build locally (test build)
cd frontend
npm run build

# Deploy Sanity Studio
cd studio
npm run deploy

# Check DNS propagation
dig testing.kammermusikkfest.no

# View Vercel logs
vercel logs [deployment-url]
```

---

**Last Updated**: 2025-01-24
