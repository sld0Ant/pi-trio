## Why

Reviewer profiles are currently selected from one shared picker and can include the built-in `openspec` profile. That makes OpenSpec behavior easy to apply accidentally to generic `/trio` reviews, while `/trio-os` still asks the user to choose a profile that should be implied by the OpenSpec review context.

The desired behavior is to keep the picker for user-selectable supplemental profiles, but make `openspec` a managed profile controlled by the reviewer extension:

- generic `/trio` reviews should not show or apply `openspec`;
- OpenSpec reviews should apply `openspec` automatically;
- the picker should still appear for additional user-selected profiles.

## What Changes

- Treat `openspec` as a managed reviewer profile, not a user-selectable profile.
- Hide `openspec` from the reviewer profile picker in all workflows.
- Ignore previously persisted `openspec` profile selections when restoring user-selected profiles.
- Automatically add `openspec` only for OpenSpec review contexts:
  - `trio_plan_review` with `mode: "openspec"`;
  - `trio_review` with `specs_dir`.
- Keep the picker for all selectable supplemental profiles, including `/trio-os` reviews.
- Keep generic `/trio` and direct generic review calls from applying `openspec`.
- Report the actually applied profiles in tool details and progress text, including managed `openspec` when it is applied.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `trio-workflow-process-contract`: Profile selection remains platform-neutral and separates managed workflow profiles from user-selected supplemental profiles.

## Impact

- Affected extension runtime: `extensions/trio-reviewer/index.ts`.
- Affected documentation: `README.md`, `CHANGELOG.md`.
- OpenSpec artifacts for this change.
- No changes to planner/executor skills are planned.
- No package dependency, lockfile, model/provider, or installation metadata changes are planned.

## Source Boundary

Allowed implementation changes before review:

- `extensions/trio-reviewer/index.ts`
- `README.md`
- `CHANGELOG.md`
- `openspec/changes/manage-openspec-review-profile/**`

Allowed post-review archive outputs after implementation review passes:

- `openspec/specs/trio-workflow-process-contract/spec.md`
- `openspec/changes/archive/**/manage-openspec-review-profile/**`
- deletion or movement of `openspec/changes/manage-openspec-review-profile/**` as performed by the OpenSpec archive workflow

Forbidden changes unless the OpenSpec change is amended and re-reviewed:

- reviewer prompt/profile markdown files
- planner/executor/OpenSpec skill behavior
- package metadata or lockfiles
- generated files
- unrelated prompt templates

## Rollback

Rollback is to revert the extension and documentation commit. Existing profile selection behavior will return to user-selectable `openspec` profile behavior.
