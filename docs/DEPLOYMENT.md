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
- **Node.js Version**: 22.x (or 20.19.0+)

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

## Architecture Decision: SSR for Instant Content Updates

### Current Configuration: Server-Side Rendering (SSR)

✅ **Status**: Using SSR (`output: 'server'`) with instant content updates.

The site uses SSR to provide a WordPress/Squarespace-like editing experience where content changes appear immediately after saving in Sanity Studio.

### Why SSR?

**Instant Content Updates:**
- ✅ Save in Sanity Studio → Refresh browser → See changes immediately
- ✅ No waiting for builds or webhook-triggered deploys
- ✅ Matches the experience content editors expect from traditional CMS platforms

**How It Works:**
1. Content editor publishes/updates in Sanity Studio
2. Next page request fetches fresh content from Sanity's CDN
3. Changes are visible immediately (no rebuild needed)

**Trade-offs Accepted:**
- Slightly higher latency (~100-200ms per request vs CDN-cached static pages)
- Site depends on Sanity being available at runtime
- Higher Vercel costs (function invocations instead of static assets)

### Caching Strategy

**Application-level cache:** Disabled (`CACHE_DURATION = 0` in `dataService.ts`)
- Sanity's CDN (`useCdn: true`) handles caching
- No double-caching needed for a modest-traffic festival website

**Sanity CDN:** Enabled
- API responses are cached at Sanity's edge
- Fresh content propagates within seconds

### Alternative: Static Site Generation (SSG)

If instant updates aren't needed and you prefer maximum performance/reliability:

```javascript
// frontend/astro.config.mjs
output: 'static',  // Build all pages at deploy time
```

With SSG:
- Content updates require webhook-triggered rebuilds (45+ seconds)
- Pre-built pages are served from CDN (fastest possible)
- Site works even if Sanity is down

---

## Sanity Studio Usage Limits

Understanding your Sanity plan limits (as of 2025):

| Resource | Monthly Limit | What It Means |
|----------|---------------|---------------|
| **API CDN Requests** | 1,000,000 | Cached content requests (production site visitors) |
| **API Requests** | 250,000 | Real-time requests (Studio usage, draft content) |
| **Bandwidth** | 100 GB | Total data transferred from API responses |
| **Assets** | 100 GB | Media storage + serving (images, PDFs, videos) |
| **Documents** | 10,000 | Total content entries in dataset |
| **Datasets** | 2 | Separate data containers (e.g., production, staging) |
| **Webhooks** | 2 | Automated notifications on content changes |

### What These Mean for Your Project

**API CDN Requests (1M/month):**
- Used by: Production website visitors fetching content
- Your usage: With SSG, ~50 requests per build + any preview/draft features
- Headroom: Can handle ~333,000 monthly visitors (assuming 3 requests each)

**API Requests (250k/month):**
- Used by: Sanity Studio editors, real-time content queries
- Your usage: 2-3 editors generating 100-500 requests/day = 3,000-15,000/month
- Headroom: Plenty for editorial workflow

**Bandwidth (100 GB):**
- Used by: JSON response data from GROQ queries
- Your usage: Typical query is 10-100 KB; unlikely to hit limit before request limits

**Assets (100 GB):**
- Used by: Images, PDFs, videos stored in Sanity
- Your usage: ~1,000 high-quality photos (5 MB each) = 5 GB storage
- Recommendation: Use YouTube/Vimeo for videos, not Sanity

**Documents (10k):**
- Your usage estimate: 200 events + 500 artists + 200 articles + 100 pages = ~1,000 documents
- Headroom: Room for many years of content growth

**Datasets (2):**
- Current: Using 1 (`production`)
- Available: 1 more if needed (could add `staging` for testing)

**Webhooks (2):**
- Not used with SSR (content updates are instant without rebuilds)
- Available: 2 for future use if switching to SSG or for notifications

### Optimizing API Usage

**Current config** (`frontend/astro.config.mjs`):
```javascript
useCdn: false,  // Uses non-CDN API (250k limit)
```

**Recommended for production:**
```javascript
useCdn: true,   // Uses CDN API (1M limit, still fresh enough)
```

This change:
- Increases your request limit 4x
- Adds only 1-2 seconds of potential delay (acceptable for festival content)
- Reduces load on Sanity servers

---

