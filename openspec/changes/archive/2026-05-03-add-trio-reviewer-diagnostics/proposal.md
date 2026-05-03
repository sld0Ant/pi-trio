## Why

`trio_plan_review` and `trio_review` can take a long time, especially for OpenSpec review packs with many files and managed profiles. Today users see only the final verdict and cannot tell whether time was spent reading files, building OpenSpec packs, running validation, applying profiles, or waiting on the sub-agent/model call.

We need lightweight reviewer diagnostics that make long review calls observable without logging secrets or full prompts by default.

## Related Changes

- `improve-trio-os-review-convergence` — introduced OpenSpec review packs, review depth, raw verdicts, and OpenSpec validation in plan review.
- `manage-openspec-review-profile` — introduced managed invocation profiles and `details.profiles` expectations.
- `implement-trio-workflow-process-contract` — established complete review-pack evidence and workflow gate expectations.

## What Changes

- Add timing/progress instrumentation around review-tool phases.
- Add structured diagnostic log files for review invocations.
- Return `durationMs`, `logPath`, and applied profiles in tool details where possible.
- Keep raw prompts, full file contents, and full model responses out of logs by default.
- Add opt-in raw logging for local debugging only.

## Capabilities

### New Capabilities

- `trio-reviewer-diagnostics`: Observable review execution with safe timing logs, progress events, and optional raw debug capture.

## Impact

- Affected extension code: `extensions/trio-reviewer/index.ts`.
- Affected documentation: `README.md`, `CHANGELOG.md`.
- Affected OpenSpec index during post-review archive/update.
- No new runtime dependencies are planned.
- No changes to reviewer strictness, model selection, profile semantics, prompt content, or OpenSpec pack semantics are planned except instrumentation.

## Source Boundary

Allowed implementation changes before review:

- `extensions/trio-reviewer/index.ts`
- `README.md`
- `CHANGELOG.md`
- `openspec/changes/add-trio-reviewer-diagnostics/**`

Allowed post-review changes after implementation review passes:

- `openspec/INDEX.md`
- `openspec/specs/trio-reviewer-diagnostics/spec.md`
- `openspec/changes/archive/**/add-trio-reviewer-diagnostics/**`
- removal or movement of `openspec/changes/add-trio-reviewer-diagnostics/**` by OpenSpec archive workflow

Forbidden without amending this OpenSpec change:

- planner/executor skill behavior
- reviewer prompt semantics
- profile content
- package metadata or lockfiles
- new dependencies
- generated `node_modules`

## Rollback

Rollback is to revert the diagnostics implementation commit. Review tools continue to run without diagnostics, preserving current behavior.
