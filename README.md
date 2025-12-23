# Risør Kammermusikkfest Website

Bilingual (Norwegian/English) festival website built with Astro and Sanity CMS.

## Quick Start

**Prerequisites:** Node.js v22.x LTS (or v20.19.0+)

```bash
# Install dependencies
npm install

# Generate Sanity types (required after clone)
cd studio && npm run extract-schema
cd ../frontend && npm run typegen

# Start development servers (in separate terminals)
npm run dev:studio    # http://localhost:3333
npm run dev:frontend  # http://localhost:4321
```

## Project Structure

```
├── frontend/          # Astro 5 application
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── scripts/   # Client-side JavaScript
│   │   └── styles/    # CSS (self-documenting tokens)
│   └── sanity/        # Generated types
├── studio/            # Sanity Studio v3
│   └── schemaTypes/
└── docs/              # Documentation
```

## Tech Stack

- **Astro 5** - SSG/SSR with HTMX for interactivity
- **Sanity Studio v3** - CMS with Visual Editing
- **TypeScript** - Type-safe development

## Configuration

Project ID: `dnk98dp0` | Dataset: `production`

Create `frontend/.env.local` from `.env.example` with your Sanity API token.

## Documentation

| File | Purpose |
|------|---------|
| [PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) | Comprehensive development guide |
| [DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Layout decision trees |
| [MEDIA.md](docs/MEDIA.md) | Image/video handling |
| [SECURITY.md](docs/SECURITY.md) | Pre-commit hooks |

## Building

```bash
npm run build              # Build all
npm run build --workspace=frontend
npm run build --workspace=studio
```

---

For detailed workflows, git strategy, and AI guidelines, see **[PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md)**.
