# Canvas + Content Agent Plan

## Purpose

This document proposes a practical workflow for using Sanity Canvas as the ideation layer for concert copy and Sanity Content Agent as the drafting, review, and consistency layer for structured event content.

The goal is to improve the editorial workflow for concert pages without weakening the current `event` document model, publish flow, or front-end data contract.

## Current State

The project already has a strong event-centered content model in Sanity:

- Shared factual fields for concert data live in the `event` document:
  - date
  - time
  - venue
  - artists
  - composers
  - ticketing fields
- Public-facing editorial content also lives in the `event` document:
  - Norwegian title, excerpt, and concert description
  - English title, excerpt, and concert description
  - optional extra content blocks
- Publishing already depends on the `event` document for operational logic such as:
  - syncing `eventDateValue`
  - artist reciprocal reference updates
  - program page inclusion prompts

This means the project does not need a new content source. It needs a better upstream editorial workflow.

## Recommended Model

Use a three-layer workflow:

1. `Canvas` for artistic thinking, rough notes, and concept development.
2. `event` documents for structured facts and final website content.
3. `Content Agent` for transformation, consistency checking, translation, and gap detection after content is in Studio.

This is the correct split for RKMF.

Canvas should not become a parallel system of record.

## Editorial Principles

### Canonical Source of Truth

The `event` document remains the only canonical source for anything that affects:

- front-end rendering
- links and URLs
- filtering and sorting
- JSON-LD / structured data
- publishing status
- ticket button behavior
- artist and composer relationships

### Canvas Role

Canvas should be treated as a working brief, not a published data model.

Use it for:

- artistic intent
- curatorial reasoning
- story angle
- listening cues
- possible framing ideas
- raw phrases and candidate copy
- editor-only notes

Do not rely on Canvas as the authoritative home for:

- dates and times
- venue
- performer references
- composer references
- ticket URLs
- ticket state
- slugs
- publish status

## Target Workflow

### Step 1: Create the Event Document Early

Create the `event` document as soon as a concert exists programmatically, even if the editorial copy is incomplete.

Populate the factual and structural fields first:

- `eventDate`
- `eventTime`
- `venue`
- artist references
- composer references
- `ticketType`
- `ticketUrl`
- `ticketInfoText`
- `ticketStatus`
- image when available

This ensures downstream systems already have the correct source record.

### Step 2: Create or Link a Canvas Brief

For each concert page, create a Canvas document linked to the target `event`.

The artistic director should work in Canvas, not directly in the event description field, when the material is still exploratory.

### Step 3: Use a Standard Canvas Template

The Canvas should use a stable structure so that:

- the artistic director has a clear writing frame
- editors know where to find specific information
- mapping into Sanity fields is more reliable
- agent prompts can refer to consistent sections

Recommended sections:

1. `Concert premise`
   - One paragraph describing the artistic identity of the concert.
2. `Why this program`
   - Why these works, composers, and performers belong together.
3. `What the audience should listen for`
   - Three to five concrete listening cues.
4. `Performer angle`
   - Why these specific musicians matter in this program.
5. `Tone and atmosphere`
   - Mood words and emotional character.
6. `Possible website hook`
   - Candidate framing lines for page excerpt or homepage use.
7. `Practical notes`
   - Internal editor notes only.
8. `Optional quote lines`
   - Short phrases that could become pull quotes or teaser lines.

### Step 4: Map Canvas Into Event Editorial Fields

Use Canvas content mapping only for public-facing editorial fields.

Good mapping targets:

- `title_no`
- `excerpt_no`
- `description_no`
- `extraContent_no`

Possible later targets:

- `title_en`
- `excerpt_en`
- `description_en`

Avoid mapping Canvas directly into:

- ticketing fields
- references
- slugs
- scheduling or publishing fields
- SEO fields unless explicitly reviewed

### Step 5: Review and Normalize in Studio

After mapping, the editor should review the content in the `event` document and make sure:

- the description is concise and audience-facing
- the excerpt is short and specific
- the language matches the RKMF tone
- factual claims match the actual program
- the content respects field length limits

### Step 6: Use Content Agent on the Structured Event

Once the content lives in the event document, Content Agent can be used for:

- turning rough mapped notes into polished web copy
- reducing overly academic or internal language
- translating from Norwegian to English
- checking consistency across all concert entries
- finding missing fields
- detecting repetitive excerpts
- proposing sharper program teasers

This is where Content Agent adds the most value.

### Step 7: Human Review Before Publish

All generated or transformed content must be reviewed by a human before publish.

Minimum review:

- factual correctness
- tone
- translation quality
- concert-specific precision
- ticketing correctness

## Recommended Ownership

### Artistic Director

Owns:

- artistic framing
- why the concert matters
- what the audience should notice
- conceptual language and tone source material

