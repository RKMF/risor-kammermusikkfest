Translate and synchronize Norwegian → English content for: $ARGUMENTS

**Mode:** Analyze, draft, then apply only after approval.

Assumes `AGENTS.md` has already been read for repo-wide constraints.

## Use This When
- English fields are missing or outdated
- Norwegian content already exists and should be mirrored into English
- the task is translation or structural sync, not original content creation

## Step 1: Find the Document and Bilingual Fields
- query only the Norwegian and English fields needed for the task
- treat Norwegian as source of truth unless the user explicitly says otherwise

## Step 2: Compare Structure Before Translating
- inspect the full `_no` and `_en` structure, not just component counts
- identify:
  - text that needs translation
  - structural gaps in English
  - cases where English has content but Norwegian does not

If English is missing structure that Norwegian already has, report that first. Use `.ai/workflows/content.md` only if new source-side content or new structure must be created.

## Step 3: Apply Translation Rules

**Reference:** `.ai/instructions/translation-rules.md` for all conventions.

**Key areas to check:**
- Punctuation (quotes, dashes, apostrophes)
- Capitalization (days, months, nationalities, musical keys)
- Music terminology (Pianokonsert → Piano Concerto, C-dur → C Major)
- Date/number formats (24. juni → June 24)

## Step 4: Translate with Style

**Reference:** `.ai/instructions/writing-style.md` for tone and patterns.

**Translation goals:**
- Match Norwegian tone (warm, playful, personal)
- Feel native, not translated
- Preserve sentence rhythm and direct reader address ("you")

**Idioms:** Find equivalents, don't translate literally. If no equivalent exists, explain and suggest alternatives.

## Step 5: Report Findings

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

## Step 6: Apply Approved Changes

**Ask before making any changes.**

If approved:
- patch only the English draft fields that changed
- maintain component order from Norwegian
- keep references, media, and linked entities aligned unless the user says otherwise

## Step 7: Verify

After patching:
- re-query the changed English fields
- confirm the approved translation and structure are present
- report any remaining structural or source-content gaps

## Rules
- Norwegian is source of truth
- English should mirror Norwegian structure unless the user requests a deliberate difference
- all changes stay in draft until the normal editorial publish flow
- if source-side Norwegian content is missing, stop and resolve that first
