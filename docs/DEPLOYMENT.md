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

## Architecture Decision: SSG vs SSR

### Current Configuration: Server-Side Rendering (SSR)

⚠️ **Status**: Currently using SSR (`output: 'server'`). SSG conversion postponed until main is ready for production deployment.

The site **currently uses SSR**, but **should convert to SSG/hybrid** when deploying main to production.

### Recommended Future Configuration: Hybrid Rendering

When ready to deploy main, convert to hybrid rendering for optimal performance:

**Why SSG?**
- ✅ **Performance**: Pre-built pages are lightning fast
- ✅ **Cost Efficiency**: One build = 50 API requests vs thousands from visitors
- ✅ **Reliability**: Pre-built pages can't fail; no dependency on Sanity being available
- ✅ **Lower API Usage**: Dramatically reduces Sanity API request consumption
- ✅ **Perfect for festival content**: Schedules, artists, news update occasionally, not every second

**How Content Updates Work with SSG:**
1. Content editor publishes/updates in Sanity Studio
2. Webhook triggers Vercel rebuild (1-2 minutes)
3. Site rebuilds with fresh content from Sanity
4. Next 10,000 visitors see pre-built pages (zero API calls to Sanity)

**Alternative: SSR (Server-Side Rendering)**
- Would fetch content on every page request
- Always shows latest content instantly
- Uses significantly more API requests
- Better for: real-time data, e-commerce inventory, personalized content
- Not ideal for: festival websites with relatively static content

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
- Planned: 1 webhook for production rebuilds
- Available: 1 more for future use (notifications, integrations)

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

Webhooks enable automatic site rebuilds when content changes in Sanity Studio.

### Strategy: Production Webhook Only

**Staging (`staging` branch):**
- ❌ **NO webhook configured**
- Manual rebuilds for testing
- Prevents unnecessary deploys during development

**Production (`main` branch):**
- ✅ **Webhook configured** (when main is deployed)
- Auto-rebuilds on content publish
- Content editors can publish independently

### When to Set Up Production Webhook

⚠️ **DO NOT set up the webhook until `main` is deployed to production**

**Timeline:**
1. ✅ Convert to SSG on current branch
2. ✅ Test SSG build locally
3. ✅ Merge to `staging` and verify
4. ⏳ Wait until ready to deploy `main` to production
5. ⏳ Deploy `main` to production
6. ⏳ **THEN** configure webhook

### How to Configure Webhook (Future Step)

When ready to deploy `main`:

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

### 4. Configure Production Webhook

⚠️ **IMPORTANT**: Only after production is live:
- Set up Vercel deploy hook for `main` branch
- Configure webhook in Sanity (see Webhook Configuration section above)
- Test the complete flow: Edit in Studio → Webhook → Build → Live site updates

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

## SSG/Hybrid Implementation Checklist

⚠️ **To be completed when main is ready for production deployment**

Use this checklist when converting from SSR to hybrid rendering:

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
- [ ] Create Vercel deploy hook for `main` branch
- [ ] Configure webhook in Sanity dashboard
- [ ] Test webhook: Edit content → Verify auto-rebuild
- [ ] Monitor first few rebuilds for issues

### Post-Deployment Monitoring

- [ ] Check Sanity API usage in first week
- [ ] Monitor Vercel build times
- [ ] Verify webhook deliveries are successful
- [ ] Test content editor workflow (publish → see updates)
- [ ] Document any issues or optimizations needed
