# Sanity + Astro Festival Website

A simple, bilingual (Norwegian/English) festival website built with Astro and Sanity CMS. Features event listings, artist profiles, venue information, and Visual Editing support.

## Quick Start

### Prerequisites
- Node.js v20.19.0 (recommended)
- npm 10+

### Installation

```bash
# Install dependencies (use legacy-peer-deps for compatibility)
npm install --legacy-peer-deps
```

### First-Time Setup

After cloning, generate Sanity types:

```bash
# Extract schema from Studio
cd studio && npm run extract-schema

# Generate TypeScript types for frontend
cd ../frontend && npm run typegen
```

**Note**: Generated files (`extract.json`, `sanity.types.ts`) are not tracked in git. Regenerate after pulling schema changes.

### Development

**Start servers in separate terminals:**

```bash
# Terminal 1 - Studio
npm run dev:studio    # http://localhost:3333

# Terminal 2 - Frontend
npm run dev:frontend  # http://localhost:4321
```

**Note:** Due to Vite process management issues, servers must be started separately.

### Building

```bash
# Build all packages
npm run build

# Or build individually:
npm run build --workspace=frontend
npm run build --workspace=studio
```

### Sanity TypeGen Workflow

After modifying Sanity schemas, regenerate TypeScript types:

```bash
# Extract schema from Studio
cd studio && npm run extract-schema

# Generate TypeScript types for frontend
cd ../frontend && npm run typegen
```

This ensures type safety across the entire stack when working with Sanity content.

## Project Structure

```
├── frontend/          # Astro 5 application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── layouts/      # Page layouts
│   │   ├── pages/        # Routes and pages
│   │   ├── scripts/      # Client-side JavaScript
│   │   └── styles/       # CSS files
│   ├── sanity/         # Generated Sanity types
│   │   ├── extract.json    # Extracted schema
│   │   └── sanity.types.ts # Generated TypeScript types
│   └── package.json
├── studio/            # Sanity Studio v3
│   ├── schemaTypes/
│   │   ├── documents/    # Document schemas (artist, article, event, etc.)
│   │   ├── components/   # Component schemas (page builder blocks)
│   │   ├── objects/      # Object schemas (SEO fields, etc.)
│   │   └── shared/       # Shared utilities (validation, fields, helpers)
│   ├── lib/            # Utility functions
│   ├── actions/        # Custom Studio actions
│   ├── components/     # Custom UI components
│   └── package.json
└── PROJECT_GUIDE.md   # Comprehensive documentation
```

## Tech Stack

### Frontend (Astro)
- **Astro 5** - Static site generation with SSR support
- **HTMX** - Dynamic interactions without heavy JavaScript
- **TypeScript** - Type-safe component development
- **React** - Available for complex interactive components (use sparingly)

### CMS (Sanity)
- **Sanity Studio v3** - Content management
- **GROQ** - Powerful query language
- **Visual Editing** - Real-time preview while editing
- **Norwegian localization** - NBLocale support

### Features
- Bilingual support (Norwegian default, English optional)
- Event filtering with HTMX
- Responsive design
- Visual Editing workflow
- Workspace-based monorepo structure

## Configuration

### Environment Variables

Create `frontend/.env.local`:

```env
PUBLIC_SANITY_PROJECT_ID=dnk98dp0
PUBLIC_SANITY_DATASET=production
PUBLIC_SANITY_VISUAL_EDITING_ENABLED=true
SANITY_API_READ_TOKEN=your-token-here
SITE_URL=http://localhost:4321
```

See `frontend/.env.example` for all available options.

### Sanity Project Settings
- Project ID: `dnk98dp0`
- Dataset: `production`
- Studio URL: `http://localhost:3333`
- Frontend URL: `http://localhost:4321`

## Testing

```bash
# Run tests in all packages
npm run test

# Watch mode
npm run test:watch
```

Currently 8 test files covering:
- Sanity schemas and configuration
- Frontend components and utilities
- Security helpers and image utilities

## Documentation

- **PROJECT_GUIDE.md** - Comprehensive project documentation covering:
  - Philosophy and architecture
  - Core technologies (Sanity, Astro, HTMX, TypeScript)
  - Development workflow
  - Git workflow (two-branch model)
  - AI assistant guidelines
  - Best practices and conventions

- **DESIGN-SYSTEM.md** - Spacing and layout system documentation:
  - Utopia-inspired fluid spacing tokens
  - Intrinsic layout patterns (Grid, TwoColumn, ThreeColumn)
  - Container queries for responsive components
  - Layout primitives (Center, Stack, Cluster)
  - Component width system
  - Migration guides and decision trees

- **MEDIA.md** - Media handling reference guide (images and videos):
  - Architecture and core utilities
  - Fetching images and videos from Sanity (GROQ patterns)
  - Rendering with Image and Video components
  - Optimization features (performance, privacy, security)
  - Quality presets and aspect ratio handling
  - Video support in all layout components (Grid, TwoColumn, ThreeColumn, etc.)
  - Common patterns for artists, events, heroes, promotional videos
  - Troubleshooting guide

## Git Workflow

This project uses a two-branch model:

- `main` - Production branch (deploys to live URL)
- `staging` - Testing/preview branch (deploys to test URL)

**Always work in feature branches:**
1. Create from `staging`: `git checkout -b feature/your-feature`
2. Develop and commit
3. Push and open PR to `staging`
4. Test on staging URL
5. When ready, merge `staging` to `main` for production

See PROJECT_GUIDE.md section 5 for detailed workflow.

## Deployment

GitHub Actions workflows handle CI/CD:
- **CI** (`.github/workflows/ci.yml`) - Build and test on push/PR
- **Deploy** (`.github/workflows/deploy.yml`) - Deploy after successful CI

Manual deployment:
```bash
# Frontend (example with Vercel)
cd frontend && vercel --prod

# Sanity Studio
cd studio && npx sanity deploy
```

## Philosophy

This is a **professional festival website** following production-ready standards:

- **Security & Quality First** - Never compromise on security, testing, or code quality
- **Then Simplicity** - Avoid over-engineering and unnecessary complexity
- **Focused Architecture** - Build what's needed for a festival website, nothing more
- **Professional Standards** - Follow web best practices, even in a simple project

Simple means **focused and maintainable**, not amateur or shortcuts.

See PROJECT_GUIDE.md section 1 for the complete philosophy and decision framework.

## License

MIT

---

For comprehensive documentation, troubleshooting, and best practices, see **PROJECT_GUIDE.md**.
