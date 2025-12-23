Create or enhance content for: $ARGUMENTS

**Sanity MCP:** project `dnk98dp0`, dataset `production`

**Mode:** Steps 1-9 work in plan mode (research, draft). Exit plan mode at Step 10 to apply changes.

---

## Understanding $ARGUMENTS

The argument can include:
- Document identifier (name, ID, or description)
- Optional instructions in quotes: `"add 2 quotes and an image"`

Examples:
- `/content tine thing helseth` → Research and write full content
- `/content romeo og julie "add contentScrollContainer with 3 quotes"` → Add specific components
- `/content haydn-konserten` → Fill empty fields with researched content

---

## Step 1: Find the Document

Query by document type, name, ID, or description:

```groq
*[_type in ["artist", "event", "page", "article"] && (
  name match "<query>*" ||
  title_no match "<query>*" ||
  _id == "<query>"
)][0]{
  _id,
  _type,
  name,
  title_no,
  slug,
  excerpt_no,
  excerpt_en,
  instrument_no,
  instrument_en,
  content_no,
  content_en,
  image
}
```

---

## Step 2: Analyze Document State

Determine what needs to be done:

| State | Action |
|-------|--------|
| NO fields empty | Research → Write NO → Translate EN |
| NO has content, EN empty | Use `/translate` for EN |
| User gave instructions | Add/modify components as requested |
| Both have content | Ask what user wants to change |

---

## Step 3: Research (if needed)

When creating new content, use `WebSearch` to find:

- Official biography/background
- Notable achievements, awards, recordings
- Recent performances, albums, collaborations
- Quotes BY the subject (from interviews, profiles) - always note source URL
- Quotes ABOUT the subject (from reviews, critical analysis) - always note source URL
- Reviews and critical analysis (rich source of "pull quotes")
- Connection to Risør (if applicable)
- Related links for reference

**Search strategy (examples):**
1. Artist/composer name + "biography"
2. Artist/composer name + "interview"
3. Artist/composer name + "review"
4. Artist/composer name + "Risør" (for festival connections)
5. etc. - adapt searches based on what you're looking for

**Chronological approach:** Search current year first, then work backwards. Newer references keep content up to date.

Compile research into notes before writing.

**Important:** Read through all promising search results, not just the ones that seem most relevant. Reviews, profiles, and feature articles often contain the best quotes.

---

## Step 4: Analyze Patterns from Similar Documents

Query 2-3 existing published documents of the same type to understand established patterns:

```groq
*[_type == "<same-type>" && defined(content_no)][0...3]{
  name,
  "components": content_no[]._type
}
```

Identify the pattern:
- What component types are used?
- What order/structure is typical?
- How is content organized?

Use this as a reference for consistent page architecture across similar document types.

---

## Step 5: Suggest Components Based on Research

Analyze research findings and suggest components that match discoveries AND follow established patterns.

| Research Finding | Potential Component |
|------------------|---------------------|
| 2+ interesting quotes | contentScrollContainer with quoteComponents |
| 1 standout quote | Single quoteComponent |
| Spotify artist/album | spotifyComponent |
| YouTube performance/interview | videoComponent (placeholder) |
| Notable photos mentioned | imageComponent (placeholder) |
| Related festival artists | artistScrollContainer |
| Awards/achievements list | portableTextBlock or accordionComponent |
| Career timeline | Structured headings + text blocks |

**Quote requirements:** Always include source URL for verification. Present quotes as:
> "Quote text here." - [Source Name](URL)

**Think holistically:** What would interest a visitor to this page? Consider the full experience, not just individual components.

**Present in this order:**

### 1. Proposed Content

List ALL proposed content so user can review:

- **Text content:** The actual paragraphs you will write
- **Quotes:** With source URLs
- **Media:** Spotify albums, video links, image suggestions
- **References:** Related artists, events, links

### 2. Visual Page Architecture

AFTER content is reviewed, show layout:

```
┌─────────────────────────────────────┐
│  [Component type]                   │
│  [Brief description]                │
├─────────────────────────────────────┤
│  [Next component]                   │
│  [Brief description]                │
└─────────────────────────────────────┘
```

Adapt visual to match actual proposed components.

User reviews content first, then sees page flow.

---

## Step 6: Write Norwegian Content

Read and follow: `.claude/instructions/writing-style.md`

### Style Summary:

**Voice:** Warm, confident, personal - like speaking to a friend who loves music.

**Patterns:**
- Bold superlatives ("verdens viktigste", "en av de fremste")
- Direct address ("du", "dere", "deg")
- Inclusive "we" ("vi", "vår")
- Playful wit and unexpected imagery
- Short, punchy sentences
- Two-sentence structure: setup + payoff

**Sentence rhythm:**
1. Opening hook - bold claim or intriguing setup
2. Development - brief elaboration or contrast
3. Landing - short punch, often with "du/dere" or promise

**Avoid:**
- Formal/stiff language
- Passive voice
- Lengthy explanations
- Hedging ("kanskje", "muligens")
- Corporate-speak

---

## Step 7: Add Components (following suggestions)

Available pageBuilder components:

| Category | Components |
|----------|------------|
| **Innhold** | headingComponent, portableTextBlock, quoteComponent, marqueeComponent |
| **Media** | imageComponent, videoComponent, spotifyComponent |
| **Layout** | gridComponent, twoColumnLayout, threeColumnLayout |
| **Interaktiv** | buttonComponent, linkComponent, accordionComponent, countdownComponent |
| **Seksjoner** | contentScrollContainer, artistScrollContainer, eventScrollContainer, composerScrollContainer |

When adding components:
- Fill text content (quotes, headings, text blocks)
- Leave `[ADD IMAGE]` placeholder for imageComponent
- Leave `[ADD VIDEO URL]` placeholder for videoComponent
- Maintain logical content flow

---

## Step 8: Respect Field Limits

| Field | Limit |
|-------|-------|
| name | 1-100 characters |
| excerpt_no/en | max 150 characters |
| imageAlt_no/en | 1-125 characters |
| slug | max 96 characters |

Write content that fits within these limits. For excerpts, aim for punchy 1-2 sentences.

---

## Step 9: Present Proposed Content

Show the user:

### Proposed Content for [Document Name]

**excerpt_no:** (X characters)
> [proposed text]

**content_no:**
1. [component type]: [content summary]
2. [component type]: [content summary]
...

**Placeholders for manual addition:**
- [list any [ADD IMAGE] or [ADD VIDEO] placeholders]

---

## Step 10: Apply Changes (with approval)

**Ask before making any changes.**

If approved:
1. Use Sanity MCP `patch_document` to update NO fields
2. All changes go to DRAFT (never auto-publish)

---

## Step 11: Translate to English

After Norwegian content is created/approved:

1. Automatically use `/translate` command logic
2. Apply translation rules from `.claude/instructions/translation-rules.md`
3. Create matching EN content
4. Present both NO and EN for final approval

---

## Step 12: Final Verification

After all patches:
1. Re-query the document
2. Confirm both NO and EN are populated
3. Report completion with summary

---

## Rules

- Norwegian is source of truth - always create NO first
- Research before writing new content
- Suggest components based on research findings (don't force components)
- Reference similar documents for structural consistency
- Follow the writing style guide strictly
- All changes go to DRAFT
- Ask before making changes
- Leave clear placeholders for manual media additions
- Always translate to EN after creating NO content
