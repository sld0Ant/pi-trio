# OpenSpec Index

Compact navigation for OpenSpec history. Use this file to find relevant prior context before opening full specs or archived artifacts.

## Traceability Rules

- Keep entries compact; do not duplicate full specs, full task lists, or full designs.
- Prefer loading context in levels: index card → relevant baseline spec → directly related archived proposal/design.
- Do not load archived `tasks.md` or full delta specs by default unless a concrete dependency or conflict requires them.
- Commits implementing OpenSpec work use the original active change id in a trailer: `OpenSpec-Change: <change-id>`.
- `Commit: pending` is acceptable when the final commit hash is not known at archive time; the trailer remains the primary git-to-spec link.

## Baseline Specs

### openspec-traceability
- Status: baseline
- Path: `openspec/specs/openspec-traceability/spec.md`
- Summary: Defines the compact OpenSpec index, selective prior-context loading, archive index updates, commit trailer traceability, missing-index prompt behavior, and make-index repair behavior.
- Related changes:
  - `add-openspec-traceability-index`
  - `prompt-for-openspec-index-bootstrap`
  - `repair-openspec-traceability-index`
- Key decisions:
  - `openspec/INDEX.md` is a navigation aid and must stay compact.
  - Missing index setup requires user selection or explicit make-index workflow invocation.
  - Unknown commit hashes may remain `pending` when commit trailers provide the primary link.

### openspec-trace-cli-status
- Status: baseline
- Path: `openspec/specs/openspec-trace-cli-status/spec.md`
- Summary: Defines the read-only `openspec-trace status` command for OpenSpec change gate summaries, phase readiness, artifact checks, validation state, source-boundary drift, and JSON output.
- Related changes:
  - `add-openspec-trace-status-cli`
  - `add-openspec-trace-task-runner-cli`
  - `add-openspec-trace-commit-cli`
- Key decisions:
  - Status is read-only and reports failures through output and exit codes.
  - Changed files come from staged, unstaged, and untracked working-tree paths.
  - JSON output uses a stable v1 shape with per-check states.

### trio-reviewer-diagnostics
- Status: baseline
- Path: `openspec/specs/trio-reviewer-diagnostics/spec.md`
- Summary: Defines local reviewer diagnostics for `trio_plan_review` and `trio_review`, including safe timing logs, private permissions, raw logging safeguards, diagnostic details, and progress/fallback behavior.
- Related changes:
  - `add-trio-reviewer-diagnostics`
  - `improve-trio-os-review-convergence`
  - `manage-openspec-review-profile`
- Key decisions:
  - Default logs are metadata-only and local under `/tmp/pi-trio-review-logs` unless `TRIO_REVIEW_LOG_DIR` is set.
  - Raw prompt/model capture requires `TRIO_REVIEW_LOG_RAW=1` and is byte-bounded with truncation metadata.
  - Logging failures become diagnostic warnings and do not fail reviews.

### trio-workflow-process-contract
- Status: baseline
- Path: `openspec/specs/trio-workflow-process-contract/spec.md`
- Summary: Defines trio-os process-contract behavior, including executor source-boundary discipline, factual task status, implementation-review workflow gates, managed OpenSpec reviewer profile behavior, and OpenSpec-to-git traceability expectations.
- Related changes:
  - `implement-trio-workflow-process-contract`
  - `manage-openspec-review-profile`
  - `add-openspec-traceability-index`
  - `prompt-for-openspec-index-bootstrap`
- Key decisions:
  - OpenSpec artifacts are the implementation contract for trio-os work.
  - Post-review operations remain pending until after implementation review passes.
  - `openspec` reviewer profile is managed by review context.
  - OpenSpec implementation commits should use `OpenSpec-Change: <change-id>` trailers.

## Active Changes



## Archived Changes

### add-openspec-trace-commit-cli
- Status: archived
- Capability:
  - openspec-trace-cli-commit
- Summary: Adds `openspec-trace` commit message generation and validation for `OpenSpec-Change` trailers.
- Source boundary:
  - `scripts/openspec-trace.ts`
  - `package.json`
  - `README.md`
  - `CHANGELOG.md`
- Related changes:
  - `add-openspec-traceability-index`
  - `repair-openspec-traceability-index`
- Key decisions:
  - `commit-msg` prints caller-provided titles and ordered trailers.
  - `check-commit-msg` validates trailer syntax, duplicates, expected changes, unknown changes, and dated archive folder names.
  - The helper is a local CLI/script wrapper, not a mandatory git hook.
- Archive path: `openspec/changes/archive/2026-05-03-add-openspec-trace-commit-cli/`
- Commit: pending

### add-openspec-trace-index-cli
- Status: archived
- Capability:
  - openspec-trace-cli-index
