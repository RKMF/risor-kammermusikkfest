# Project Guide: Production-Ready & Simple

This is a **professional festival website in production**. Security, quality, and maintainability are non-negotiable. Simplicity means **focused and maintainable**, not amateur or shortcuts.

## 1. Philosophy & Identity

### Core Principle: Production-Ready Simplicity

**Non-negotiable professional standards:**
- ✅ **Security best practices** - XSS prevention, input validation, sanitization, HTTPS
- ✅ **Code quality** - DRY principles, type safety, clear naming, proper error handling
- ✅ **Testing critical paths** - Security boundaries, user flows, integrations
- ✅ **Dependency security** - Keep packages updated for security patches
- ✅ **Professional error handling** - Graceful failures, proper logging, user-friendly messages
- ✅ **Accessibility** - Semantic HTML, ARIA labels, keyboard navigation
- ✅ **Performance** - Optimized assets, efficient queries, fast page loads

**What "Simple" means in this context:**
- ❌ **NOT**: Skip tests, ignore security, take shortcuts, write amateur code, skip documentation
- ✅ **YES**: Avoid over-engineering, stay focused on festival website needs, don't add unnecessary complexity, use straightforward solutions

### What This Project IS
- A **production-grade** festival website serving real users
- Professional code following industry web security standards
- Tested, maintainable, and secure architecture
- Simple, focused design addressing actual requirements
- Bilingual support (Norwegian/English) with proper i18n practices
- Visual Editing workflow for content management

### What This Project IS NOT
- An excuse to skip best practices or cut corners
- A place for untested, vulnerable, or amateur code
- Over-engineered with microservices or complex architectures
- Built with technical debt or known security issues

### Decision Framework

Before making **ANY** change, evaluate in this order:

**1. Security & Quality Check** (Non-negotiable)
- Does this maintain security standards? (If no, STOP)
- Does this follow code quality best practices?
- Is this properly tested or testable?
- Will this introduce vulnerabilities or technical debt?

**2. User Value Check**
- Is this solving a real user problem or security issue?
- Is this specifically needed for a festival website?
- Does this improve user experience or site reliability?

**3. Simplicity Check**
- Is this the simplest **professional** solution?
- Does this add unnecessary complexity?
- Are we over-engineering for hypothetical future needs?

### Rules for Changes

#### ✅ ALWAYS DO (Non-negotiable)
- Fix security vulnerabilities immediately
- Write tests for critical functionality (auth, payments, data validation)
- Follow TypeScript best practices and maintain type safety
- Keep dependencies updated for security (use `npm audit`)
- Use proper error handling and logging
- Validate and sanitize all user input
- Follow WCAG accessibility standards
- Document complex logic and architectural decisions
- Use environment variables for secrets (never commit tokens/keys)
- Implement proper CORS and CSP headers

#### ❌ NEVER DO
- Skip security measures to "keep it simple"
- Ignore test coverage for critical user paths
- Leave known vulnerabilities unfixed
- Use deprecated or insecure packages
- Skip input validation or sanitization
- Commit secrets or API keys to git
- Ignore accessibility requirements
- Add microservices architecture (not needed for this scale)
- Over-abstract for hypothetical future requirements
- Use emojis in code, UI, or content (only when explicitly requested)

#### 🤔 EVALUATE CASE-BY-CASE
- **New features** - Must solve real user needs, not hypothetical
- **Major version upgrades** - Balance security benefits vs. breaking changes
- **Refactoring working code** - Improve if clear maintainability/security gain
- **Changing Node.js version** - Only for security or required features (currently 22.x LTS)
- **Adding monitoring/analytics** - Only when specifically required for business needs

### Common Pitfalls to Avoid

1. **Confusing "simple" with "amateur"** → Simple means focused, not shortcuts
2. **Skipping tests for "speed"** → Always test critical paths and security
3. **Ignoring security updates** → Run `npm audit fix` regularly
4. **Breaking Visual Editing** → Test preview after any Sanity config changes
5. **Removing bilingual support** → Keep `nbNOLocale()` and proper i18n structure
6. **Over-engineering** → Don't add enterprise patterns not needed at this scale

---

## 2. Core Technologies

### 2.1 Sanity CMS

#### Schema Design

**Basic Conventions:**
- ALWAYS use `defineType`, `defineField`, and `defineArrayMember` helper functions
- ALWAYS write schema types to their own files and export a named `const` that matches the filename
- ONLY use a `name` attribute in fields unless the `title` needs to be something other than a title-case version of the `name`
- INCLUDE brief, useful `description` values if the intention of a field is not obvious
- INCLUDE `rule.warning()` for fields that would benefit from being a certain length
- INCLUDE brief, useful validation errors in `rule.required().error('<Message>')`

