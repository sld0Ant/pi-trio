---
description: "Trio + OpenSpec: spec-driven planning → Executor → independent Reviewer with specs verification"
---
Work in **trio-os** mode for this task: $@

This workflow integrates OpenSpec with trio. OpenSpec handles planning (specs as source of truth), trio handles execution and review.

## Pre-flight

Before starting, check that `openspec` CLI is installed: run `which openspec`.
If not found, tell the user to install the OpenSpec CLI with the project's preferred package manager. For example, Bun users can run: `bun add -g @fission-ai/openspec@latest`.
Then initialize in the project if needed: `openspec init --tools pi`

## Workflow

**Phase 1 — OpenSpec Propose** (load skill `openspec`):
Read the openspec skill. If `openspec/INDEX.md` exists, read it before creating a new proposal. Use it as a compact navigation aid for prior changes and decisions.

If `openspec/` exists but `openspec/INDEX.md` is missing, ask the user how to proceed before creating the proposal:
1. **Create traceability index first** — pause the current feature planning flow, start a separate OpenSpec change for traceability index bootstrap, and return to the original task after that workflow completes.
2. **Continue without index for this task** — proceed with normal OpenSpec discovery for this task only and do not create `openspec/INDEX.md`.
3. **Skip index prompt for this session** — proceed without the index and do not ask again in the current conversational/session context; do not write repository config or persistent settings.

If the user cannot be asked, does not choose, or gives an ambiguous answer, continue without the index for the current task, note that traceability index setup was not selected, and do not create `openspec/INDEX.md`. Never create `openspec/INDEX.md` automatically unless the user chooses index creation, invokes `/trio-os-make-index`, or traceability/index setup is already in the approved scope.

Load prior context selectively:
- read relevant baseline specs when capabilities match the task scope or index cards;
- if `openspec/roadmaps/` exists, read only roadmap specs relevant to the user request, capability names, source boundaries, explicit index links, or concrete dependency/conflict signals;
- read archived `proposal.md` and `design.md` only for directly related prior changes;
- do not read archived `tasks.md`, full delta specs, all roadmap specs, or all archived changes by default.

Treat prior context as related when it shares a capability, is explicitly linked by the index, touches the same source boundary or workflow behavior, is named by the user request, is referenced by a relevant roadmap, or creates a concrete dependency/conflict.

Roadmap specs in `openspec/roadmaps/*.md` are optional upper-level planning context. Use them to understand direction, sequencing, dependencies, non-goals, and candidate slices, but do not treat roadmap items as implemented behavior or approved scope until a normal OpenSpec change promotes them into proposal/design/delta specs/tasks. When a proposal cites roadmap context, ensure the proposed scope is consistent with the specific roadmap decision being used and keep unrelated roadmap milestones deferred.

Use `/opsx:propose` workflow to create the change:
- proposal.md — why and what
- design.md — technical approach
- specs/ — delta-specs with requirements and scenarios
- tasks.md — implementation checklist

When prior context is relevant, record it compactly in the new artifacts using sections such as `Related Changes` in `proposal.md`, `Prior Decisions Used` in `design.md`, or `Roadmap Context` when a roadmap influenced scope, sequencing, or non-goals.

Ask for `tasks.md` sections that distinguish implementation, focused validation, review handoff, and post-review operations when applicable. Post-review operations include updating `openspec/INDEX.md`, archive, baseline validation, commit, push, deploy, or release steps that must happen only after implementation review passes.

After artifacts are created, call `trio_plan_review` with an OpenSpec review pack, not tasks.md alone:
- `plan`: `""`
- `mode`: `"openspec"`
- `change_dir`: `"openspec/changes/<name>"`
- `review_depth`: `"critical_and_important"`

Fix Critical and selected Important issues. For confirmation review after Critical issues are fixed, call `trio_plan_review` again with `review_depth: "critical_only"`. If strict OpenSpec validation passes and the raw verdict is `APPROVABLE_WITH_NOTES`, `APPROVED`, or legacy `PASS`, stop plan review and present artifacts to the user for approval. If the raw verdict is `BLOCKED`, `NEEDS WORK`, or `UNKNOWN`, continue fixing or ask the user for guidance. Do NOT create a separate trio plan — OpenSpec tasks.md IS the plan.

**Phase 2 — Execute** (load skill `executor`):
After artifacts are approved, read the executor skill. Implement strictly according to tasks.md.
Update checkboxes in tasks.md as you complete each task: `[ ]` → `[x]`. Checkboxes are factual: mark tasks complete only after the action happened. When `scripts/openspec-trace.ts` is available and safe to run, use `bun scripts/openspec-trace.ts run <change-id> --task <task-id> -- <command...>` for command-backed tasks and `bun scripts/openspec-trace.ts tasks mark <change-id> --task <task-id>` for explicit factual updates instead of manually editing checkboxes. If the helper is unavailable, broken, or currently being modified in a way that prevents safe use, record the manual-edit exception reason. Leave review tasks and post-review operations pending until their results/actions are known.
Track all created/modified files and relevant verification/documentation artifacts. Exclude OpenSpec planning artifacts from the implementation file list unless they are verification artifacts or were modified during implementation.

**Phase 3 — Code Review**:
After implementation, call the `trio_review` tool:
- `plan`: the content of tasks.md
- `files`: absolute paths of all created/modified source files
- `specs_dir`: path to the change's specs directory (e.g. `openspec/changes/<name>/specs/`)

If verdict is NEEDS WORK — fix the issues and call `trio_review` again.
If verdict is PASS — run `/opsx:archive` to merge delta-specs into main specs and archive the change.

Run post-review operations only after implementation review passes. Update `openspec/INDEX.md` after archive when the repository uses the traceability index. Record archive, baseline validation, index update, commit, push, deploy, or release tasks as complete only after those actions happen, using the task helper when available and safe. OpenSpec implementation commits should include `OpenSpec-Change: <change-id>` using the original active change id.

Report the final result to the user.
