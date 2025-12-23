Translate and synchronize Norwegian → English content for: $ARGUMENTS

**Sanity MCP:** project `dnk98dp0`, dataset `production`

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

Read and follow: `.claude/instructions/translation-rules.md`

### Key Rules Summary:

**Punctuation:**
- NO «» or "" → EN ""
- NO – dialogue → EN "quoted"
- NO Oles → EN Ole's

**Capitalization:**
- Days/months: lowercase → Capitalized
- Nationalities: lowercase → Capitalized
- Keys: C-dur/a-moll → C Major/A Minor

**Music Terminology:**
| Norwegian | English |
|-----------|---------|
| Pianokonsert | Piano Concerto |
| Strykekvartett | String Quartet |
| C-dur | C Major |
| a-moll | A Minor |
| Besetning: | Performers: |

**Dates/Numbers:**
- 24. juni → June 24
- kl. 19:00 → 7:00 PM
- 1 000 → 1,000

---

## Step 5: Translate with Style

Read: `.claude/instructions/writing-style.md`

The English translation should:
- Match the tone of the Norwegian (warm, playful, personal)
- Feel native, not translated
- Preserve the sentence rhythm (hook → development → landing)
- Keep the direct reader address ("you" for "du/dere")
- Maintain confident claims without hedging

### Idiom Handling:
- Find equivalent expressions, NOT literal translations
- If no good equivalent: explain and suggest alternatives
- Never invent idioms

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
