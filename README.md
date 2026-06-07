# Risør kammermusikkfest Website

This repository contains the bilingual website for Risør kammermusikkfest, a major chamber music festival in Norway, with public festival content served from Astro and editorial content managed in Sanity.

## Ownership

The project is owned and maintained by Risør kammermusikkfest. 
It was built and developed by Magefølelsen communications & design (https://github.com/AMarlonG) 

## How It Is Built

- `frontend/`: Astro frontend with HTMX-enhanced interactions
- `studio/`: Sanity Studio and schema definitions
- Stack: Astro, HTMX, Sanity, TypeScript, and shared monorepo build tooling
- `frontend` and `studio` share generated Sanity types from the monorepo root
- Production releases move from `staging` to `main`

## Repository Scope

This is the working repository for the live site and CMS.

## Further Documentation

- [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) for the full project guide
