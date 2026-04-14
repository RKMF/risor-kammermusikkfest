Create or enhance Norwegian source content for: $ARGUMENTS

**Mode:** Research, draft, then apply only after approval.

Assumes `AGENTS.md` has already been read for repo-wide constraints.

## Use This When
- creating new Norwegian content in an existing document
- improving weak or incomplete Norwegian fields
- adding page-builder structure based on research and existing content patterns

## Step 1: Find the Document and Current State
- identify the target document by name, ID, or title
- query only the fields needed to understand what is missing
- determine whether the task is:
  - create missing Norwegian content
  - improve existing Norwegian content
  - add or revise page-builder structure

If the task is validation rather than creation, use `.ai/workflows/content-validate.md`.

## Step 2: Research and Collect Source Material
Use `.ai/instructions/research.md` and `.ai/instructions/quotes.md`.

Gather only what the content needs:
- core facts and artistic identity
- strong quotes with author, source, and URL
- relevant Norway or Risør connection when it exists
- any media or related content worth surfacing

Prefer:
- independent sources for credibility
- artist-affiliated sources for factual CV details

## Step 3: Check Existing Content Patterns
- inspect 2-3 similar documents of the same type
- note component order and recurring structure
- use those patterns as a constraint, not a template to copy blindly

## Step 4: Draft the Norwegian Content
Use `.ai/instructions/writing-style.md`.

When drafting:
- keep Norwegian as source of truth
- follow the repo’s tone and sentence rhythm
- respect field limits
- suggest only the components justified by the research
- leave explicit placeholders for media that must be added manually

If quotes are used:
- include source URLs
- preserve English quotes in English
- translate other foreign-language quotes with attribution notes when needed

## Step 5: Present Before Editing
Show:
- the proposed Norwegian text
- the proposed components or structure
- any placeholders for missing media
- the sources used

If the document also needs English, hand off to `.ai/workflows/translate.md` after the Norwegian version is approved.

## Step 6: Apply Approved Changes
If approved:
- patch only the affected draft fields
- replace the smallest structure necessary
- preserve unrelated content and ordering

## Step 7: Verify
- re-query the changed fields
- confirm the draft contains the approved content
- report what changed and whether English follow-up is still needed

## Rules
- Norwegian is the source of truth
- research before writing new content
- prefer minimal patches over broad rewrites
- keep all changes in draft until explicitly published through the normal editorial flow