- Summary: Future CLI commands to add, archive, and validate `openspec/INDEX.md` cards.
- Source boundary: pending
- Related changes:
  - `add-openspec-traceability-index`
  - `repair-openspec-traceability-index`
- Key decisions:
  - Depends on this index contract existing first.
  - Human-owned fields should be preserved where possible.
  - Compactness checks should be deterministic.
- Archive path: `openspec/changes/archive/2026-05-03-add-openspec-trace-index-cli/`
- Commit: pending

### add-openspec-trace-review-pack-cli
- Status: archived
- Capability:
  - openspec-trace-cli-review-pack
- Summary: Future CLI command to generate `trio_review` handoff metadata from changed files, specs, and validation context.
- Source boundary: pending
- Related changes:
  - `add-openspec-traceability-index`
  - `add-openspec-trace-status-cli`
- Key decisions:
  - Default discovery includes staged, unstaged, and untracked files.
  - Deleted files are reported separately and not passed as reviewed file paths.
  - OpenSpec planning artifacts are excluded by default unless relevant to implementation evidence.
- Archive path: `openspec/changes/archive/2026-05-03-add-openspec-trace-review-pack-cli/`
- Commit: pending

### add-openspec-trace-status-cli
- Status: archived
- Capability:
  - openspec-trace-cli-status
- Summary: Adds `openspec-trace status` for read-only gate summaries across artifacts, validation, source-boundary drift, task readiness, archive state, and commit readiness.
- Source boundary:
  - `scripts/openspec-trace.ts`
  - `README.md`
  - `CHANGELOG.md`
- Related changes:
  - `add-openspec-traceability-index`
  - `add-openspec-trace-task-runner-cli`
  - `add-openspec-trace-commit-cli`
- Key decisions:
  - Phase gates are explicit for `pre-review`, `post-review`, `archive`, and `commit`.
  - JSON output uses a stable v1 schema and the same exit codes as human output.
  - Source-boundary drift uses working-tree staged, unstaged, and untracked paths only.
  - Missing or partial git discovery reports `not_checked` instead of false pass.
- Archive path: `openspec/changes/archive/2026-05-03-add-openspec-trace-status-cli/`
- Commit: pending

### add-openspec-trace-task-runner-cli
- Status: archived
- Capability:
  - openspec-trace-cli-tasks
- Summary: Adds `openspec-trace` task helpers for command-backed factual checkbox updates, explicit task marking, and phase readiness checks.
- Source boundary:
  - `scripts/openspec-trace.ts`
  - `README.md`
  - `CHANGELOG.md`
- Related changes:
  - `add-openspec-traceability-index`
  - `add-openspec-trace-commit-cli`
  - `add-openspec-trace-status-cli`
- Key decisions:
  - Commands run as argv without shell interpolation by default.
  - Task ids are exact dot-separated numeric identifiers; prefix matches do not count.
  - Failed commands propagate the command exit status and do not mutate `tasks.md`.
  - `tasks check` reports `pre-review` and `post-review` readiness using heading-based phase heuristics.
- Archive path: `openspec/changes/archive/2026-05-03-add-openspec-trace-task-runner-cli/`
- Commit: pending

### add-openspec-traceability-index
- Status: archived
- Capability:
  - openspec-traceability
  - trio-workflow-process-contract
- Summary: Adds the compact OpenSpec index, selective prior-context planning guidance, archive index updates, and `OpenSpec-Change` commit trailer workflow.
- Source boundary:
  - `prompts/trio-os.md`
  - `skills/executor/SKILL.md`
  - `README.md`
  - `CHANGELOG.md`
  - `openspec/INDEX.md`
- Related changes:
  - `implement-trio-workflow-process-contract`
  - `manage-openspec-review-profile`
  - `prompt-for-openspec-index-bootstrap`
- Key decisions:
  - Planner reads the index first, then selectively loads only relevant specs and archived proposal/design files.
  - Archive workflow updates the index with compact cards.
  - Commit trailer is the primary git-to-spec traceability link.
- Archive path: `openspec/changes/archive/2026-05-03-add-openspec-traceability-index/`
- Commit: `a7311b4`

### add-trio-reviewer-diagnostics
- Status: archived
- Capability:
  - trio-reviewer-diagnostics
- Summary: Adds local timing diagnostics, progress updates, safe JSON logs, and diagnostic detail fields for trio reviewer tools.
- Source boundary:
  - `extensions/trio-reviewer/index.ts`
  - `README.md`
  - `CHANGELOG.md`
- Related changes:
  - `improve-trio-os-review-convergence`
  - `manage-openspec-review-profile`
  - `implement-trio-workflow-process-contract`
