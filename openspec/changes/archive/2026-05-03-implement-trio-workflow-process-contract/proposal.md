## Why

The previous trio-os workflow audit identified repeatable process failures around executor source-boundary drift, incomplete review handoffs, factual task status, verification artifacts that predict future outcomes, and reviewer treatment of post-review workflow gates as implementation blockers. The audit is approved as a process baseline, but its recommendations are not yet reflected in the actual pi-trio executor, reviewer, or trio-os workflow instructions.

This change implements the approved audit contract in pi-trio prompts and skills so future trio-os runs have explicit operational guidance instead of relying on remembered process lessons.

## What Changes

- Update the executor skill with explicit trio-os process rules for:
  - source-boundary stop-and-amend behavior;
  - ambiguity/deviation handling;
  - factual task checkbox lifecycle;
  - complete review-pack construction;
  - validation summary handoff;
  - factual verification artifacts;
  - artifact-appropriate validation commands.
- Update the code reviewer prompt so implementation review understands:
  - post-review archive/baseline/commit/push/deploy tasks can be intentionally pending;
  - the current review invocation can satisfy a review task without recursive failure;
  - Critical/Important/Suggestion severity calibration;
  - incomplete review packs versus implementation defects;
  - bounded validation expectations.
- Update the trio-os workflow prompt so task planning and execution instructions separate implementation, validation, review handoff, and post-review operations.
- Update README/CHANGELOG with concise documentation of the process contract.

## Capabilities

### New Capabilities

- `trio-workflow-process-contract`: Executor/reviewer/task-template process contract for trio-os workflows.

### Modified Capabilities

None. This repository does not yet maintain baseline specs for trio workflow process contracts; this change introduces the first capability spec for that area.

## Impact

- Affected skill files: `skills/executor/SKILL.md`.
- Affected reviewer prompt: `extensions/trio-reviewer/reviewer-prompt.md`.
- Affected workflow prompt: `prompts/trio-os.md`.
- Affected documentation: `README.md`, `CHANGELOG.md`.
- OpenSpec artifacts for this change.
- No changes to extension runtime code are planned.
- No package dependency, lockfile, model/provider, or installation metadata changes are planned.

## Source Boundary

Allowed implementation changes before review:

- `skills/executor/SKILL.md`
- `extensions/trio-reviewer/reviewer-prompt.md`
- `prompts/trio-os.md`
- `README.md`
- `CHANGELOG.md`
- `openspec/changes/implement-trio-workflow-process-contract/**`

Allowed post-review archive changes after implementation review passes:

- `openspec/specs/trio-workflow-process-contract/spec.md`
- `openspec/changes/archive/**/implement-trio-workflow-process-contract/**`
- deletion or movement of `openspec/changes/implement-trio-workflow-process-contract/**` as performed by the OpenSpec archive workflow

Forbidden changes unless the OpenSpec change is amended and re-reviewed:

- `extensions/trio-reviewer/index.ts`
- planner skill behavior
- OpenSpec skill behavior
- package metadata or lockfiles
- generated files
- unrelated reviewer profiles

## Rollback

Rollback is to revert the prompt/skill/documentation commit. The change is instruction-only and does not alter runtime extension code or persisted user data.
