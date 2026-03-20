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
- Add or update tests when changing critical functionality, especially security boundaries and validation
- Follow TypeScript best practices and maintain type safety
- Review dependencies regularly for security issues and upstream changes
- Use proper error handling and logging
- Validate and sanitize all user input
- Follow WCAG accessibility standards
- Document complex logic and architectural decisions
- Use environment variables for secrets (never commit tokens/keys)
- Implement proper CORS and CSP headers

#### ❌ NEVER DO
- Skip security measures to "keep it simple"
- Skip tests for critical changes when test coverage already exists or can be added safely
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
2. **Skipping tests for "speed"** → Add or update tests for critical paths where the repo has coverage, and avoid shipping unverified security changes
3. **Ignoring security updates** → Review `npm audit` output and update intentionally
4. **Breaking Visual Editing** → Test preview after any Sanity config changes
5. **Removing bilingual support** → Keep `nbNOLocale()` and proper i18n structure
6. **Over-engineering** → Don't add enterprise patterns not needed at this scale

**Current test footprint:** The repo currently has focused Vitest coverage for frontend security utilities and Studio URL validation. Treat that as a baseline, not as proof that all critical user flows are covered.

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

Run typegen after schema changes. The release workflow handles this automatically; the manual command is `npm run typegen` from the monorepo root.

#### Visual Editing

**Requirements:**
- Both servers running (see Section 3 Server Management)
- Preview mode cookie: `sanity-preview-mode=true`
- Environment variables configured (see Section 3 Environment Variables)

**API Configuration:**
- Use `apiVersion: "2025-01-01"` in Sanity configuration for latest features
- The integration config uses `useCdn: false`, while the runtime data service enables CDN reads for published content and disables CDN for draft preview.

**Content Structure:**
- Bilingual content handling (see Section 4 Development Workflow)
- Keep content schemas simple - avoid complex relationships unless needed

### 2.2 Astro Framework

**Rendering Mode: Server-Side Rendering (SSR)**

The site uses `output: 'server'` for instant content updates - content changes in Sanity appear immediately on refresh (no rebuild needed). This provides a WordPress-like editing experience.

- Save in Sanity → Refresh browser → See changes instantly
- Sanity's CDN handles published-content reads at runtime, while draft preview bypasses the CDN
- Trade-off: Slightly higher latency vs static pages, runtime Sanity dependency

To switch to Static Site Generation (SSG) for maximum performance:
```js
// frontend/astro.config.mjs
output: 'static',  // Requires webhook-triggered rebuilds for content updates
```

**Other Configuration:**
- Astro components for static content, **HTMX over React** for interactivity
- Bilingual routes: `/path` (NO), `/en/path` (EN) with `trailingSlash: 'never'`
- Sanity content via `createDataService()`, HTMX via `astro-htmx`

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

- Store in `/src/scripts/`, use ES6 modules with JSDoc comments
- NOT type-checked (`checkJs: false`) - keep logic simple
- Use event delegation for HTMX dynamic content

### 2.5 TypeScript

- Strict mode enabled, Sanity types auto-generated via TypeGen
- **Fix type errors, don't ignore** - they usually indicate real problems
- **Pragmatic, not dogmatic** - `any` sparingly for CMS content, but document why

---

## 3. Environment & Setup

### Node.js Version Management
- **Use Node.js v22.x LTS** (or minimum v20.19.0) - These are the proven compatible versions
- **Never upgrade Node.js** without testing both studio and frontend first
- Prefer even-numbered LTS versions (20, 22, 24) over odd versions (21, 23)

### Version Compatibility (Current Baseline)

The supported baseline is the versions currently pinned in the repo and verified in this project, not the latest available upstream versions.

**Current Baseline:**
| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | 22.x LTS | Project standard for local dev and CI |
| Astro | 5.16.6 | Current frontend baseline |
| Sanity Studio | 4.22.0 | Current supported Studio baseline |
| @sanity/astro | 3.2.10 | Visual Editing integration |
| @sanity/client | 7.6.x | Runtime content API client |