**Field Type Guidelines:**
- ANY `string` field type with an `options.list` array with fewer than 5 options must use `options.layout: "radio"`
- ANY `image` field must include `options.hotspot: true`
- AVOID `boolean` fields, write a `string` field with an `options.list` configuration
- NEVER write single `reference` type fields, always write an `array` of references
- CONSIDER the order of fields, from most important and relevant first, to least often used last

**Decorating Schema Types:**

Every `document` and `object` schema type should:
- Have an `icon` property from `@sanity/icons`
- Have a customized `preview` property that shows rich contextual details about the document
- Use `groups` when the schema type has more than a few fields to collate related fields
- Use `fieldsets` with `options: {columns: 2}` if related fields could be grouped visually together

**Example:**
```ts
// ./studio/schemaTypes/lessonType.ts
import {defineField, defineType} from 'sanity'

export const lessonType = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'categories',
      type: 'array',
      of: [{type: 'reference', to: {type: 'category'}}],
    }),
  ],
})
```

**Shared Utilities Pattern:**

To maintain DRY (Don't Repeat Yourself) principles across schemas, use shared utilities from `schemaTypes/shared/`:

- **`previewHelpers.ts`** - Reusable preview logic functions:
  - `getPublishingStatusText()` - Consistent status display (Draft/Published/Live/Scheduled)
  - `getLanguageStatus()` - Bilingual content detection (NO/EN flags)

- **`publishingFields.ts`** - Reusable field definitions:
  - `publishingFields()` - Standard publishing status and scheduling fields
  - `publishingGroup` - Consistent group configuration
  - Eliminates duplicate field definitions across document types

**Example:**
```ts
// ./studio/schemaTypes/documents/article.ts
import {getPublishingStatusText, getLanguageStatus} from '../shared/previewHelpers'
import {publishingFields, publishingGroup} from '../shared/publishingFields'

export const article = defineType({
  name: 'article',
  groups: [publishingGroup, /* other groups */],
  fields: [
    /* content fields */,
    ...publishingFields('publishing', 'artikkelen'),
  ],
  preview: {
    prepare({title_no, title_en, publishingStatus, scheduledStart, scheduledEnd, _id}) {
      const statusText = getPublishingStatusText(_id, publishingStatus, scheduledStart, scheduledEnd)
      const langStatus = getLanguageStatus({title_no, title_en})

      return {
        title: title_no || title_en || 'Uten tittel',
        subtitle: `${statusText} • ${langStatus}`,
      }
    },
  },
})
```

This pattern ensures consistency across all document schemas (artist, article, page, event, homepage) while reducing code duplication.

#### Content Modeling

- Unless explicitly modeling web pages or app views, create content models for what things are, not what they look like in a front-end
- For example, consider the `status` of an element instead of its `color`
- Any schema type that benefits from being reused should be registered as its own custom schema type (no anonymous reusable types)

#### GROQ Queries

**Conventions:**
- ALWAYS use SCREAMING_SNAKE_CASE for variable names (e.g., `POSTS_QUERY`)
- ALWAYS write queries to their own variables, never as a parameter in a function
- ALWAYS import the `defineQuery` function to wrap query strings from the `groq` or `next-sanity` package
- ALWAYS write every required attribute in a projection when writing a query
- ALWAYS put each segment of a filter, and each attribute on its own line
- ALWAYS use parameters for variables in a query
- NEVER insert dynamic values using string interpolation

**Example:**
```ts
import {defineQuery} from 'groq'

export const POST_QUERY = defineQuery(`*[
  _type == "post"
  && slug.current == $slug
][0]{
  _id,
  title,
  image,
  author->{
    _id,
    name
  }
}`)
```

#### TypeScript Generation

**For the Studio:**
- ALWAYS re-run schema extraction after making schema file changes: `npx sanity@latest schema extract`

**For Monorepos (studio + frontend):**
- ALWAYS extract the schema to the frontend folder: `npx sanity@latest schema extract --path=../frontend/sanity/extract.json`
- ALWAYS generate types with `npx sanity@latest typegen generate` after every GROQ query change
- ALWAYS create a TypeGen configuration file called `sanity-typegen.json` at the root of the frontend codebase

#### Visual Editing

**Requirements:**
- Both servers running (see Section 3 Server Management)
- Preview mode cookie: `sanity-preview-mode=true`
- Environment variables configured (see Section 3 Environment Variables)

**API Configuration:**
- Use `apiVersion: "2025-01-01"` in Sanity configuration for latest features
- Set `useCdn: false` in development for real-time content updates

**Content Structure:**
- Bilingual content handling (see Section 4 Development Workflow)
- Keep content schemas simple - avoid complex relationships unless needed

### 2.2 Astro Framework

#### Architecture
- Use SSG (Static Site Generation) for content pages
- Use SSR (Server-Side Rendering) for dynamic features requiring real-time data
- Components use TypeScript in `<script>` sections
- API routes written in TypeScript (`/pages/api/*.ts`)
- Client-side scripts written in vanilla JavaScript (`/scripts/*.js`)

#### Component Patterns
- Keep components simple and focused on single responsibilities
- Use Astro components for static/server-rendered content
- Use React only when truly needed for complex client-side interactivity
- Prefer HTMX over React for most interactivity needs

#### Routing
- Use `[slug].astro` for dynamic routes
- Keep route structure flat - avoid deep nesting
- Bilingual routes: `/program` (Norwegian), `/en/program` (English)
- Use `trailingSlash: 'never'` for clean URLs

#### Performance
- Enable prefetch for key navigation paths
- Keep client JavaScript minimal
- Leverage Astro's built-in optimizations (automatic image optimization, etc.)
- Use `prefetch: { prefetchAll: false, defaultStrategy: 'viewport' }`

#### Integration
- Sanity content fetched via `createDataService()` utility
- HTMX integration via `astro-htmx` package
- React integration available but use sparingly

### 2.3 HTMX for Interactivity

#### When to Use HTMX
- Event filtering with server-rendered results
- Form submissions with validation feedback
- Partial page updates without full page reload
- Progressive enhancement over static HTML
- Simple CRUD operations

#### When NOT to Use HTMX
- Complex client-side state management
- Real-time features requiring WebSockets
- Heavy data manipulation that should happen in the browser
- Features requiring instant feedback without network latency

#### Patterns

**Basic HTMX Attributes:**
- `hx-get="/api/endpoint"` - Fetch content via GET request
- `hx-vals='{"key": "value"}'` - Pass parameters to the request
- `hx-target="#element-id"` - Specify where content should load
- `hx-push-url="true"` - Update browser URL when content loads
- `hx-swap="innerHTML"` - Control how content is swapped in

**Event Filtering Example:**
```html
<a href="/program?date=2024-01-01"
   hx-get="/api/filter-program"
   hx-vals='{"date": "2024-01-01", "venue": ""}'
   hx-target="#program-list"
   hx-push-url="true"
   data-filter-type="date"
   data-filter-value="2024-01-01">
  Filter by Date
</a>
```

#### Integration with JavaScript

- Use vanilla JavaScript to handle HTMX events for coordination
- Listen to `htmx:afterSettle` for post-swap actions
- Listen to `htmx:historyRestore` for browser back/forward handling
- Keep HTMX attributes in HTML, logic in separate `.js` files
- Example: Filter button state synchronization via event listeners

### 2.4 JavaScript (Client-Side)

#### Purpose
- DOM manipulation and event handling
- HTMX event listeners and state coordination
- Progressive enhancement features
- Browser-side state synchronization with URL parameters

#### Best Practices
- Keep scripts small and focused (single responsibility principle)
- Use ES6 modules with named exports
- Document public functions with JSDoc comments
- Store client scripts in `/src/scripts/` directory
- Scripts are NOT type-checked (`"checkJs": false`) - keep logic simple and testable
- Use event delegation for dynamic content added by HTMX

#### Code Structure
```javascript
/**
 * Brief description of what this module does
 */

/**
 * Public function with JSDoc
 * @param {string} param - Description
 * @returns {void}
 */
export function initializeSomeFeature(param) {
  // Implementation
}
```

#### Patterns
- Export initialization functions that set up event listeners
- Avoid global variables - use module scope
- Keep compatible with modern browsers (no transpilation needed)
- Example: `syncFilterButtonStatesWithUrl.js` for filter state management

### 2.5 TypeScript

#### Where Used
- Sanity Studio (schemas, configuration, plugins)
- Astro component `<script>` sections
- API routes and endpoints (`/pages/api/*.ts`)
- Utility libraries and data services
- Type definitions (`.d.ts` files)

#### Configuration
- Strict mode enabled (`"strict": true`)
- Allows JavaScript imports (`"allowJs": true`, but `"checkJs": false`)
- Don't apply overly strict settings that break existing code
- Use `extends: "astro/tsconfigs/strict"` for Astro-specific configs

#### Type Patterns
- Prefer `interface` for object shapes
- Use `type` for unions, intersections, and mapped types
- Generate Sanity types automatically using TypeGen (see section 2.1)
- Types are generated in `frontend/sanity/sanity.types.ts` from schema extraction

#### Philosophy
- **Type safety is a professional standard** - Use TypeScript properly, not as an afterthought
- **Strict enough to catch bugs** - Enable strict mode flags that prevent common errors
- **Fix type errors, don't ignore them** - Type errors usually indicate real problems
- **Pragmatic, not dogmatic** - Use `any` sparingly when dealing with truly dynamic data (e.g., CMS content), but document why
- **Incremental improvement** - Improve types when touching code, don't let technical debt grow

---

## 3. Environment & Setup

### Node.js Version Management
- **Use Node.js v22.x LTS** (or minimum v20.19.0) - These are the proven compatible versions
- **Never upgrade Node.js** without testing both studio and frontend first
- Prefer even-numbered LTS versions (20, 22, 24) over odd versions (21, 23)

### Version Compatibility (December 2024)

This project uses a proven, tested combination of Node.js, Astro, and Sanity versions:

**Current Versions:**
| Component | Version | Why |
|-----------|---------|-----|
| Node.js | 22.x LTS | Best compatibility with all deps, LTS support until 2027 |
| Astro | 5.16.x | Latest stable, requires Node 20.3+ or 22+ |
| Sanity Studio | 4.x | Node 20.19+ required (only breaking change from v3) |
| @sanity/astro | 3.2.x | Visual Editing integration |
| @sanity/client | 6.x | API client for content fetching |

**Compatibility Matrix:**
| Component | Minimum Node.js | Recommended |
|-----------|-----------------|-------------|
| Sanity v4 | 20.19+ | 22.x |
| Astro 5.8+ | 20.3.0+ | 22.x |
| Vercel | 20.x or 22.x | 22.x |

**Why These Versions:**
- **Node 22.x**: All dependencies officially support it, LTS until April 2027
- **Astro 5.x**: Stable, mature, with excellent Sanity integration
- **Sanity 4.x**: The v3→v4 upgrade ONLY changes Node.js requirements, nothing else
- **Frontend sanity package**: Uses v3.x as peer dependency for @sanity/astro (this is correct)

**Upgrade Guidelines:**
- Minor version updates (5.16 → 5.17): Generally safe, run `npm update`
- Major version updates (Astro 5 → 6): Wait for stability, test thoroughly
- Node.js updates: Stick to even LTS versions, test both studio and frontend
- Always run `npm run build` after any dependency changes

### Dependency Management
- **Use `npm install --legacy-peer-deps`** for dependency conflicts
- **Update for security and stability** - prioritize security patches and minor updates from trusted sources
- **Sanity Studio updates** - keep reasonably current to get security fixes and bug improvements
- **Avoid major version jumps** - update incrementally (4.4 → 4.5 → 4.6, not 4.4 → 5.0)
- **Test after any dependency changes** - both studio and frontend must work

### Security Checks

**Automated Protection:**
- Vercel runs builds on every push - if build fails, deployment is blocked
- New code with serious vulnerabilities won't deploy (your live site keeps running the previous safe version)

**Manual Dependency Updates (Quarterly):**
Every 3 months (January, April, July, October), update dependencies manually:
```bash
# On staging branch
cd frontend && npm update && npm run build
cd ../studio && npm update && npm run build

# Test locally
npm run dev:frontend  # Terminal 1
npm run dev:studio    # Terminal 2

# If working, commit and push to staging
git add -A && git commit -m "chore: Quarterly dependency update"
git push origin staging

# Test on testing.kammermusikkfest.no
# Then create PR: staging → main
```

**Manual Checks:**
Before major releases or dependency updates:
```bash
cd frontend && npm audit
cd studio && npm audit
```

**Handling Issues:**
- Serious issues must be fixed before merging
- Minor issues should be evaluated for actual risk in our context
- Some upstream dependencies may have unfixed issues - track and update when fixes are available

### Server Management
- **Always run both servers**: Studio (3333) + Frontend (4321) for Visual Editing
- **Start servers separately** in different terminals due to Vite process management issues
- **Check both endpoints** respond before testing Visual Editing
- See **Section 7 Quick Reference** for startup commands

### Environment Variables

**Required for Visual Editing:**
- `SANITY_API_READ_TOKEN` - API token with read permissions
- `PUBLIC_SANITY_VISUAL_EDITING_ENABLED=true` - Enables Visual Editing features

**Sanity Configuration:**
- Project ID: `dnk98dp0`
- Dataset: `production`
- Studio URL: `http://localhost:3333`
- Frontend URL: `http://localhost:4321`

### Analytics

**Vercel Web Analytics and Speed Insights** are enabled for production deployments. No configuration needed - Vercel auto-detects the environment.

**What's Tracked:**
- **Web Analytics**: Page views, unique visitors, referrers, geography, device types
- **Speed Insights**: Core Web Vitals (LCP, FID, CLS), performance metrics

**View Dashboard:**
- Vercel Dashboard > risor-kammermusikkfest-frontend > Analytics tab
- Direct link: https://vercel.com/risor-kammermusikkfests-projects/risor-kammermusikkfest-frontend/analytics

**Exclude Yourself from Tracking:**

To prevent your development/testing visits from skewing analytics data, run this once in your browser console on the live site:

```javascript
// Disable tracking for this browser
localStorage.setItem('va-disable', 'true')

// To re-enable tracking later
localStorage.removeItem('va-disable')
```

**Implementation:**
- Components: `@vercel/analytics/astro` and `@vercel/speed-insights/astro`
- Location: `frontend/src/layouts/Layout.astro`
- Only runs in production (local dev is not tracked)

---

## 4. Development Workflow

### File Editing Workflow
- **Always read a file before editing it** to understand the current code and how changes will alter it
- **Never attempt to edit based on assumptions** about file content from memory or previous sessions
- **Understand the context** before making changes to ensure proper integration

### Web Research Methodology
- **Always search chronologically starting with the current year first, then work backwards** through previous years (last year, the year before, etc.)
- **Rationale**: Technology evolves rapidly - recent solutions often supersede older approaches with better performance, support, or maintainability
- **Note**: This same methodology is defined in all specialized agent files (`.claude/agents/`)

### Bilingual Content Handling
- **Norwegian as default language** - Primary content in Norwegian
- **English as optional** - English translations optional but encouraged
- **URL structure**: `/path` (Norwegian), `/en/path` (English)
- **Language detection**: Automatically detect from URL path for content queries
- **Date formatting**: Use appropriate locale for each language in displays

---

## 5. Git Workflow

### Branch Strategy: Two-Branch Model

**Permanent Branches:**

| Branch | Purpose | URL | Protection |
|--------|---------|-----|------------|
| `staging` | Development & testing | testing.kammermusikkfest.no | None |
| `main` | Production only | www.kammermusikkfest.no | PR + linear history |

**⚠️ NEVER DELETE these branches** - They are permanent and connected to Vercel deployments:
- `staging` → testing.kammermusikkfest.no
- `main` → www.kammermusikkfest.no

**Branch Protection Settings:**
- **staging**: No protection (Vercel validates builds automatically)
- **main**: PR required + linear history (enforces staging → main flow, clean commit history)

**Temporary Branches (Your Workspace):**
- `feature/*` - New features (e.g., `feature/ticket-sales`)
- `fix/*` - Bug fixes (e.g., `fix/date-formatting`)
- `chore/*` - Maintenance tasks (e.g., `chore/update-deps`)

**⚠️ CRITICAL WORKFLOW RULES:**

1. **ALL work happens on staging first**
   - Create feature branches FROM staging
   - Merge feature branches TO staging
   - Test on testing.kammermusikkfest.no

2. **main is ONLY updated via PR from staging**
   - Never commit directly to main
   - Never create feature branches from main
   - One PR: staging → main (for releases)

3. **Sync direction is ONE WAY: staging → main**
   - Never merge main into staging
   - If main gets ahead somehow, reset it to staging

4. **NEVER delete staging or main branches**
   - These are permanent branches with Vercel deployments
   - Use `--delete-branch` flag ONLY for feature branches
   - If accidentally deleted, recreate immediately from the other branch

```
feature-branch → staging → main
                    ↓         ↓
              testing.    www.
              kammermusikkfest.no
```

### Standard Workflow

```bash
# 1. Create feature branch FROM staging
git checkout staging
git pull origin staging
git checkout -b feature/new-feature

# 2. Develop and commit (as many times as needed)
git add .
git commit -m "Add new feature"
# Work more, commit more...

# 3. Push when ready
git push origin feature/new-feature

# 4. Create PR: feature/new-feature → staging
gh pr create --base staging --title "Feature description"

# 5. Review PR in Cursor IDE (GitHub Pull Requests extension)
# - Or view in terminal: gh pr diff

# 6. Merge to staging
gh pr merge --squash --delete-branch

# 7. Test on staging URL, then promote to production
gh pr create --base main --head staging --title "Release: feature description"
# ⚠️ IMPORTANT: Review and merge in GitHub UI (not CLI) for production releases

# 8. Feature branch already deleted by --delete-branch flag
```

### Branch Management Rules
- **Always create feature branches from staging** (not from main)
- **Always merge feature branches to staging first** (never directly to main)
- **Delete feature branches immediately after merge** - keep repository clean
- **Never delete staging or main** - only delete feature branches after merge
- **Keep staging in sync with main** when starting new work
- **Update your feature branch from staging** if it gets behind during development

### How Often to Commit/Push/PR

**Commit (Very Often - Local Only):**
- After completing each small piece of work
- After fixing a bug
- Before trying something risky (easy to undo)
- Frequency: 5-20+ times per day is normal
- Command: `git add . && git commit -m "Description"`

**Push (When Ready for Backup):**
- End of work session (end of day, lunch break)
- When you've hit a milestone
- When you want work backed up to GitHub
- Frequency: 1-3 times per day
- Command: `git push origin feature/branch-name`

**PR + Merge (When Feature Complete):**
- End of day if feature is done
- When ready for staging/production testing
- Frequency: 1-2 times per day, or every few days

### Commit & Push Guidelines (for AI Assistants)
- Suggest pushing changes proactively after completing logical milestones
- Make meaningful commit messages that explain what was accomplished
- Push when it makes sense based on user's workflow

### Deployment Workflow

**⚠️ CRITICAL: Two Separate Deployment Systems**

This project has **TWO independent deployment paths** - understand the difference to avoid confusion:

#### Frontend Deployment (Automatic via Vercel)

**What it deploys:**
- Astro website code
- Page components, layouts, styles
- Client-side JavaScript
- API routes

**How it works:**
```bash
# 1. Commit and push changes
git add frontend/
git commit -m "Update frontend"
git push origin feature/branch-name

# 2. Automatic deployment happens
# - Vercel detects push to GitHub
# - Builds frontend automatically
# - Creates preview URL for feature branches
# - Deploys to production when merged to main
```

**Deployment targets:**
- `feature/*` branches → Auto preview URLs (e.g., `project-branch-hash.vercel.app`)
- `staging` branch → `testing.kammermusikkfest.no`
- `main` branch → `kammermusikkfest.no` (production)

**Key points:**
- ✅ Automatic - no manual deployment needed
- ✅ Git commit/push triggers deployment
- ✅ Preview URLs for every branch
- ✅ See deployment status in Vercel dashboard

#### Studio Deployment (Automatic on main)

**What it deploys:**
- Sanity Studio CMS interface
- Content schemas and document types
- Custom actions and plugins
- Studio configuration

**How it works:**
- When you merge Studio changes to `main`, GitHub Actions automatically deploys
- Only triggers when files in `studio/` directory change
- Can also deploy manually: `cd studio && npm run deploy`

**Deployment target:**
- Always deploys to: `https://rkmf-cms.sanity.studio/`
- Single production environment (no preview URLs)

**Key points:**
- ✅ Automatic on merge to main (when studio/ files change)
- ✅ Can also deploy manually for quick fixes
- ⚠️ No preview URLs - test locally before merging

#### Why Two Systems?

**Different hosting providers:**
- **Frontend**: Hosted on Vercel's edge network (automatic via git)
- **Studio**: Hosted on Sanity's infrastructure (automatic via GitHub Actions on main)

#### Best Practice Workflow

**For All Changes (Same Workflow):**
```bash
# 1. Create feature branch from staging
git checkout staging && git pull
git checkout -b feature/my-change

# 2. Make changes, test locally
# Frontend: http://localhost:4321
# Studio: http://localhost:3333

# 3. Commit and push
git add . && git commit -m "Description"
git push origin feature/my-change

# 4. Create PR to staging, test on testing.kammermusikkfest.no
# 5. When ready, create PR from staging to main
# 6. Both frontend AND studio deploy automatically on merge to main
```

**Quick Studio Hotfix (emergency only):**
```bash
cd studio && npm run deploy
```

### Git Tracking Best Practices

Understanding **what files we track** and **why** is crucial for security, collaboration, and repository cleanliness.

**What We Track (and Why):**

✅ **Source Code**
- All `.ts`, `.astro`, `.tsx`, `.css` files
- **Why**: The actual code we write - the source of truth

✅ **Configuration Files**
- `package.json`, `tsconfig.json`, `astro.config.mjs`, `sanity.config.ts`, etc.
- `.env.example` (template without secrets)
- `.editorconfig` (cross-editor formatting standards)
- **Why**: Required to run the project and maintain consistency

✅ **Lock Files**
- `package-lock.json`
- **Why**: Ensures reproducible builds - everyone gets same dependency versions

✅ **Documentation**
- `README.md` (at root), `docs/` folder (PROJECT_GUIDE, DEPLOYMENT, DESIGN-SYSTEM, MEDIA, SECURITY)
- **Why**: Project knowledge, onboarding, and history

**What We DON'T Track (and Why):**

❌ **Generated Files**
- `frontend/sanity/extract.json` (188KB)
- `frontend/sanity/sanity.types.ts` (32KB)
- `*.tsbuildinfo` (TypeScript incremental build cache)
- **Why**: Generated from source schemas, creates merge conflicts, bloats repository
- **How to regenerate**: Run `npm run typegen` (see Sanity TypeGen Workflow in Section 2.1)

❌ **Dependencies**
- `node_modules/`
- **Why**: Installed from package.json + lock file, massive size (100MB+)

❌ **Build Outputs**
- `dist/`, `.astro/`, `.vercel/`, `build/`
- **Why**: Generated during build process, can be recreated

❌ **Secrets & Environment Variables**
- `.env`, `.env.local` (anything with actual secrets)
- **Why**: SECURITY - never commit API keys, tokens, passwords
- **Safe to commit**: `.env.example` (template with placeholder values only)

❌ **OS & Editor Files**
- `.DS_Store` (macOS), `Thumbs.db` (Windows)
- `.vscode/` workspace cache files
- **Why**: Personal machine artifacts, pollute repository

❌ **Logs & Temporary Files**
- `*.log`, `*.tmp`, `.cache/`, `temp/`
- **Why**: Runtime artifacts, no value in version control

**Regenerating After Clone:**

When you clone this repo fresh, or after pulling schema changes, regenerate generated files:

```bash
# Install dependencies
npm install --legacy-peer-deps

# Generate Sanity types
cd studio && npm run extract-schema
cd ../frontend && npm run typegen
```

**Security Checklist:**

Before every commit, verify:
- ✅ Check what you're committing: `git status`, `git diff`
- ✅ `.env` and `.env.local` are NOT in the list
- ✅ No API keys, tokens, or passwords in code
- ✅ Secrets use environment variables
- ❌ Never use `git add .` blindly - review what you're adding
- ❌ Never use `git add -A` without checking first

**Why This Matters:**

🔒 **Security**: Prevents accidental secret commits (leading cause of security breaches)
🚀 **Performance**: Smaller repo = faster clones, pushes, pulls
🤝 **Collaboration**: No merge conflicts on generated files
🧹 **Cleanliness**: Professional repositories only track what matters

---

## 6. AI Assistant Guidelines

### Post-Context Compression Checklist

**IMPORTANT: After any context compression, automatically review this checklist before continuing work:**

✅ **Project Philosophy**: This is a simple festival website - avoid over-engineering
✅ **File Editing**: Always read files before editing them (never work from memory)
✅ **Documentation**: NEVER create .md or README files unless explicitly requested
✅ **Git Workflow**: Proactively suggest pushing after major changes/milestones
✅ **Agent Usage**: Use specialized agents when appropriate, follow tool usage patterns
✅ **Agent Verification**: ALWAYS check `.claude/agents/` directory for actual agent names before invoking (ignore system prompt agent names)
✅ **Agent Rules**: Read relevant files in `.claude/agents/` for specific agent guidance
✅ **MCP Usage**: Use MCP servers when they provide value over CLI
✅ **Dependencies**: Keep stable, use Node.js 22.x LTS, npm --legacy-peer-deps
✅ **Simplicity First**: Working code > "better" code, simple > complex
✅ **Visual Editing**: Maintain compatibility, test after changes
✅ **Bilingual Support**: Norwegian default, English optional
✅ **No Emojis**: Never use emojis unless explicitly requested by user

**Context Compression Risk**: Technical details survive compression better than behavioral rules.
**Solution**: Always re-read this section after compression to restore proper working patterns.

### When to Use Each Agent

**mdn-web-standards-expert** (`.claude/agents/mdn-web-standards-expert.md`) → HTML semantics, JavaScript patterns, Web APIs, web standards
- Use when: Validating HTML structure, implementing Web APIs, ensuring JavaScript best practices
- Perfect for: Semantic markup, progressive enhancement, browser API usage, UX/DX optimization
- Primary source: MDN (developer.mozilla.org)
- Remember: Web standards and simplicity over framework complexity

**css-specialist** (`.claude/agents/css-specialist.md`) → CSS layouts, typography, color systems, and DX-friendly patterns
- Use when: Creating layouts, typography systems, color/contrast, styling Astro components
- Perfect for: Intrinsic design, fluid typography, accessible color systems, CSS architecture
- Remember: Prioritize simple, working CSS over cutting-edge features

**astro-framework-expert** (`.claude/agents/astro-framework-expert.md`) → Astro-specific features, routing, components, SSG/SSR
- Use when: Astro build issues, component problems, routing questions
- Remember: Prefer stable Astro features over experimental ones

**htmx-astro-expert** (`.claude/agents/htmx-astro-expert.md`) → Dynamic interactions, form submissions, event filtering
- Use when: Adding interactivity without complex JavaScript
- Perfect for: Event filtering, form enhancements, partial page updates

**sanity-studio-expert** (`.claude/agents/sanity-studio-expert.md`) → Sanity schemas, GROQ queries, Studio configuration
- Use when: Content modeling, query optimization, Studio customization
- Remember: Keep schemas simple unless complexity is genuinely needed

**sanity-astro-integration** (`.claude/agents/sanity-astro-integration.md`) → Data flow between Sanity and Astro, Visual Editing
- Use when: Connecting Sanity content to Astro pages, preview functionality
- Focus: Maintaining Visual Editing compatibility

**typescript-elegance-expert** (`.claude/agents/typescript-elegance-expert.md`) → TypeScript improvements, code refactoring
- Use when: Code needs to be more readable or maintainable
- Remember: Working code > elegant code - only refactor if there's a real problem

### Agent Selection Priority
1. **Is the current solution working?** → If yes, probably don't change it
2. **Is this solving a user problem?** → If no, reconsider the change
3. **Will this add complexity?** → If yes, find a simpler solution
4. **Which agent aligns with keeping things simple?** → Choose that one

### GitHub CLI Integration

**Capabilities via `gh` CLI:**
- Create PRs with title, description, and labels
- Merge PRs (squash/merge/rebase)
- Check PR status, reviews, and CI results
- List and manage issues
- View diffs and comments

**Workflow with Claude:**

*Feature → Staging (standard workflow):*
1. Claude implements changes on feature branch
2. Claude commits and pushes
3. Claude creates PR via `gh pr create --base staging`
4. User reviews in Cursor IDE or terminal (`gh pr diff`)
5. User says "merge" → Claude merges via `gh pr merge`

*Staging → Main (production release):*
1. Claude creates PR via `gh pr create --base main --head staging`
2. **User reviews and merges directly in GitHub** (not via CLI)
3. Production deployment requires explicit human approval in GitHub UI

**Why the difference?**
- Staging merges are iterative development - quick feedback loop
- Production merges deploy to live users - require careful GitHub review

**Review Options (for staging merges):**
- **Cursor IDE**: GitHub Pull Requests extension shows PRs in sidebar with inline diff
- **Terminal**: `gh pr diff` shows full diff
- **Claude summary**: Claude can summarize changes on request

### MCP Server Usage

**Tool Hierarchy (Important):**
1. **MCP servers FIRST** - Always use available MCP servers as primary source
2. **WebFetch/WebSearch as fallback** - Only when MCP not available or doesn't cover the need
3. **CLI commands last** - Only when neither MCP nor WebFetch solve the problem

**Available MCP Servers:**
- **Sanity MCP** - Direct CMS operations (verified working):
  - Query documents with GROQ (`query_documents`)
  - Create, patch, publish, unpublish, delete documents
  - Get schema information (`get_schema`, `get_context`)
  - Schedule and manage content releases
  - Semantic search via embeddings indices
  - Best practices via `list_sanity_rules` and `get_sanity_rules`
  - Authentication: Uses OAuth (`npx sanity login` credentials)
- **Vercel MCP** - Deployment and hosting operations:
  - Deploy projects (`deploy_to_vercel`)
  - List and inspect deployments, projects, teams
  - Get build logs for debugging failed deployments
  - Fetch protected Vercel URLs
  - Check domain availability
- **Astro Docs MCP** - Search Astro documentation (`search_astro_docs`)
- **GitHub MCP** - Repository operations, issues, PRs, code search
- **IDE MCP** - VS Code language diagnostics (`getDiagnostics`)

**Principle**: Use MCP when it provides actual value - not "because we can"

---

## 7. Quick Reference

**Project Settings:**
- Project ID: `dnk98dp0`
- Dataset: `production`
- Node.js: `v22.x LTS` (or minimum v20.19.0)

**Server Ports:**
- Studio: `http://localhost:3333`
- Frontend: `http://localhost:4321`

**Key Commands:**
```bash
# Start servers (must run in separate terminals)
npm run dev:studio     # Terminal 1 - Studio on :3333
npm run dev:frontend   # Terminal 2 - Frontend on :4321

# Deployment
cd studio && npm run deploy  # Deploy studio to https://rkmf-cms.sanity.studio/
# Frontend deploys automatically via Vercel when pushing to GitHub

# Sanity TypeGen operations (run from studio folder)
npm run extract-schema  # Extract schema to frontend
cd ../frontend && npm run typegen  # Generate types from schema

# GitHub CLI (requires: brew install gh && gh auth login)
gh pr create --base staging --title "Title"  # Create PR
gh pr merge --squash --delete-branch         # Merge and cleanup
gh pr list                                   # List open PRs
gh pr diff                                   # View PR diff
gh issue list                                # List open issues
gh issue create --title "Title"              # Create issue
```

**Documentation:**
- Claude MCP: https://docs.claude.com/en/docs/claude-code/mcp
- Astro Docs: https://docs.astro.build
- Sanity Docs: https://www.sanity.io/docs
- HTMX Docs: https://htmx.org

---

*This guide exists because we learned the hard way that over-engineering breaks working systems.*
