## Why

Plan review in trio-os can drift into repeated NEEDS WORK loops after implementation blockers are resolved because the reviewer receives too little OpenSpec context, has only binary PASS/NEEDS WORK verdicts, and is instructed to always find something to improve. This change makes plan review scope-aware, OpenSpec-aware, and convergent without weakening implementation/code review strictness.

## What Changes

- Add review depth controls for plan review:
  - `critical_only`
  - `critical_and_important`
  - `exhaustive`
- Add approvable non-blocking verdict support:
  - `BLOCKED`
  - `APPROVABLE_WITH_NOTES`
  - `APPROVED`
- Teach `trio_plan_review` to build an OpenSpec review pack from a change directory instead of reviewing `tasks.md` alone.
- Include proposal, design, delta specs, relevant baseline specs when available, tasks, review scope, accepted stop condition, and strict validation result in OpenSpec review packs.
- Update `/trio-os` workflow to use full OpenSpec review packs and stop plan review after strict validation passes and no Critical findings remain.
- Update OpenSpec reviewer guidance so verification gates, accepted trade-offs, documentation scope, and source boundaries do not trigger endless non-blocking NEEDS WORK loops.
- Keep existing direct plan-review calls backward compatible.

## Capabilities

### New Capabilities
- `trio-plan-review-convergence`: Review-depth controls, approvable verdicts, OpenSpec review packs, and trio-os stop conditions for plan review convergence.

### Modified Capabilities

None. This repository does not currently maintain baseline OpenSpec specs; this change introduces the first capability spec for trio plan review convergence.

## Impact

- Affected extension code: `extensions/trio-reviewer/index.ts` and reviewer prompt/profile files.
- Affected workflow prompt: `prompts/trio-os.md`.
- Affected documentation: `README.md` and `CHANGELOG.md`.
- No changes to executor behavior, code-review strictness, model/provider setup, package installation metadata, or skills are required for the MVP.
- Existing `trio_plan_review({ plan })` and `trio_review(...)` usage remains supported.