## Webhook Configuration

### With SSR: Webhooks Not Required

✅ **Current status:** Using SSR with instant content updates. **No webhook configured.**

With SSR mode, content changes in Sanity are fetched fresh on each page request. Webhooks that trigger rebuilds are unnecessary and have been removed.

### With SSG: Webhooks Required

If you switch back to SSG (`output: 'static'`), webhooks become essential for content updates.

**Staging (`staging` branch):**
- ❌ **NO webhook** - Manual rebuilds for testing

**Production (`main` branch):**
- ✅ **Webhook required** for content updates

### How to Configure Webhook (Only for SSG)

If using SSG and need webhook-triggered rebuilds:

#### 1. Get Vercel Deploy Hook URL

1. Go to Vercel project settings
2. **Settings → Git → Deploy Hooks**
3. Create new hook:
   - **Name**: "Production Content Updates"
   - **Branch**: `main`
   - **Scope**: Production
4. Copy the webhook URL (looks like: `https://api.vercel.com/v1/integrations/deploy/...`)

#### 2. Configure in Sanity

1. Go to [manage.sanity.io](https://manage.sanity.io)
2. Select project: `dnk98dp0`
3. Go to **API → Webhooks**
4. Click **"Create webhook"**
5. Configure:
   - **Name**: "Deploy Production Site"
   - **URL**: [Paste Vercel deploy hook URL]
   - **Dataset**: `production`
   - **Trigger on**: ✅ Create, ✅ Update, ✅ Delete
   - **Filter**: Leave empty (triggers on all document changes)
   - **Projection**: Leave empty
   - **HTTP method**: POST
   - **API version**: `v2021-06-07` (or latest)
6. Click **"Save"**

#### 3. Test the Webhook

1. Edit any document in Sanity Studio
2. Publish the change
3. Go to Vercel → Deployments
4. Verify new deployment triggered automatically
5. Check deployment logs for success
6. Visit production site to see updated content (after build completes)

#### 4. Monitor Webhook Activity

In Sanity webhook settings, you can:
- View delivery history
- See success/failure status
- Debug failed deliveries
- Temporarily disable if needed

### Webhook Limits

- **Available**: 2 webhooks total
- **Current usage**: 0
- **Planned**: 1 for production
- **Remaining**: 1 for future use (Slack notifications, cache clearing, etc.)

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

### 4. Verify Instant Content Updates

With SSR mode, content updates work immediately:
- Edit content in Sanity Studio
- Refresh the production site
- Changes appear instantly (no webhook or rebuild needed)

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

---

## SSG/Hybrid Implementation Checklist (Optional)

ℹ️ **Only use if switching away from SSR**

The site currently uses SSR for instant content updates. Use this checklist only if you want to switch to SSG (static) for maximum performance at the cost of slower content updates:

### Pre-Deployment Tasks

- [ ] Decide on approach: full SSG or hybrid (server mode with `prerender: true` on pages)
- [ ] If hybrid: Add `export const prerender = true` to all static pages (.astro files)
- [ ] Keep `export const prerender = false` on API routes (already set)
- [ ] Consider changing `useCdn: false` → `useCdn: true` for better API limits
- [ ] Test build locally: `cd frontend && npm run build`
- [ ] Verify all pages generate/work correctly
- [ ] Check for any dynamic routes that need `getStaticPaths()`
- [ ] Test the built site locally: `npm run preview`

### Staging Deployment

- [ ] Merge SSG changes to `staging` branch
- [ ] Push to GitHub (triggers Vercel deployment)
- [ ] Verify staging build succeeds in Vercel dashboard
- [ ] Visit `https://testing.kammermusikkfest.no` and test thoroughly
- [ ] Confirm content loads from Sanity correctly
- [ ] Test navigation and all major pages

### Production Deployment (Future)

- [ ] Merge `staging` → `main` when ready
- [ ] Configure production domain in Vercel
- [ ] Update DNS at Webhuset
- [ ] Wait for DNS propagation
- [ ] Test instant content updates (edit in Sanity → refresh → see changes)

### Post-Deployment Monitoring

- [ ] Check Sanity API usage in first week
- [ ] Monitor Vercel function invocations (SSR mode)
- [ ] Test content editor workflow (publish → refresh → see updates)
- [ ] Document any issues or optimizations needed
