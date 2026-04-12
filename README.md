# Risør Kammermusikkfest Website

Bilingual (Norwegian/English) festival website built with Astro and Sanity CMS.

## Quick Start

**Prerequisites:** Node.js v22.x LTS (or v20.19.0+)

```bash
# Install dependencies
npm install

# Generate Sanity types (required after clone)
npm run typegen

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
├── studio/            # Sanity Studio (current baseline pinned in package.json)
│   └── schemaTypes/
└── docs/              # Documentation
```

## Tech Stack

- **Astro 5** - SSG/SSR with HTMX for interactivity
- **Sanity Studio** - CMS for editorial workflows
- **TypeScript** - Type-safe development

Current supported baseline:

- `frontend`: Astro `5.16.6`
- `studio`: Sanity `4.22.0`
- Node.js: `22.x` LTS

New Sanity major features are evaluated separately and adopted only after compatibility verification in this project.

## Configuration

Project ID: `dnk98dp0` | Dataset: `production`

Create `frontend/.env.local` from `frontend/.env.example` and fill in the required values.

## Documentation

| File | Purpose |
|------|---------|
| [PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) | Comprehensive development guide |
| [DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Layout decision trees |
| [MEDIA.md](docs/MEDIA.md) | Image/video handling |
| [SECURITY.md](docs/SECURITY.md) | Pre-commit hooks |

MCP targets and usage rules for this repo are documented in `docs/PROJECT_GUIDE.md` under `MCP Server Usage`. Repo-local Cursor/Codex MCP setup lives in `.cursor/mcp.json`, with repo scoping instructions in `.cursorrules`.

## Building

```bash
npm run build              # Build all
npm run build --workspace=frontend
npm run build --workspace=studio
```

---

For detailed workflows, git strategy, and AI guidelines, see **[PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md)**.