**Baseline Principles:**
- The pinned versions in `package.json` are the source of truth.
- New features available in newer upstream majors are not considered supported until this repo is upgraded and verified.
- Content Agent and other Sanity v5+ features are roadmap capabilities, not current baseline behavior.

### Update Policy

Use a balanced update strategy:

- **Patch and minor updates**: review regularly and adopt when verification passes
- **Major updates**: treat as dedicated migration work, not routine dependency maintenance
- **Node.js updates**: stay on even LTS versions and verify both Studio and frontend before changing
- **Security advisories**: prioritize them, but do not apply fixes blindly

### Future Upgrade Path

Sanity v5+ is a future migration path for capabilities such as Content Agent.

Rules:

- Do not describe Sanity v5+ features as available in the current baseline
- Do not roll a Sanity major upgrade into routine quarterly maintenance
- Upgrade only in a dedicated branch/PR with compatibility verification
- Verify custom document actions, Presentation/Visual Editing, schema extraction, and editorial workflows before adoption

### Dependency Management
- Use `npm install` as the default install path
- Use `--legacy-peer-deps` only as a temporary troubleshooting workaround, not standard practice
- Update for security and stability, but prefer intentional upgrades over broad `npm update` churn
- Keep Sanity reasonably current within the supported major
- Treat major version changes as migrations with explicit verification
- Test after any dependency changes: both Studio and frontend must work

### Security Checks

**Automated Protection:**
- Vercel runs builds on every push - if build fails, deployment is blocked
- New code with serious vulnerabilities won't deploy (your live site keeps running the previous safe version)

**Dependency Review Cadence:**
Every 3 months (January, April, July, October), review dependency updates manually:
```bash
# 1. Inspect candidate updates
npm outdated
npm run --workspaces=false check-deps:root

# 2. Apply only the updates you intend to take
# 3. Verify the project after every dependency change
npm run build --workspace=frontend
npm run test --workspace=studio -- --run
```

**Manual Checks:**
Before major releases or dependency updates, review:
```bash
cd frontend && npm audit
cd studio && npm audit
```

Additional verification after dependency changes:

- run the frontend locally
- run the Studio locally
- verify Visual Editing / Presentation
- verify event publishing and custom document actions
- verify Sanity type generation if schemas or Sanity packages changed
- treat frontend tests as a useful signal, but not the sole dependency gate until the current baseline failures are fixed

**Handling Issues:**
- Serious issues must be fixed before merging
- Minor issues should be evaluated for actual risk in our context
- Some upstream dependencies may have unfixed issues - track and update when fixes are available
- Do not rely on `npm audit fix` as an automatic maintenance strategy

### Server Management
- **Use `/preparation`** to kill existing servers and start fresh (Studio on 3333, Frontend on 4321)

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

Vercel Web Analytics and Speed Insights enabled for production. View at Vercel Dashboard > Analytics tab.

**Exclude yourself:** Run `localStorage.setItem('va-disable', 'true')` in browser console on live site.

---

## 4. Development Workflow

### File Editing Workflow
- **Always read a file before editing it** to understand the current code and how changes will alter it
- **Never attempt to edit based on assumptions** about file content from memory or previous sessions
- **Understand the context** before making changes to ensure proper integration

### Web Research Methodology
- **Always search chronologically starting with the current year first, then work backwards** through previous years (last year, the year before, etc.)
- **Rationale**: Technology evolves rapidly - recent solutions often supersede older approaches with better performance, support, or maintainability
- **Note**: This same methodology is defined in all specialist files (`.ai/specialists/`)

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

3. **Release direction is staging → main, then sync main back to staging**
   - Release always starts from staging
   - After squash-merging staging → main, sync main → staging to keep histories aligned

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

**Use repo workflow files:** `.ai/workflows/preparation.md`, `.ai/workflows/dev-release.md`, `.ai/workflows/live-release.md`

These workflow files handle the full release process including typegen, PR creation, sync, and studio deployment checks.

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

**Two Separate Systems:**

