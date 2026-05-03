# OpenSpec Index

Compact navigation for OpenSpec history. Use this file to find relevant prior context before opening full specs or archived artifacts.

## Traceability Rules

- Keep entries compact; do not duplicate full specs, full task lists, or full designs.
- Prefer loading context in levels: index card → relevant baseline spec → directly related archived proposal/design.
- Do not load archived `tasks.md` or full delta specs by default unless a concrete dependency or conflict requires them.
- Commits implementing OpenSpec work use the original active change id in a trailer: `OpenSpec-Change: <change-id>`.
- `Commit: pending` is acceptable when the final commit hash is not known at archive time; the trailer remains the primary git-to-spec link.

## Baseline Specs

### trio-workflow-process-contract
- Status: baseline
- Path: `openspec/specs/trio-workflow-process-contract/spec.md`
- Summary: Defines trio-os process-contract behavior, including executor source-boundary discipline, factual task status, implementation-review workflow gates, managed OpenSpec reviewer profile behavior, and OpenSpec-to-git traceability expectations.
- Related changes:
  - `implement-trio-workflow-process-contract`
  - `manage-openspec-review-profile`
  - `add-openspec-traceability-index`
- Key decisions:
  - OpenSpec artifacts are the implementation contract for trio-os work.
  - Post-review operations remain pending until after implementation review passes.
  - `openspec` reviewer profile is managed by review context.
  - OpenSpec implementation commits should use `OpenSpec-Change: <change-id>` trailers.

## Active Changes

### improve-trio-os-review-convergence
- Status: active-complete
- Capability:
  - trio-plan-review-convergence
- Summary: Adds review-depth controls, approvable plan-review verdicts, and OpenSpec review packs for `trio_plan_review`.
- Source boundary:
  - `extensions/trio-reviewer/index.ts`
  - `extensions/trio-reviewer/plan-reviewer-prompt.md`
  - `extensions/trio-reviewer/profiles/openspec.md`
  - `prompts/trio-os.md`
  - `README.md`
  - `CHANGELOG.md`
- Related changes:
  - `implement-trio-workflow-process-contract`
  - `manage-openspec-review-profile`
- Key decisions:
  - `trio_plan_review` supports `mode: "openspec"` and `review_depth`.
  - OpenSpec plan review receives proposal, design, tasks, delta specs, relevant baseline specs, and strict validation output.
  - `APPROVABLE_WITH_NOTES` and `APPROVED` map to compatibility `PASS` while preserving `rawVerdict`.
- Archive path: pending
- Commit: `6d2112a`

### add-openspec-traceability-index
- Status: active
- Capability:
  - openspec-traceability
  - trio-workflow-process-contract
- Summary: Adds this compact OpenSpec index, selective prior-context planning guidance, archive index updates, and `OpenSpec-Change` commit trailer workflow.
- Source boundary:
  - `prompts/trio-os.md`
  - `skills/executor/SKILL.md`
  - `README.md`
  - `CHANGELOG.md`
  - `openspec/INDEX.md`
- Related changes:
  - `implement-trio-workflow-process-contract`
  - `manage-openspec-review-profile`
  - `add-openspec-trace-status-cli`
  - `add-openspec-trace-index-cli`
  - `add-openspec-trace-review-pack-cli`
  - `add-openspec-trace-commit-cli`
  - `add-openspec-trace-task-runner-cli`
- Key decisions:
  - Planner should read this index first, then selectively load only relevant specs and archived proposal/design files.
  - Archive workflow should update this index with compact cards.
  - Commit trailer is the primary git-to-spec traceability link.
- Archive path: pending
- Commit: pending

### add-openspec-trace-status-cli
- Status: proposed-future
- Capability:
  - openspec-trace-cli-status
- Summary: Future read-only status command for OpenSpec change gates and phase readiness.
- Source boundary: pending implementation plan
- Related changes:
  - `add-openspec-traceability-index`
  - `add-openspec-trace-task-runner-cli`
- Key decisions:
  - Status is read-only.
  - If task helper is unavailable, task readiness is reported as warning/not checked.
- Archive path: pending
- Commit: pending

