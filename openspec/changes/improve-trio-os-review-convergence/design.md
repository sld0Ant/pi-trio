## Context

`pi-trio` provides a Pi extension (`extensions/trio-reviewer`) that registers `trio_plan_review` and `trio_review`. The current plan-review tool sends only a caller-provided plan string to a clean sub-agent using `plan-reviewer-prompt.md`. The current reviewer prompt has binary `PASS | NEEDS WORK` verdicts and says the reviewer should always find something to improve.

For OpenSpec work, `/trio-os` currently instructs the agent to call `trio_plan_review` with `tasks.md` content. That loses proposal/design/spec/baseline context and encourages repeated review loops, especially after Critical blockers are resolved.

## Goals / Non-Goals

### Goals

- Make plan review scope-aware through explicit review depth.
- Make OpenSpec plan review use a full artifact pack rather than `tasks.md` alone.
- Add a non-blocking approvable verdict so Critical-free plans can move to user approval.
- Preserve backward compatibility for existing `trio_plan_review({ plan })` calls.
- Keep code review strict: `trio_review` remains plan/spec compliance oriented and does not gain approvable-with-notes behavior in this slice.
- Keep the change self-contained inside the existing `trio-reviewer` extension, prompt files, README, changelog, and OpenSpec artifacts.

### Non-Goals

- No new planner/executor skills.
- No changes to `trio_review` code-review semantics beyond shared verdict parsing if needed.
- No dependency on OpenSpec internals beyond reading files and optionally running `openspec validate`.
- No TUI wizard or interactive review-depth picker.
- No persistent configuration file for review defaults in this slice.

## Decisions

### Review depth is an optional plan-review input

Extend `trio_plan_review` parameters with optional:

- `review_depth`: `critical_only | critical_and_important | exhaustive`
- `mode`: `generic | openspec`
- `change_dir`: OpenSpec change directory for pack building
- `include_baseline_specs`: default true for OpenSpec mode
- `review_scope`: optional caller-supplied scope override
- `stop_condition`: optional caller-supplied stop condition

Keep `plan` required for backward-compatible TypeBox schema simplicity in this slice. OpenSpec-mode callers that do not need extra notes must pass `plan: ""`. When `mode: "openspec"` and `change_dir` are provided, the tool builds an OpenSpec pack and includes the provided `plan` as additional caller notes if non-empty.

Default `review_depth` is `critical_and_important`. Confirmation reviews can pass `critical_only`.

### OpenSpec review pack is built by the extension

For `mode: "openspec"`, build a review pack only after resolving `change_dir` against the current working directory and verifying its canonical realpath is exactly one directory level below `<cwd>/openspec/changes/`. Reject ambiguous paths, symlinks, or paths whose canonical basename differs from the resolved directory name instead of silently validating a different change. Read only regular `.md` files whose canonical realpaths remain under the expected change directory or baseline specs root; skip symlinks and escaped paths and report them in a pack safety section.

Build the pack from:

- `proposal.md`
- `design.md`
- `tasks.md`
- all markdown files under `specs/`, sorted by relative path
- relevant baseline specs under `openspec/specs/<capability>/spec.md`, sorted by capability name, when discoverable from delta spec directory names
- `openspec validate <change> --strict` output when the CLI is available, where `<change>` is the verified canonical one-level child directory name under `openspec/changes/`

The pack includes explicit review scope and stop condition:

- Review scope: blockers, contradictions, source-boundary conflicts, OpenSpec traceability, and unsafe undefined behavior inside stated scope.
- Non-goals: future slices, unrelated architecture alternatives, docs-site integration unless in scope, exhaustive hardening outside accepted trade-offs.
- Stop condition: OpenSpec valid plus no Critical findings means approvable.

Pack building is best-effort. Missing core files are represented as `[MISSING]` in the pack so the reviewer can flag them; unreadable files as `[ERROR: ...]`; missing OpenSpec CLI as `NOT RUN`. The tool should not crash solely because optional pack components are unavailable. `openspec validate` must run without a shell, with cwd set to the repository root, a bounded timeout, and bounded stdout/stderr included in the pack.