| System | Trigger | Target |
|--------|---------|--------|
| **Frontend** (Vercel) | Push to any branch | `staging` → testing.kammermusikkfest.no, `main` → kammermusikkfest.no |
| **Studio** (Sanity) | Merge to main (auto) | rkmf-cms.sanity.studio |

- Frontend: Automatic preview URLs for all branches
- Studio: No preview - test locally, auto-deploys when `studio/` files change on main
- Manual studio deploy (emergency): `cd studio && npm run deploy`

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
- `README.md` (at root), `docs/` folder (PROJECT_GUIDE, DESIGN-SYSTEM, MEDIA, SECURITY, CANVAS_CONTENT_AGENT_PLAN)
- **Why**: Project knowledge, onboarding, and history

**What We DON'T Track (and Why):**

❌ **Generated Files**
- `frontend/sanity/extract.json` (schema extract)
- `*.tsbuildinfo` (TypeScript incremental build cache)
- **Why**: Generated artifacts that can be recreated locally
- **How to regenerate**: Run `npm run typegen` (see Sanity TypeGen Workflow in Section 2.1)

✅ **Tracked Generated Contract**
- `frontend/sanity/sanity.types.ts`
- **Why**: The frontend imports it directly, and keeping it tracked ensures builds and type checks have a stable schema contract
- **How to update**: Run `npm run typegen` after schema changes and commit the updated file

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
npm install

# Generate Sanity types
npm run typegen
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
✅ **Specialist Usage**: Use specialists when appropriate, follow tool usage patterns
✅ **Specialist Verification**: ALWAYS check `.ai/specialists/` for actual specialist names before invoking
✅ **Specialist Rules**: Read relevant files in `.ai/specialists/` for specific guidance
✅ **MCP Usage**: Use MCP servers when they provide value over CLI
✅ **Dependencies**: Keep stable, use Node.js 22.x LTS, upgrade intentionally
✅ **Simplicity First**: Working code > "better" code, simple > complex
✅ **Visual Editing**: Maintain compatibility, test after changes
✅ **Bilingual Support**: Norwegian default, English optional
✅ **No Emojis**: Never use emojis unless explicitly requested by user

**Context Compression Risk**: Technical details survive compression better than behavioral rules.
**Solution**: Always re-read this section after compression to restore proper working patterns.

### Token Efficiency

**In plan mode especially:**
- Concise by default, verbose only when clarity demands it
- Never compromise quality for brevity - explain when uncertain
- Avoid redundant phrasing, filler words, unnecessary summaries
- Launch minimum agents needed (1 unless scope requires more)

### When to Use Each Specialist

**mdn-web-standards-expert** (`.ai/specialists/mdn-web-standards-expert.md`) → HTML semantics, JavaScript patterns, Web APIs, web standards
- Use when: Validating HTML structure, implementing Web APIs, ensuring JavaScript best practices
- Perfect for: Semantic markup, progressive enhancement, browser API usage, UX/DX optimization
- Primary source: MDN (developer.mozilla.org)
- Remember: Web standards and simplicity over framework complexity

**css-specialist** (`.ai/specialists/css-specialist.md`) → CSS layouts, typography, color systems, and DX-friendly patterns
- Use when: Creating layouts, typography systems, color/contrast, styling Astro components
- Perfect for: Intrinsic design, fluid typography, accessible color systems, CSS architecture
- Remember: Prioritize simple, working CSS over cutting-edge features

**astro-framework-expert** (`.ai/specialists/astro-framework-expert.md`) → Astro-specific features, routing, components, SSG/SSR
- Use when: Astro build issues, component problems, routing questions
- Remember: Prefer stable Astro features over experimental ones

**htmx-astro-expert** (`.ai/specialists/htmx-astro-expert.md`) → Dynamic interactions, form submissions, event filtering
- Use when: Adding interactivity without complex JavaScript
- Perfect for: Event filtering, form enhancements, partial page updates

**sanity-studio-expert** (`.ai/specialists/sanity-studio-expert.md`) → Sanity schemas, GROQ queries, Studio configuration
- Use when: Content modeling, query optimization, Studio customization
- Remember: Keep schemas simple unless complexity is genuinely needed