### add-openspec-trace-index-cli
- Status: proposed-future
- Capability:
  - openspec-trace-cli-index
- Summary: Future CLI commands to add, archive, and validate `openspec/INDEX.md` cards.
- Source boundary: pending implementation plan
- Related changes:
  - `add-openspec-traceability-index`
- Key decisions:
  - Depends on this index contract existing first.
  - Human-owned fields should be preserved where possible.
  - Compactness checks should be deterministic.
- Archive path: pending
- Commit: pending

### add-openspec-trace-review-pack-cli
- Status: proposed-future
- Capability:
  - openspec-trace-cli-review-pack
- Summary: Future CLI command to generate `trio_review` handoff metadata from changed files, specs, and validation context.
- Source boundary: pending implementation plan
- Related changes:
  - `add-openspec-traceability-index`
  - `add-openspec-trace-status-cli`
- Key decisions:
  - Default discovery includes staged, unstaged, and untracked files.
  - Deleted files are reported separately and not passed as reviewed file paths.
  - OpenSpec planning artifacts are excluded by default unless relevant to implementation evidence.
- Archive path: pending
- Commit: pending

### add-openspec-trace-commit-cli
- Status: proposed-future
- Capability:
  - openspec-trace-cli-commit
- Summary: Future CLI command to generate and validate commit messages with `OpenSpec-Change` trailers.
- Source boundary: pending implementation plan
- Related changes:
  - `add-openspec-traceability-index`
- Key decisions:
  - Trailer grammar is `OpenSpec-Change: <change-id>`.
  - Change ids use lowercase kebab-case.
  - Dated archive folder names should be rejected when original ids are inferable.
- Archive path: pending
- Commit: pending

### add-openspec-trace-task-runner-cli
- Status: proposed-future
- Capability:
  - openspec-trace-cli-tasks
- Summary: Future CLI command to run validation commands and mark task checkboxes complete only after command success.
- Source boundary: pending implementation plan
- Related changes:
  - `add-openspec-traceability-index`
  - `add-openspec-trace-status-cli`
- Key decisions:
  - Commands run as argv without shell interpolation by default.
  - Task ids are dot-separated numeric identifiers.
  - Failed commands do not mutate `tasks.md`.
- Archive path: pending
- Commit: pending

## Archived Changes

### implement-trio-workflow-process-contract
- Status: archived
- Capability:
  - trio-workflow-process-contract
- Summary: Adds executor/reviewer/task-template process contract for trio-os workflows.
- Source boundary:
  - `skills/executor/SKILL.md`
  - `extensions/trio-reviewer/reviewer-prompt.md`
  - `prompts/trio-os.md`
  - `README.md`
  - `CHANGELOG.md`
- Related changes:
  - `improve-trio-os-review-convergence`
  - `manage-openspec-review-profile`
- Key decisions:
  - Executors stop and amend OpenSpec before out-of-bound implementation.
  - Task checkboxes and verification artifacts record completed facts only.
  - Reviewers do not treat post-review archive/commit/push tasks as Critical before review approval.
  - Implementation reviewer severity is calibrated around Critical, Important, and Suggestion categories.
- Archive path: `openspec/changes/archive/2026-05-03-implement-trio-workflow-process-contract/`
- Commit: `b818ccb`

### manage-openspec-review-profile
- Status: archived
- Capability:
  - trio-workflow-process-contract
- Summary: Makes the built-in `openspec` reviewer profile managed by review context instead of user-selectable.
- Source boundary:
  - `extensions/trio-reviewer/index.ts`
  - `README.md`
  - `CHANGELOG.md`
- Related changes:
  - `improve-trio-os-review-convergence`
  - `implement-trio-workflow-process-contract`
- Key decisions:
  - `openspec` is hidden from the profile picker.
  - Generic reviews do not apply `openspec`.
  - OpenSpec plan reviews and code reviews with `specs_dir` apply `openspec` automatically.
  - Managed profiles are added per invocation and do not mutate session `activeProfiles`.
- Archive path: `openspec/changes/archive/2026-05-03-manage-openspec-review-profile/`
- Commit: `1e375b4`
