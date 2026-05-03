---
description: "Trio + OpenSpec: bootstrap or repair openspec/INDEX.md traceability index"
---
Work in **trio-os make-index** mode for this task: $@

Use this workflow when the user explicitly wants to create, bootstrap, update, or repair the OpenSpec traceability index. The canonical Pi prompt command is `/trio-os-make-index`. If the user asks for `/trio-os:make_index`, treat that as this workflow's intent; do not claim a runtime alias exists unless one is implemented.

## Scope

Only work on traceability index bootstrap or maintenance:

- create `openspec/INDEX.md` when it is missing;
- update or repair `openspec/INDEX.md` when it already exists;
- keep entries compact and navigational;
- do not implement unrelated feature work in this workflow.

## Pre-flight

Before starting, check that `openspec` CLI is installed: run `which openspec`.
If not found, tell the user to install the OpenSpec CLI with the project's preferred package manager. For example, Bun users can run: `bun add -g @fission-ai/openspec@latest`.
If `openspec/` is missing, ask the user whether to initialize OpenSpec first. Do not create an index for a non-OpenSpec project without confirmation.

## Workflow

**Phase 1 — OpenSpec Propose** (load skill `openspec`):
Read the openspec skill. Check whether `openspec/INDEX.md` exists:
- if missing, plan an index bootstrap;
- if present, plan an index update or repair.

Use `/opsx:propose` workflow to create a dedicated change such as `bootstrap-openspec-traceability-index` or another clear traceability-index change id:
- proposal.md — why and what index work is needed
- design.md — index shape, seed sources, and source boundary
- specs/ — delta-specs for traceability/index behavior when needed
- tasks.md — implementation checklist

The proposal/design should state that unrelated feature work is out of scope.

Seed or repair the index from compact context only:
- current baseline specs under `openspec/specs/`;
- active changes under `openspec/changes/`;
- archived changes under `openspec/changes/archive/`;
- known related commits when available.

Do not copy full specs, full task lists, or full designs into `openspec/INDEX.md`.

After artifacts are created, call `trio_plan_review` with an OpenSpec review pack:
- `plan`: `""`
- `mode`: `"openspec"`
- `change_dir`: `"openspec/changes/<name>"`
- `review_depth`: `"critical_and_important"`

Fix Critical and selected Important issues. For confirmation review after Critical issues are fixed, call `trio_plan_review` again with `review_depth: "critical_only"`. If strict OpenSpec validation passes and the raw verdict is `APPROVABLE_WITH_NOTES`, `APPROVED`, or legacy `PASS`, stop plan review and present artifacts to the user for approval. If the raw verdict is `BLOCKED`, `NEEDS WORK`, or `UNKNOWN`, continue fixing or ask the user for guidance. Do NOT create a separate trio plan — OpenSpec tasks.md IS the plan.

**Phase 2 — Execute** (load skill `executor`):
After artifacts are approved, read the executor skill. Implement strictly according to tasks.md.
Update checkboxes factually: mark tasks complete only after the action happened.

Implementation should create or update `openspec/INDEX.md` only within the approved traceability-index source boundary. Leave review and post-review tasks pending until their results/actions are known.

**Phase 3 — Code Review**:
After implementation, call `trio_review`:
- `plan`: the content of tasks.md
- `files`: absolute paths of all created/modified source or documentation files, including `openspec/INDEX.md`
- `specs_dir`: path to the change's specs directory

If verdict is NEEDS WORK — fix the issues and call `trio_review` again.
If verdict is PASS — run `/opsx:archive` to merge delta-specs into main specs and archive the change.

Run post-review operations only after implementation review passes. Record archive, baseline validation, index update, commit, push, deploy, or release tasks as complete only after those actions happen. OpenSpec implementation commits should include `OpenSpec-Change: <change-id>` using the original active change id.

Report the final result to the user.