### Verdicts separate blocking from approvable notes

Update plan reviewer prompt to support:

- `BLOCKED`: Critical findings exist.
- `APPROVABLE_WITH_NOTES`: no Critical findings, but Important/Suggestions exist.
- `APPROVED`: no Critical or Important findings.

For compatibility, `parseVerdict` maps `APPROVABLE_WITH_NOTES`, `APPROVED`, and legacy `PASS` to tool detail verdict `PASS`; `BLOCKED`, legacy `NEEDS WORK`, and unknown/missing verdicts map to `NEEDS WORK`. Include the parsed textual verdict in tool details as `rawVerdict`; if no known verdict is found, set `rawVerdict: "UNKNOWN"`.

`BLOCKED` means Critical plan findings exist or the reviewer cannot safely approve because required context is missing/invalid. `NEEDS WORK` remains supported only as a legacy textual verdict. trio-os should continue planning only when the raw verdict is `APPROVABLE_WITH_NOTES`, `APPROVED`, or legacy `PASS` and OpenSpec validation passed. `UNKNOWN`, `BLOCKED`, `NEEDS WORK`, or validation failure are not approvable.

### Prompt behavior should converge

Update `plan-reviewer-prompt.md` to remove the instruction to always find something. The reviewer should respect review depth:

- `critical_only`: report only Critical blockers; if none, return `APPROVABLE_WITH_NOTES` or `APPROVED`.
- `critical_and_important`: report Critical and Important; keep Suggestions minimal.
- `exhaustive`: full adversarial review.

Critical should be reserved for implementation blockers, contradictions, source-boundary conflicts, invalid traceability, or unsafe undefined behavior within the stated trust/scope. Important is for ambiguity or useful improvements that do not block implementation.

### OpenSpec profile should understand verification gates and accepted trade-offs

Update the built-in OpenSpec reviewer profile so it does not treat clearly separated verification gates as implementation tasks and respects accepted trade-offs/review scope. Implementation checklist items still need traceability to proposal/design/specs.

### `/trio-os` uses pack review and a stop rule

Update `prompts/trio-os.md` so Phase 1 calls `trio_plan_review` with:

- `mode: "openspec"`
- `change_dir: "openspec/changes/<name>"`
- `review_depth: "critical_and_important"`

After fixing Critical and selected Important issues, confirmation review should use `review_depth: "critical_only"`. If OpenSpec validation passes and the confirmation review raw verdict is `APPROVABLE_WITH_NOTES`, `APPROVED`, or legacy `PASS`, stop plan review and ask the user for implementation approval. If raw verdict is `BLOCKED`, `NEEDS WORK`, or `UNKNOWN`, continue fixing or ask for user guidance.

## Accepted Trade-offs

- `trio_plan_review` remains an LLM-based review tool; it cannot guarantee perfect OpenSpec parsing.
- Baseline spec inclusion is best-effort in this slice.
- `APPROVABLE_WITH_NOTES` maps to `PASS` in tool details to keep existing workflows moving; the raw verdict remains available.
- The first implementation can keep pack-builder helpers in `index.ts`; extraction to separate files is optional if the file becomes hard to maintain.

## Source Boundary

Allowed source changes:

- `extensions/trio-reviewer/index.ts`
- `extensions/trio-reviewer/plan-reviewer-prompt.md`
- `extensions/trio-reviewer/profiles/openspec.md`
- `prompts/trio-os.md`
- `README.md`
- `CHANGELOG.md`
- OpenSpec artifacts for this change

Forbidden changes:

- planner/executor skill behavior
- package installation metadata unless required by TypeScript compilation
- new runtime dependencies
- code-review prompt semantics beyond shared verdict parsing if necessary
- generated `node_modules` or lockfile churn unless dependency changes are explicitly introduced

## Rollback

Rollback is to revert this package change. Existing `trio_plan_review({ plan })` behavior remains backward compatible, so users who do not pass OpenSpec parameters can continue using the old style during rollout.
