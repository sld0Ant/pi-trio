## 1. Reviewer Prompt and Verdict Semantics

- [x] 1.1 Update `extensions/trio-reviewer/plan-reviewer-prompt.md` to support `BLOCKED`, `APPROVABLE_WITH_NOTES`, and `APPROVED` verdicts.
- [x] 1.2 Add review-depth rules to the plan reviewer prompt for `critical_only`, `critical_and_important`, and `exhaustive`.
- [x] 1.3 Remove the instruction that the reviewer must always find something to improve. Replace it with a rule that Critical-free reviews may be approvable.
- [x] 1.4 Define Critical as implementation blockers, contradictions, source-boundary conflicts, invalid OpenSpec traceability, or unsafe undefined behavior inside stated scope.
- [x] 1.5 Update verdict parsing in `extensions/trio-reviewer/index.ts` so `APPROVABLE_WITH_NOTES`, `APPROVED`, and legacy `PASS` map to tool detail verdict `PASS`, while `BLOCKED`, legacy `NEEDS WORK`, and unknown/missing verdicts map to `NEEDS WORK`. Include parsed textual verdict in tool details as `rawVerdict`, using `UNKNOWN` when no known verdict is found.
- [x] 1.6 Define `BLOCKED` in the plan reviewer prompt as Critical findings present or required context missing/invalid. `NEEDS WORK` remains legacy-compatible wording, not the preferred new blocking verdict.

## 2. Plan Review Tool Parameters

- [x] 2.1 Extend `trio_plan_review` parameters with optional `review_depth`, `mode`, `change_dir`, `include_baseline_specs`, `review_scope`, and `stop_condition`.
- [x] 2.2 Keep existing direct calls backward compatible by preserving a required `plan` string parameter in this slice.
- [x] 2.3 Default `review_depth` to `critical_and_important`, `mode` to `generic`, and `include_baseline_specs` to true for OpenSpec mode.
- [x] 2.4 Validate enum-like parameter values through TypeBox literals so invalid review depths or modes are rejected by tool schema.

## 3. OpenSpec Review Pack Builder

- [x] 3.1 Add helper logic in `extensions/trio-reviewer/index.ts` to build an OpenSpec review pack when `mode: "openspec"` and `change_dir` are provided.
- [x] 3.2 Resolve `change_dir` against the current working directory, require its canonical realpath to be exactly one directory level below `<cwd>/openspec/changes/`, and reject ambiguous paths, symlinks, or paths whose canonical basename differs from the resolved directory name. Skip/report files whose canonical paths escape the expected change directory or baseline specs root.
- [x] 3.3 Include `proposal.md`, `design.md`, `tasks.md`, and all regular markdown files under `specs/` in deterministic relative-path order. Missing core artifacts are represented as `[MISSING]` in the pack rather than crashing the tool.
- [x] 3.4 Include caller-provided `plan` as an additional notes section when it is non-empty; OpenSpec callers without notes must pass `plan: ""` while `plan` remains schema-required.
- [x] 3.5 Include explicit review settings: mode, review depth, stop condition, review scope, and non-goals. Include this stop truth table: OpenSpec validation pass plus raw verdict `APPROVABLE_WITH_NOTES`, `APPROVED`, or legacy `PASS` is approvable; validation failure, `BLOCKED`, `NEEDS WORK`, or `UNKNOWN` is not approvable; Critical count is represented by reviewer verdict and should not be guessed by string-scanning sections.
- [x] 3.6 Include relevant baseline specs from `openspec/specs/<capability>/spec.md` when discoverable from delta spec directory names under `specs/<capability>/`. Missing baseline specs must be reported in the pack rather than crashing the tool. Baseline specs are sorted by capability name.
- [x] 3.7 Run `openspec validate <change> --strict`, where `<change>` is the verified canonical one-level child directory name under `openspec/changes/`, with a bounded child process when the CLI is available. Run without a shell, with cwd set to the repository root, a timeout, and bounded stdout/stderr captured in the pack. If the CLI is missing or validation cannot run, include a `NOT RUN` or error section and continue review.
- [x] 3.8 Make pack building best-effort and deterministic: missing files are marked `[MISSING]`, unreadable files are marked `[ERROR: ...]`, and directory traversal output is sorted.
- [x] 3.9 Do not add new runtime dependencies for pack building; use Node built-ins and existing package dependencies.

## 4. trio-os Workflow Prompt

- [x] 4.1 Update `prompts/trio-os.md` so Phase 1 calls `trio_plan_review` with `plan: ""`, `mode: "openspec"`, `change_dir: "openspec/changes/<name>"`, and `review_depth: "critical_and_important"` instead of passing only `tasks.md`.
- [x] 4.2 Add confirmation-review instructions: after Critical issues are fixed, call `trio_plan_review` with `review_depth: "critical_only"`.
- [x] 4.3 Add stop-condition instructions: if strict OpenSpec validation passes and the confirmation review raw verdict is `APPROVABLE_WITH_NOTES`, `APPROVED`, or legacy `PASS`, stop plan review and present artifacts to the user for implementation approval. If raw verdict is `BLOCKED`, `NEEDS WORK`, or `UNKNOWN`, continue fixing or ask for user guidance.
- [x] 4.4 Keep executor and code-review phases unchanged except for consuming the approved `tasks.md` after plan approval.

## 5. OpenSpec Reviewer Profile

- [x] 5.1 Update `extensions/trio-reviewer/profiles/openspec.md` to respect `review_depth` and the OpenSpec review pack stop condition.
- [x] 5.2 Clarify that clearly separated verification gates are not implementation checklist tasks, while implementation checklist items still need spec/design traceability.
- [x] 5.3 Clarify that accepted trade-offs and explicitly scoped non-goals should not be raised as Critical unless they contradict requirements or source boundary.
- [x] 5.4 Keep RFC 2119 and OpenSpec compliance checks strict for implementation/code review contexts.

## 6. Documentation

- [x] 6.1 Update `README.md` with review depths, OpenSpec review pack behavior, approvable verdicts, and the trio-os stop condition.
- [x] 6.2 Document backward-compatible direct `trio_plan_review({ plan })` usage.
- [x] 6.3 Add examples for OpenSpec plan review calls with `plan: ""`, `mode: "openspec"`, and `review_depth`.
- [x] 6.4 Update `CHANGELOG.md` with the new review-depth, OpenSpec pack, and approvable-verdict behavior.

## 7. Verification Gates

The following are validation gates, not implementation tasks.

- Run TypeScript/package checks available in the repository, using Bun where possible.
- Run or manually smoke-test `trio_plan_review` in generic mode with only `plan`.
- Run or manually smoke-test `trio_plan_review` in OpenSpec mode against this change directory.
- Confirm OpenSpec validation for this change passes.
- Confirm changed files stay within the source boundary from `design.md`.
