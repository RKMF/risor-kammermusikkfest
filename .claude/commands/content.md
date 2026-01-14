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
- `/content validate artists` → Check all events for instrument mismatches
- `/content validate artists Back to the Future` → Check specific event

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

## Step 1b: Detect Validation Mode

If $ARGUMENTS starts with "validate artists":
- Skip directly to **Validation Workflow** section at the end of this document
- Otherwise continue with normal content workflow (Step 2 onwards)

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

**Reference:** `.claude/instructions/research.md` for sources and methodology.

**What to find:**
- Biographical facts, achievements, artistic identity
- Quotes BY the subject (from interviews) - note author + source + URL
- Quotes ABOUT the subject (from reviews, critics) - note author + source + URL
- Connection to Norway/Risør (if applicable)

**Search strategy:**
1. Native language sources first (Norwegian artist → `.no` domains, NRK, etc.)
2. Then international sources
3. Current year first, work backwards

**Important:** Read through reviews and feature articles - they contain the best quotes.

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

### Required: References Accordion

**Always add at the end of the page.**

An `accordionComponent` titled "Alle referanser" (NO) / "All references" (EN) containing links to all sources used. See `quotes.md` for attribution format.

This allows users to verify content and explore further. Especially important for artist pages.

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

## Step 5b: Quote Handling

**Reference:** `.claude/instructions/quotes.md` for finding, evaluating, and attributing quotes.

**Key points:**
- English quotes: Keep in English for both NO and EN
- Other languages: Translate + indicate source (`[oversatt fra tysk]`)
- Always capture: Author + Source + URL
- In quoteComponent: `forfatter`, `kilde`, `cite` fields

---

## Step 6: Write Norwegian Content

**Reference:** `.claude/instructions/writing-style.md` for tone, patterns, and grammar.

**Voice:** Warm, confident, personal - like speaking to a friend who loves music.

**Quick checklist:**
- Bold superlatives, direct address ("du/dere"), inclusive "vi"
- Short, punchy sentences with setup + payoff rhythm
- Avoid: formal language, passive voice, hedging ("kanskje", "muligens")

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

**Reference:** `.claude/instructions/writing-style.md` for field limits.

Write content that fits within schema limits. For excerpts, aim for punchy 1-2 sentences.

---

## Step 9: Present Proposed Content

Show the user:

### Proposed Content for [Document Name]

**excerpt_no:** (X characters)
> [proposed text]

**content_no:**
- [component type]: [content summary]
- [component type]: [content summary]
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

## Step 10b: Efficient Patching Rules

**Principle: Patch the minimum necessary structure.**

1. **Always query the DRAFT first** (`drafts.<id>`) to see current content before patching

2. **For simple fields** (excerpt, title, description arrays):
   - Replace only the specific field, not parent objects
   - Example: `set: [{path: "excerpt_en", value: "..."}]`

3. **For nested structures** (accordions, content arrays):
   - **DO:** Patch only the changed nested field when possible
   - **DON'T:** Rebuild entire parent component to change one child field
   - If you must replace a parent, replace the smallest parent that contains your change

4. **For complex components with unchanged siblings:**
   - Bad: Replace entire `extraContent_en` array (includes all accordion panels)
   - Good: Replace only `extraContent_en[0].description` if only description changed

5. **Token efficiency checklist:**
   - Am I only sending the fields that changed?
   - Am I avoiding re-sending unchanged nested content?
   - Could I patch a smaller parent structure?

6. **Path syntax:**

   Works:
   ```
   set: [{path: "excerpt_en", value: "New text"}]
   set: [{path: "description_en", value: [{_key: "...", _type: "block", ...}]}]
   ```

   Doesn't work (nested child paths):
   ```
   set: [{path: "description_en[_key==\"abc\"].children[0].text", value: "..."}]
   ```

   When nested paths fail, replace the smallest parent that contains your change.

7. **Fallback hierarchy** (prefer top, avoid bottom):
   1. Single field value
   2. Single array item
   3. Entire field array (e.g., `description_en`)
   4. Parent component (e.g., single accordion in `extraContent_en`)
   5. Entire parent array (LAST RESORT)

---

## Step 11: Translate to English

**Reference:** `.claude/instructions/translation-rules.md` for all conventions.

After Norwegian content is created/approved:

1. Apply translation rules (punctuation, capitalization, music terminology, dates)
2. Match Norwegian tone - feel native, not translated
3. Create matching EN content for all fields
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
- Use bullet points for lists, never numbered lists
- Research before writing new content
- Suggest components based on research findings (don't force components)
- Reference similar documents for structural consistency
- Follow the writing style guide strictly
- All changes go to DRAFT
- Ask before making changes
- Leave clear placeholders for manual media additions
- Always translate to EN after creating NO content

---

## Validation Workflow (for "validate artists" mode)

Use this workflow when $ARGUMENTS starts with "validate artists".

### Step V1: Find Events to Validate

If event name provided after "validate artists":
```groq
*[_type == "event" && (title_no match "<query>*" || title_en match "<query>*")][0]{
  _id,
  title_no,
  title_en,
  extraContent_no
}
```

If no event name (validate all):
```groq
*[_type == "event" && defined(extraContent_no)]{
  _id,
  title_no,
  title_en,
  extraContent_no
}
```

---

### Step V2: Extract Performer Listings

Parse `extraContent_no` accordion panels for bullet list items matching pattern:
- "Name, instrument" (e.g., "Håvard Gimse, cembalo")

Look for text in Portable Text blocks within accordion panels that follow the "Besetning:" heading.

---

### Step V3: Cross-Reference Artists

For each performer name found, query the artist document:
```groq
*[_type == "artist" && name match "<performer-name>*"][0]{
  _id,
  name,
  instrument_no,
  instrument_en
}
```

Compare:
- Instrument in program text (from Step V2)
- Instrument in artist profile (`instrument_no`)

---

### Step V4: Report Findings

Present results in this format:

```
## Validation Report: [Event Name]

### Summary: X matches | Y mismatches | Z not found

| Performer | Program Says | Artist Profile Says | Status |
|-----------|--------------|---------------------|--------|
| Håvard Gimse | cembalo | Piano | Mismatch |
| Tine Thing Helseth | trompet | Trompet | OK |
| Guest Artist | fiolin | - | Not Found |

### Notes
- Mismatches may be intentional (artist plays multiple instruments for different pieces)
- "Not Found" means no artist document matches that name in the CMS
```

---

### Step V5: Offer Fixes

For each mismatch, ask what action to take:

1. **"Update program to match artist profile?"** - Change program text to use artist's registered instrument
2. **"Leave as-is (intentional for this piece)?"** - No changes, artist plays different instrument for this specific work
3. **"Note for manual review"** - Flag for content editor to decide

For "Not Found" entries:
- These may be guest artists without CMS profiles
- Or typos in the performer name
- Ask user if they want to create an artist document or correct the spelling
