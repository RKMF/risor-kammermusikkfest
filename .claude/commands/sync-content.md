Synchronize Norwegian (NO) and English (EN) content for: $ARGUMENTS

Using the Sanity MCP server (project: dnk98dp0, dataset: production):

## Step 1: Identify the Content
- If a document type is provided (e.g., "homepage", "article", "event"), query that type
- If a document ID is provided, fetch that specific document
- If a description is provided (e.g., "the about page"), search for the matching document

## Step 2: Deep Content Analysis
Query both language versions and perform FULL-DEPTH comparison of ALL bilingual field pairs:
- `title_no` / `title_en`
- `description_no` / `description_en`
- `content_no` / `content_en`
- `extraContent_no` / `extraContent_en`
- `headerLinks_no` / `headerLinks_en`
- Any other `_no` / `_en` field pairs

**Critical: Never trust count-based analysis alone.**
- Do not assume sync based on matching component counts
- Always expand and inspect the FULL content of every nested structure
- This applies equally to all content: rich text, accordions, pageBuilder sections, lists, etc.

For each bilingual field, report:
- Component/item count in each language
- Component types and order
- Full text content comparison (not just structure)
- Missing sections (look for headings like "Besetning:", "Program:", etc.)

## Step 3: Categorize Differences

### Allowed Differences (Music Terminology)
These differences are CORRECT and should NOT be "fixed":

**Work titles follow language conventions:**
| Norwegian | English |
|-----------|---------|
| Pianokonsert | Piano Concerto |
| Pianotrio | Piano Trio |
| Strykekvartett | String Quartet |
| Fiolinkonsert | Violin Concerto |

**Musical keys use different notation:**
| Norwegian | English |
|-----------|---------|
| C-dur | C Major |
| a-moll | A Minor |
| Ess-dur | E-flat Major |
| fiss-moll | F-sharp Minor |

Note: In Norwegian, "dur" (major) is capitalized, "moll" (minor) is lowercase.
In English, both "Major" and "Minor" are capitalized.

### Required Sync (Must Match)
These MUST be synchronized:
- **Structural sections**: If NO has "Besetning:" (Performers), EN must have "Performers:"
- **Descriptive text**: Should match in meaning, detail level, and facts
- **Facts**: Dates, names, places must be identical
- **References**: Images, links, artist references must be identical

### Problems to Fix
Flag these issues for correction:
- Missing sections entirely (not just untranslated - absent)
- Typos in EN translation
- Missing details (dates, descriptive words present in NO but absent in EN)
- Divergent content (EN says something completely different, not a translation of NO)

## Step 4: Report Differences
Present a clear comparison showing:
1. **Allowed differences** (music terminology) - note but don't flag as issues
2. **Missing sections** - entire headings/sections absent in EN
3. **Text quality issues** - typos, missing details, divergent content
4. **Structure gaps** - components in NO not present in EN

## Step 5: Synchronize (with user approval)
For each gap:
1. Copy the NO structure to EN
2. Translate Norwegian text to English naturally
3. Apply correct music terminology conventions (see Allowed Differences above)
4. Keep references and assets identical (images, internal links)
5. Maintain exact component order to match NO

## Rules
- NO is the source of truth for structure and content completeness
- EN must mirror NO structure exactly
- Music terminology follows language-specific conventions (not literal translation)
- All changes go to DRAFT first (never auto-publish)
- Ask before making changes
- After sync, verify by re-querying and comparing full content
