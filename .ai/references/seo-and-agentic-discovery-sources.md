# SEO and Agentic Discovery Sources

Maintained source register for search visibility, crawler behavior, structured data, and AI-assisted discovery.

## How to use this register

- Treat Google, Bing, OpenAI, and W3C documentation as authoritative for their own systems.
- Use this register to guide implementation and review, not as a substitute for testing the live site in Search Console and other webmaster tools.
- Review the core sources quarterly and after major changes to the frontend, publishing workflow, sitemap, robots policy, or structured data.
- Record meaningful changes in `.ai/memory/decisions.md` when they affect project behavior.

## Source hierarchy

### Authoritative: core SEO and crawling

| Source | Scope | Project use |
| --- | --- | --- |
| [Google Search Essentials](https://developers.google.com/search/docs/essentials) | Technical requirements, spam policies, and people-first content | Baseline for all indexable pages |
| [Google Search documentation](https://developers.google.com/search/docs) | Crawling, indexing, Search Console, appearance, and developer guidance | Main Google reference index |
| [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) | Crawling, rendering, and indexing JavaScript applications | Astro SSR and client-side behavior |
| [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) | Canonical URLs, absolute URLs, and sitemap limits | `frontend/src/pages/sitemap.xml.ts` |
| [Robots.txt specification](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec) | Crawler access rules and sitemap declaration | `frontend/src/pages/robots.txt.ts` |

### Authoritative: AI search and agent access

| Source | Scope | Project use |
| --- | --- | --- |
| [Google AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) | AI Overviews and AI Mode use the same core indexability and SEO foundations | Prevents inventing unsupported AI-specific markup or ranking tactics |
| [Google AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | Crawlable content, semantic HTML, rendering, page experience, and duplication | Agent-readable, accessible page structure |
| [Google guidance on generative AI content](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content) | Quality, accuracy, relevance, and scaled-content-abuse risks | Editorial rules for AI-assisted content |
| [OpenAI crawlers and agents](https://developers.openai.com/api/docs/bots) | `OAI-SearchBot`, `GPTBot`, and `ChatGPT-User` behavior | Separate ChatGPT Search visibility from training and user-triggered access |

### Authoritative: structured data for Risør

| Source | Scope | Project use |
| --- | --- | --- |
| [Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event) | Event dates, locations, performers, organizers, and ticket information | Concert and festival-event pages |
| [ProfilePage structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page) | Person and organization profile pages | Artist pages where the content genuinely represents a profile |
| [Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization) | Organization identity and profiles | Festival organization information |
| [Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) | Hierarchy and navigation context | Artist, event, and section hierarchy |
| [Structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) | Eligibility and quality requirements | Validation before adding or changing schema |

### Other search ecosystem

| Source | Scope | Project use |
| --- | --- | --- |
| [Bing IndexNow](https://www.bing.com/webmasters/help/URL-Submission-62f2860b) | Notification of added, updated, or removed URLs | Evaluate if faster Bing discovery is useful for releases |
| [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Accessibility and perceivable, operable, understandable content | Accessibility is part of durable user and agent discoverability |

### Experimental: monitor, do not depend on

| Source | Status | Project use |
| --- | --- | --- |
| [`llms.txt` proposal](https://llmstxt.org/) | Open proposal, not an established search-engine standard | Keep implementation lightweight and optional; never treat it as a ranking or indexing requirement |

## Project policy

1. Preserve ordinary SEO fundamentals before adding AI-specific files or metadata.
2. Keep published, canonical, indexable content useful to people first; agent visibility should follow from that quality.
3. Do not use `robots.txt` as a substitute for `noindex`, unpublished status, authentication, or content removal.
4. Treat crawler access policies independently: allowing ChatGPT Search is not the same decision as allowing model training crawlers.
5. Validate structured data against the relevant Google documentation and live rendered HTML.
6. Treat third-party GEO/AEO advice as advisory only unless it is supported by the relevant search provider’s documentation.

## Review record

| Date | Review | Result |
| --- | --- | --- |
| 2026-10-15 | Initial register | Added core Google, OpenAI, Bing, W3C, and experimental `llms.txt` sources |