Works primarily in:

- Canvas

### Editor / Web Producer

Owns:

- mapping from Canvas to event fields
- rewriting for clarity and web readability
- excerpt quality
- final NO/EN public copy
- ticketing copy review
- publishing readiness

Works primarily in:

- `event` document
- Content Agent assisted workflows

### Sanity / Technical Owner

Owns:

- Studio upgrades
- schema updates
- content mapping configuration
- agent configuration
- guardrails and prompt design

## Required Platform Updates

### 1. Upgrade Sanity Studio

This repository is currently on Sanity `4.22.0`.

Content Agent requires a newer Studio version. This is a future migration path, not part of the current supported baseline. Before implementing agent-based workflow in production, upgrade Studio to a version that supports:

- Content Agent
- current Canvas integration and content mapping support
- any required agent UI/features for the workspace

Implementation tasks:

1. review Sanity release notes for the target version
2. upgrade `sanity` and related first-party packages
3. validate custom document actions
4. validate Presentation / Visual Editing
5. validate schema extraction and type generation
6. run Studio tests and manual editorial smoke tests
7. treat the rollout as a dedicated migration branch/PR, not routine dependency maintenance

### 2. Confirm Canvas and Mapping Availability

After the Studio upgrade, confirm:

- Canvas is enabled for the workspace/project
- linked-document mapping is available
- editors have permission to use Canvas and mapping
- the mapping workflow works against the `event` schema

### 3. Define Content Agent Access and Policy

Before enabling editorial use, decide:

- who can invoke Content Agent
- which document types it may work on
- whether it may write directly or only propose edits
- whether English generation is allowed automatically
- which tone/style constraints it must follow

## Schema and Studio Updates Recommended

The current `event` model is already usable. Only targeted updates are recommended.

### A. Add a Field for Canvas Linkage or Editorial Brief Metadata

Recommended options:

1. Add a simple field to the `event` document for a Canvas reference, if Sanity exposes a supported way to store that linkage in the project workflow.
2. If native linking already handles this sufficiently, do not duplicate it in schema.
3. If needed, add an internal-only plain text field such as `editorialBriefStatus` or `contentWorkflowState` to track editorial progress.

Suggested workflow state options:

- `brief_needed`
- `brief_in_canvas`
- `mapped_to_event`
- `copy_in_review`
- `ready_for_translation`
- `ready_to_publish`

This is optional, but useful if multiple people collaborate asynchronously.

### B. Add Internal Guidance Near Event Editorial Fields

The event schema already has descriptions, but the writing fields would benefit from slightly more workflow-specific guidance.

Suggested updates:

- `excerpt_no`:
  - clarify that this is the short public-facing hook, not an internal summary
- `description_no`:
  - clarify that this should be audience-facing and concise, not a rehearsal note dump
- `extraContent_no`:
  - clarify when to use it versus the main description
- English fields:
  - clarify whether they should be direct translation or adapted translation

### C. Consider a Small Internal Notes Field

If Canvas will not always be used, a limited internal note field in the `event` document can help preserve critical editorial context.

Use only for:

- short internal reminders
- content production status
- coordination notes

Do not use it as a replacement for Canvas.

## Content Mapping Rules

Mapping should be conservative.

### What Should Be Mapped

- clearly audience-facing summary text
- polished or near-polished concert description text
- candidate excerpt text
- candidate quote lines if useful

### What Should Not Be Mapped Automatically

- ticket information
- event logistics
- dates and times
- venue selection
- artist/composer references
- SEO titles and metadata
- structured extra content blocks requiring editorial judgment

### Mapping Process

Recommended process:

1. artistic director writes the brief in Canvas
2. editor marks internal notes as context where applicable
3. mapping moves candidate public text into event text fields
4. editor rewrites and trims
5. Content Agent assists only after mapped content sits in the event doc

## Content Agent Use Cases for RKMF

### High-Value Use Cases

1. `Description refinement`
   - Turn raw notes into a concise concert description suitable for `description_no`.
2. `Excerpt generation`
   - Produce one to three short excerpt candidates under the field limit.
3. `Translation`
   - Draft English title, excerpt, and description from approved Norwegian copy.
4. `Consistency audit`
   - Review all concerts and flag entries with weak or repetitive copy.
5. `Missing content audit`
   - Identify events lacking excerpt, image, ticket status, or English copy.
6. `Tone normalization`
   - Keep a consistent RKMF voice across all events.

### Lower-Value or Risky Use Cases

Avoid using Content Agent for:

- inventing artistic claims
- choosing ticket status
- generating slugs automatically without review
- inferring structured references from prose
- writing final SEO metadata with no human review

## Suggested Agent Prompting Strategy

Define a small set of repeatable editorial tasks instead of free-form prompting.

Recommended tasks:

### Task 1: Draft Norwegian Description

Prompt goal:

- use the mapped Canvas brief and event facts
- produce a concrete, elegant, audience-facing `description_no`
- keep within the field limit
- avoid internal language, planning notes, and exaggerated claims

### Task 2: Generate Excerpt Candidates

Prompt goal:

- produce 3 excerpt options
- each should be short, specific, and distinct
- avoid repeating the title

### Task 3: Translate to English

Prompt goal:

- preserve factual meaning
- adapt for natural English usage
- avoid machine-literal translation

### Task 4: Audit Event Completeness

Prompt goal:

- scan all published or draft events
- list missing or weak fields
- do not edit, only report

## Voice and Style Rules to Define

Before enabling broad agent use, define editorial rules the agent must follow.

Suggested RKMF rules:

- write for an interested general audience, not only experts
- prefer concrete musical or emotional cues over abstract prestige language
- avoid empty superlatives
- do not over-explain repertoire history unless it serves the concert page
- keep the description vivid but concise
- preserve artistic seriousness without sounding academic
- keep ticket-related language practical and direct

## Data Quality Updates Recommended Before Rollout

There is schema drift in ticket-related types and rendering that should be resolved before layering in more automation.

Examples to review:

- the `event` schema uses `ticketType` values oriented around button/info UI behavior
- some front-end typing and structured-data logic appear to use different ticket type assumptions

Before introducing Content Agent-driven workflows:

1. align ticket-related enums across Studio schema, query typings, and front-end rendering
2. verify structured data emits correct ticket offer information
3. confirm field naming and semantics are consistent across the stack

The more reliable the structure, the more useful the agent layer becomes.

## Implementation Plan

### Phase 1: Preparation

1. document the desired workflow with editors and artistic director
2. define the Canvas template structure
3. define approved agent tasks
4. define editorial style rules
5. decide whether workflow state tracking is needed in the schema

### Phase 2: Technical Upgrade

1. upgrade Sanity Studio to the required version
2. verify custom plugins and document actions
3. verify build, test, and deployment workflows
4. verify Presentation / preview still works
5. verify schema extraction and generated types

### Phase 3: Schema and Studio Refinement

1. improve field descriptions in the `event` schema
2. optionally add a lightweight workflow state field
3. optionally add an internal notes field if needed
4. define or enable Canvas-to-event linking

### Phase 4: Canvas Rollout

1. create the RKMF concert Canvas template
2. pilot the template on 3 to 5 concerts
3. validate mapping behavior into `event` fields
4. refine the template based on editorial feedback

### Phase 5: Content Agent Rollout

1. start with read-only audit and suggestion tasks
2. test Norwegian description generation
3. test excerpt generation
4. test English translation drafts
5. keep human approval mandatory

### Phase 6: Operationalize

1. document the editorial SOP
2. train the artistic director and editor on the template
3. define a naming convention for Canvas docs
4. review output quality after the first festival cycle
5. adjust prompts and schema guidance based on real use

## Proposed Naming Conventions

### Canvas Documents

Recommended format:

- `Concert brief - [Date] - [Concert title]`

Example:

- `Concert brief - 2026-06-27 - Beethoven / Kurtag / Schumann`

### Event Workflow States

If workflow state is added:

- `brief_needed`
- `brief_in_canvas`
- `mapped_to_event`
- `copy_in_review`
- `translated`
- `ready_to_publish`

## Acceptance Criteria

The workflow should be considered successfully implemented when:

1. editors can link a Canvas document to an event and reliably move useful content into event fields
2. the artistic director can provide briefs without editing structured CMS fields directly
3. concert descriptions become faster to produce and more consistent in tone
4. English drafts can be generated from approved Norwegian copy
5. the event document remains the only authoritative content source for production
6. publishing, program listing, and ticket behavior are unchanged or improved

## Risks

### Risk: Canvas Becomes a Shadow CMS

Mitigation:

- require all publishable content to end in the event document
- do not store operational facts only in Canvas

### Risk: Agent Output Sounds Generic

Mitigation:

- define RKMF style rules
- use the artistic director's brief as source material
- require human review

### Risk: Mapping Produces Messy Drafts

Mitigation:

- use a stable Canvas template
- map conservatively
- separate internal notes from public-facing text

### Risk: Upgrade Breaks Studio Behavior

Mitigation:

- test custom document actions
- test preview and presentation workflows
- upgrade in a branch and validate with editors before deploy

## Recommended Next Actions

1. Approve this workflow model.
2. Upgrade Sanity Studio to a Content Agent-compatible version.
3. Pilot a standardized concert brief Canvas template on a small set of events.
4. Make targeted schema guidance updates in `event.ts`.
5. Roll out Content Agent first as an assistant for draft generation and audits, not autonomous publishing.