- Key decisions:
  - Diagnostics use local logs with private permissions where supported and unique timestamp/UUID filenames.
  - Default logs omit raw prompts, file contents, review packs, and model responses.
  - Raw logs are opt-in via `TRIO_REVIEW_LOG_RAW=1`, limited by UTF-8 bytes, and marked with truncation metadata.
  - Tool details include `durationMs`, `logPath`, and `diagnosticWarnings` while preserving existing verdict/profile fields.
- Archive path: `openspec/changes/archive/2026-05-03-add-trio-reviewer-diagnostics/`
- Commit: pending

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

### improve-trio-os-review-convergence
- Status: archived
- Capability:
  - trio-plan-review-convergence
- Summary: Adds review-depth controls, approvable plan-review verdicts, and OpenSpec review packs for `trio_plan_review`.
- Source boundary:
  - `CHANGELOG.md`
  - `README.md`
  - `extensions/trio-reviewer/index.ts`
  - `extensions/trio-reviewer/plan-reviewer-prompt.md`
  - `extensions/trio-reviewer/profiles/openspec.md`
  - `prompts/trio-os.md`
- Related changes:
  - `implement-trio-workflow-process-contract`
  - `manage-openspec-review-profile`
- Key decisions:
  - `trio_plan_review` supports `mode: "openspec"` and `review_depth`.
  - OpenSpec plan review receives proposal, design, tasks, delta specs, relevant baseline specs, and strict validation output.
  - `APPROVABLE_WITH_NOTES` and `APPROVED` map to compatibility `PASS` while preserving `rawVerdict`.
- Archive path: `openspec/changes/archive/2026-05-03-improve-trio-os-review-convergence/`
- Commit: pending

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

### prompt-for-openspec-index-bootstrap
- Status: archived
- Capability:
  - openspec-traceability
  - trio-workflow-process-contract
- Summary: Adds missing-index user choice behavior and the canonical `/trio-os-make-index` prompt workflow for explicit traceability index bootstrap or repair.
- Source boundary:
  - `prompts/trio-os.md`
  - `prompts/trio-os-make-index.md`
  - `README.md`
  - `CHANGELOG.md`
  - `openspec/INDEX.md`
- Related changes:
  - `add-openspec-traceability-index`
  - `implement-trio-workflow-process-contract`
- Key decisions:
  - Missing traceability index prompts the user before proposal creation.
  - Non-interactive, ambiguous, or no-selection fallback continues without index and does not create it.
  - `/trio-os-make-index` is the canonical prompt-template command; `/trio-os:make_index` is intent wording, not a runtime alias.
  - Make-index workflow uses normal OpenSpec and review gates and does not mix unrelated feature work.
- Archive path: `openspec/changes/archive/2026-05-03-prompt-for-openspec-index-bootstrap/`
- Commit: `e8c7334`

### repair-openspec-traceability-index
- Status: archived
- Capability:
  - openspec-traceability
- Summary: Repairs this index so it reflects currently present baseline specs, active changes, archived changes, and verified known commits.
- Source boundary:
  - `openspec/INDEX.md`
- Related changes:
  - `add-openspec-traceability-index`
  - `prompt-for-openspec-index-bootstrap`
- Key decisions:
  - Repair uses current OpenSpec tree as source of truth.
  - Known commits are verified before use; unknown commits remain pending.
  - Moving archived/completed changes means index classification/card placement only before archive.
- Archive path: `openspec/changes/archive/2026-05-03-repair-openspec-traceability-index/`
- Commit: pending

### require-trace-task-helper-updates
- Status: archived
- Capability:
  - trio-workflow-process-contract
- Summary: Requires helper-backed OpenSpec task checkbox updates when `openspec-trace` is available and keeps reviewers read-only.
- Source boundary:
  - `CHANGELOG.md`
  - `README.md`
  - `extensions/trio-reviewer/reviewer-prompt.md`
  - `openspec/INDEX.md`
  - `openspec/changes/archive/**/require-trace-task-helper-updates/**`
  - `openspec/changes/require-trace-task-helper-updates/**`
  - `openspec/specs/trio-workflow-process-contract/spec.md`
  - `prompts/trio-os.md`
  - `skills/executor/SKILL.md`
- Related changes:
  - `add-openspec-trace-task-runner-cli`
  - `implement-trio-workflow-process-contract`
  - `add-openspec-trace-review-pack-cli`
- Key decisions:
  - Executors use `openspec-trace run` or `tasks mark` for factual checkbox updates when safe.
  - Manual checkbox edits require a recorded exception reason.
  - Reviewers remain read-only and may suggest exact task-helper commands after approving review results.
- Archive path: `openspec/changes/archive/2026-05-03-require-trace-task-helper-updates/`
- Commit: pending