**sanity-astro-integration** (`.ai/specialists/sanity-astro-integration.md`) → Data flow between Sanity and Astro, Visual Editing
- Use when: Connecting Sanity content to Astro pages, preview functionality
- Focus: Maintaining Visual Editing compatibility

**typescript-elegance-expert** (`.ai/specialists/typescript-elegance-expert.md`) → TypeScript improvements, code refactoring
- Use when: Code needs to be more readable or maintainable
- Remember: Working code > elegant code - only refactor if there's a real problem

### Specialist Selection Priority
1. **Is the current solution working?** → If yes, probably don't change it
2. **Is this solving a user problem?** → If no, reconsider the change
3. **Will this add complexity?** → If yes, find a simpler solution
4. **Which specialist aligns with keeping things simple?** → Choose that one

### GitHub CLI Integration

**Capabilities via `gh` CLI:**
- Create PRs with title, description, and labels
- Merge PRs (squash/merge/rebase)
- Check PR status, reviews, and CI results
- List and manage issues
- View diffs and comments

**Workflow with an AI assistant:**

*Feature → Staging (standard workflow):*
1. The assistant implements changes on a feature branch
2. The assistant commits and pushes
3. The assistant creates a PR via `gh pr create --base staging`
4. User reviews in Cursor IDE or terminal (`gh pr diff`)
5. User says "merge" → the assistant merges via `gh pr merge`

*Staging → Main (production release):*
1. The assistant creates a PR via `gh pr create --base main --head staging`
2. **User reviews and merges directly in GitHub** (not via CLI)
3. Production deployment requires explicit human approval in GitHub UI

**Why the difference?**
- Staging merges are iterative development - quick feedback loop
- Production merges deploy to live users - require careful GitHub review

**Review Options (for staging merges):**
- **Cursor IDE**: GitHub Pull Requests extension shows PRs in sidebar with inline diff
- **Terminal**: `gh pr diff` shows full diff
- **Assistant summary**: the assistant can summarize changes on request

### MCP Server Usage

**Tool Hierarchy (Important):**
1. **MCP servers FIRST** - Always use available MCP servers as primary source
2. **WebFetch/WebSearch as fallback** - Only when MCP not available or doesn't cover the need
3. **CLI commands last** - Only when neither MCP nor WebFetch solve the problem

**Repo MCP Targets:**
- **Sanity MCP**
  - Project: `dnk98dp0`
  - Dataset: `production`
- **Vercel MCP**
  - Team slug: `risor-kammermusikkfests-projects`
  - Project slug: `risor-kammermusikkfest-frontend`
  - Preferred scoped endpoint: `https://mcp.vercel.com/risor-kammermusikkfests-projects/risor-kammermusikkfest-frontend`
- **GitHub MCP**
  - Owner: `RKMF`
  - Repository: `risor-kammermusikkfest`

**Scoping Rule:**
- Configure MCP servers at the workspace or project level when the client supports it.
- Prefer project-scoped or repo-scoped MCP connections over account-wide connections.
- Do not assume opening this folder automatically scopes MCP access. The client configuration must enforce the scope.
- This repo uses repo-local Cursor config in `.cursor/mcp.json` plus repo instructions in `.cursorrules`.

**Available MCP Servers:**
- **Sanity MCP** - Direct CMS operations (verified working):
  - Query documents with GROQ (`query_documents`)
  - Create, patch, publish, unpublish, delete documents
  - Get schema information (`get_schema`, `get_context`)
  - Schedule and manage content releases
  - Semantic search via embeddings indices
  - Best practices via `list_sanity_rules` and `get_sanity_rules`
  - Authentication: Uses OAuth (`npx sanity login` credentials)
  - Project targeting for this repo: use project `dnk98dp0`, dataset `production`
