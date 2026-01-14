Translate and synchronize Norwegian → English content for: $ARGUMENTS

**Sanity MCP:** project `dnk98dp0`, dataset `production`

**Mode:** Steps 1-6 work in plan mode (analysis, draft). Exit plan mode at Step 7 to apply changes.

---

## Step 0: Efficient Querying Rules

**Use projections by default.** Full document fetches consume 5-15k tokens.

| Task | Approach |
|------|----------|
| Find document | `query_documents` with `{_id, _type, name, title_no}` |
| Check bilingual fields | `query_documents` with `{excerpt_no, excerpt_en, content_no, content_en}` |
| Verify after patch | `query_documents` with patched fields only |
| Full exploration | `get_document` (only when structure unknown) |

**Rule:** Before any query, ask "What fields do I actually need?"

---

## Step 1: Find the Document

Query by document type, name, ID, or description provided in $ARGUMENTS.

```groq
*[_type == "<type>" && (name match "<query>*" || title_no match "<query>*")][0]{
  _id,
  _type,
  name,
  title_no,
  title_en,
  excerpt_no,
  excerpt_en,
  content_no,
  content_en,
  // ... other bilingual fields
}
```

---

## Step 2: Analyze Content State

Compare ALL bilingual field pairs (`_no`/`_en`):

| State | Action |
|-------|--------|
| NO has content, EN empty | Translate NO → EN |
| NO has content, EN has content | Verify translation quality |
| NO empty, EN has content | Flag as problem (NO is source of truth) |
| Both empty | Nothing to translate |

**Critical: Deep content inspection required.**
- Do NOT trust component counts alone
- Inspect FULL content of every nested structure
- Check pageBuilder arrays item-by-item
- Compare rich text blocks completely

---

## Step 3: Check for Structural Differences

If EN is missing structural elements that NO has:

1. Report the missing elements
2. Ask user: "EN is missing [X components]. Should I use `/content` to create them?"
3. If approved, use `/content $ARGUMENTS "create missing EN components"` to add structure
4. Then continue with translation

---

## Step 4: Apply Translation Rules

**Reference:** `.claude/instructions/translation-rules.md` for all conventions.

**Key areas to check:**
- Punctuation (quotes, dashes, apostrophes)
- Capitalization (days, months, nationalities, musical keys)
- Music terminology (Pianokonsert → Piano Concerto, C-dur → C Major)
- Date/number formats (24. juni → June 24)

---

## Step 5: Translate with Style

**Reference:** `.claude/instructions/writing-style.md` for tone and patterns.

**Translation goals:**
- Match Norwegian tone (warm, playful, personal)
- Feel native, not translated
- Preserve sentence rhythm and direct reader address ("you")

**Idioms:** Find equivalents, don't translate literally. If no equivalent exists, explain and suggest alternatives.

---

## Step 6: Report Findings

Present to user:

### Translation Report for [Document Name]

**Fields analyzed:** [list]

**Allowed differences (music terminology):**
- [list any correct NO/EN terminology differences]

**Issues found:**
- [missing sections]
- [text needing translation]
- [structural gaps]

**Proposed changes:**
- [field]: [current EN] → [proposed EN]

---

## Step 7: Apply Changes (with approval)

**Ask before making any changes.**

If approved:
1. Use Sanity MCP `patch_document` to update EN fields
2. All changes go to DRAFT (never auto-publish)
3. Maintain component order from NO
4. Keep references (images, links, artist refs) identical

---

## Step 8: Verify

After patching:
1. Re-query the document
2. Confirm EN now matches NO structure
3. Report completion

---

## Rules

- Norwegian is source of truth
- EN must mirror NO structure exactly
- All changes go to DRAFT
- Ask before making changes
- Respect field limits (excerpt: 150 chars, etc.)
- If structural elements missing, reference `/content` to create them
