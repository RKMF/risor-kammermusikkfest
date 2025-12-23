Synchronize Norwegian (NO) and English (EN) content for: $ARGUMENTS

Sanity MCP: project dnk98dp0, dataset production

## Step 1: Identify Content
Query by document type, ID, or description provided in $ARGUMENTS.

## Step 2: Deep Content Analysis

Compare ALL bilingual field pairs (`_no`/`_en`): title, description, content, extraContent, headerLinks, etc.

**Critical: Never trust count-based analysis alone.**
- Do not assume sync based on matching component counts
- Always inspect FULL content of every nested structure
- Applies to all content: rich text, accordions, pageBuilder, lists

Report for each field: component count, types, order, full text comparison, missing sections.

## Step 3: Categorize Differences

### Allowed Differences (Music Terminology)
These are CORRECT - do NOT "fix":

| Norwegian | English |
|-----------|---------|
| Pianokonsert | Piano Concerto |
| Pianotrio | Piano Trio |
| Strykekvartett | String Quartet |
| C-dur | C Major |
| a-moll | A Minor |
| Ess-dur | E-flat Major |

Note: Norwegian "dur" capitalized, "moll" lowercase. English both capitalized.

### Required Sync (Must Match)
- Structural sections: NO "Besetning:" = EN "Performers:"
- Descriptive text: same meaning, detail level, facts
- Facts: dates, names, places identical
- References: images, links, artist refs identical

### Problems to Fix
- Missing sections entirely
- Typos in EN
- Missing details (dates, words in NO absent in EN)
- Divergent content (EN not a translation of NO)

## Step 4: Report
Show: allowed differences (note only), missing sections, text issues, structure gaps.

## Step 5: Synchronize (with approval)
1. Copy NO structure to EN
2. Translate naturally
3. Apply music terminology conventions
4. Keep references identical
5. Maintain component order

## Rules
- NO is source of truth
- EN must mirror NO structure exactly
- Music terminology follows language conventions
- All changes go to DRAFT (never auto-publish)
- Ask before making changes
- Verify by re-querying after sync
