# AI Workflow Assets

This folder holds repo-owned workflow assets intended to work across AI tools.

Read `README.md` for the human-facing front door and `AGENTS.md` for the minimal repo-wide briefing. Use this folder for task-specific operating material and reusable reference content, not for duplicating either one.

## Structure

- `specialists/` - Domain-specific expert briefs for focused technical work
- `workflows/` - Repeatable operating procedures for common tasks
- `instructions/` - Cross-cutting rules, style guides, and reference material
- `memory/` - Lightweight durable learnings, decisions, and repeated gotchas

## Usage

- `AGENTS.md` is the always-loaded layer: only short, high-value repo context belongs there.
- Use `instructions/` for stable shared standards that apply across tasks.
- Use `workflows/` for concrete procedures such as implementation setup, release, content, translation, validation, debugging, or context refresh.
- Use `specialists/` when a task needs deep expertise in a specific domain.
- Use `memory/` for recurring lessons that are worth capturing but do not belong in the root briefing.

Workflow chooser:
- Start with `AGENTS.md`.
- After context loss, chat clearing, or handoff, use `.ai/workflows/refresh.md`.
- For a new coding session that needs servers and a fresh branch, use `.ai/workflows/prep.md`.
- For content creation, use `.ai/workflows/content.md`.
- For content validation, use `.ai/workflows/content-validate.md`.
- For translation or NO/EN sync, use `.ai/workflows/translate.md`.
- For release work, use `.ai/workflows/dev-release.md` or `.ai/workflows/live-release.md`.
- Then load only the workflow or instruction files needed for the current task.

If a rule is discoverable from code, config, or existing docs, link to the source of truth or fix the underlying problem instead of restating it here.
