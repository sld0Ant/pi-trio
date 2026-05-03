---
description: "Trio + OpenSpec: spec-driven planning → Executor → independent Reviewer with specs verification"
---
Work in **trio-os** mode for this task: $@

This workflow integrates OpenSpec with trio. OpenSpec handles planning (specs as source of truth), trio handles execution and review.

## Pre-flight

Before starting, check that `openspec` CLI is installed: run `which openspec`.
If not found, tell the user to install it: `bun add -g @fission-ai/openspec@latest`
Then initialize in the project if needed: `openspec init --tools pi`

## Workflow

**Phase 1 — OpenSpec Propose** (load skill `openspec`):
Read the openspec skill. Use `/opsx:propose` workflow to create the change:
- proposal.md — why and what
- design.md — technical approach
- specs/ — delta-specs with requirements and scenarios
- tasks.md — implementation checklist

After artifacts are created, call `trio_plan_review` with an OpenSpec review pack, not tasks.md alone:
- `plan`: `""`
- `mode`: `"openspec"`
- `change_dir`: `"openspec/changes/<name>"`
- `review_depth`: `"critical_and_important"`

Fix Critical and selected Important issues. For confirmation review after Critical issues are fixed, call `trio_plan_review` again with `review_depth: "critical_only"`. If strict OpenSpec validation passes and the raw verdict is `APPROVABLE_WITH_NOTES`, `APPROVED`, or legacy `PASS`, stop plan review and present artifacts to the user for approval. If the raw verdict is `BLOCKED`, `NEEDS WORK`, or `UNKNOWN`, continue fixing or ask the user for guidance. Do NOT create a separate trio plan — OpenSpec tasks.md IS the plan.

**Phase 2 — Execute** (load skill `executor`):
After artifacts are approved, read the executor skill. Implement strictly according to tasks.md.
Update checkboxes in tasks.md as you complete each task: `[ ]` → `[x]`.
Track all created/modified files (excluding openspec/ artifacts).

**Phase 3 — Code Review**:
After implementation, call the `trio_review` tool:
- `plan`: the content of tasks.md
- `files`: absolute paths of all created/modified source files
- `specs_dir`: path to the change's specs directory (e.g. `openspec/changes/<name>/specs/`)

If verdict is NEEDS WORK — fix the issues and call `trio_review` again.
If verdict is PASS — run `/opsx:archive` to merge delta-specs into main specs and archive the change.

Report the final result to the user.