- **Vercel MCP** - Deployment and hosting operations:
  - Deploy projects (`deploy_to_vercel`)
  - List and inspect deployments, projects, teams
  - Get build logs for debugging failed deployments
  - Fetch protected Vercel URLs
  - Check domain availability
  - Authentication: Uses OAuth in browser during setup or login
  - Project targeting for this repo: use team `risor-kammermusikkfests-projects`, project `risor-kammermusikkfest-frontend`
  - Preferred endpoint for this repo: `https://mcp.vercel.com/risor-kammermusikkfests-projects/risor-kammermusikkfest-frontend`
  - Avoid the general account-wide endpoint `https://mcp.vercel.com` for this repo when a scoped connection is available
  - Security: Prefer OAuth over manual tokens and never commit local Vercel credentials or `.vercel/`
- **Astro Docs MCP** - Search Astro documentation (`search_astro_docs`)
- **GitHub MCP** - Repository operations, issues, PRs, code search
  - Repository targeting for this repo: use `RKMF/risor-kammermusikkfest`
- **IDE MCP** - VS Code language diagnostics (`getDiagnostics`)

**Repo-Local Cursor Setup:**
- File: `.cursor/mcp.json`
- Servers configured for this repo:
  - `sanity` → `https://mcp.sanity.io`
  - `github` → `https://api.githubcopilot.com/mcp/`
  - `vercel` → `https://mcp.vercel.com/risor-kammermusikkfests-projects/risor-kammermusikkfest-frontend`
- File: `.cursorrules`
  - Reinforces the default Sanity, GitHub, and Vercel targets so new sessions in this repo use the correct project context
- After adding or changing MCP config, restart the Cursor chat/session and complete any OAuth login prompts shown by the client

**Principle**: Use MCP when it provides actual value - not "because we can"

### Sanity Content Agent

Content Agent is an AI assistant in Sanity Studio (requires v5+) that understands your schema and can perform bulk operations, content audits, web research, and content generation.

**Current Status in This Repo:** Not part of the current supported baseline. This repo is pinned to Sanity Studio `4.22.0`.

**Access:** Available only after a future Studio v5+ migration is completed and verified in this project.

**Pricing:** Consumption-based AI Credits (included with Growth/Enterprise plans, overages billed).

**When to use Content Agent vs MCP:**

| Task | Content Agent | MCP |
|------|---------------|--------------|
| Natural language queries | Yes | No (requires GROQ) |
| Web research + content creation | Yes | No |
| Non-technical user access | Yes (in Studio UI) | No (requires an MCP-capable client) |
| Bulk document edits | Yes | Yes |
| Content audits | Yes | Yes (via GROQ) |
| Programmatic operations | No | Yes |

**Example audit queries:**
- "Find all artists missing English biography"
- "List events without alt text on images"
- "Show articles with empty meta descriptions"

**Note:** All Content Agent changes are staged for human review before publishing.

---

## 7. Quick Reference

**Project Settings:**
- Project ID: `dnk98dp0`
- Dataset: `production`
- Node.js: `v22.x LTS` (or minimum v20.19.0)

**Server Ports:**
- Studio: `http://localhost:3333`
- Frontend: `http://localhost:4321`

**Workflow Files:**
- `.ai/workflows/preparation.md` - Start session: kill servers, start fresh, create branch
- `.ai/workflows/dev-release.md` - Feature → staging (includes typegen if schema changed)
- `.ai/workflows/live-release.md` - Staging → main → sync → deploy studio
- `.ai/workflows/content.md` - Research, write NO content, translate to EN
- `.ai/workflows/translate.md` - Translate/sync NO → EN content
- `.ai/workflows/refresh.md` - Clear conversation and restore context

**Content Style Guides:**
- `.ai/instructions/writing-style.md` - Norwegian writing style
- `.ai/instructions/translation-rules.md` - NO↔EN translation rules

**Manual Commands:**
```bash
cd studio && npm run deploy  # Manual studio deploy (emergency only)
gh pr list                   # List open PRs
gh pr diff                   # View PR diff
```

**Documentation:**
- Model Context Protocol: https://modelcontextprotocol.io
- Astro Docs: https://docs.astro.build
- Sanity Docs: https://www.sanity.io/docs
- HTMX Docs: https://htmx.org

---

*This guide exists because we learned the hard way that over-engineering breaks working systems.*
