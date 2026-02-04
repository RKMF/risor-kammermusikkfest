# Sanity Agent Toolkit Rules

The Sanity MCP server provides 20+ best-practice rules that complement this project's custom agents. These rules contain specific, actionable patterns for writing Sanity code.

## When to Load Rules

**Always load relevant rules before:**
- Writing or modifying Sanity schemas
- Creating GROQ queries
- Configuring Visual Editing
- Setting up framework integrations

## How to Use

### 1. List Available Rules
```
mcp__Sanity__list_sanity_rules
```
Returns all 20 available rules with descriptions.

### 2. Load Rules for Your Task
```
mcp__Sanity__get_sanity_rules({ rules: ["rule1", "rule2"] })
```

## Common Rule Combinations

| Task | Rules to Load |
|------|---------------|
| Schema design | `["sanity-schema"]` |
| GROQ queries | `["sanity-groq"]` |
| Visual Editing | `["sanity-visual-editing"]` |
| Astro integration | `["sanity-astro", "sanity-visual-editing"]` |
| Full feature work | `["sanity-schema", "sanity-groq", "sanity-astro"]` |
| Image handling | `["sanity-image"]` |
| Localization | `["sanity-localization"]` |
| TypeScript types | `["sanity-typegen"]` |
| Portable Text | `["sanity-portable-text"]` |
| Page Builder | `["sanity-page-builder"]` |

## Available Rules

- **sanity-app-sdk**: Custom applications with Sanity App SDK
- **sanity-astro**: Astro integration, @sanity/astro, data fetching
- **sanity-get-started**: New project setup
- **sanity-groq**: GROQ queries, type safety, performance
- **sanity-hydrogen**: Shopify Hydrogen integration
- **sanity-image**: Image handling and optimization
- **sanity-localization**: Localization patterns
- **sanity-migration**: Content migration to Portable Text
- **sanity-nextjs**: Next.js App Router integration
- **sanity-nuxt**: Nuxt integration
- **sanity-page-builder**: Page Builder arrays and blocks
- **sanity-portable-text**: Rich text rendering
- **sanity-project-structure**: Project organization
- **sanity-remix**: React Router/Remix integration
- **sanity-schema**: Schema definitions and validation
- **sanity-seo**: SEO best practices
- **sanity-studio-structure**: Studio customization
- **sanity-svelte**: SvelteKit integration
- **sanity-typegen**: TypeScript type generation
- **sanity-visual-editing**: Visual Editing, Stega, overlays

## How Rules Complement Custom Agents

| Aspect | Custom Agents | Toolkit Rules |
|--------|---------------|---------------|
| **Project context** | Norwegian locale, bilingual workflows, project constraints | Generic patterns |
| **Technical depth** | Strategic guidance | Specific code patterns |
| **Examples** | Project-specific | Framework-agnostic |
| **Updates** | Manual maintenance | Fetched via MCP (always current) |

**Best practice**: Use toolkit rules for technical implementation details, custom agents for project-specific context and decisions.

## Key Patterns from Rules

### Schema (sanity-schema)
- Always use `defineType`, `defineField`, `defineArrayMember`
- Model what things ARE, not what they look like
- Use deprecation pattern for safe schema updates

### GROQ (sanity-groq)
- Wrap queries in `defineQuery` for TypeGen
- Order BEFORE slice: `| order()[0...10]`
- Use `_ref` not `->field` in filters for performance

### Visual Editing (sanity-visual-editing)
- Clean Stega strings with `stegaClean()` before logic comparisons
- NEVER clean when rendering to screen (kills overlays)
- Set `stega: false` in SEO/metadata contexts
