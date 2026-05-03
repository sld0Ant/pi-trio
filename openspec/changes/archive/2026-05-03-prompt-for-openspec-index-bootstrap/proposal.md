## Why

The traceability index workflow improves planner memory, but new or existing OpenSpec repositories may have `openspec/` without `openspec/INDEX.md`. The current trio-os prompt says to read the index when it exists, but it does not define the user experience when OpenSpec exists and the index is missing.

Automatically creating the index would be scope drift for unrelated feature work. Silently continuing without the index hides the missing traceability foundation. The workflow should ask the user what to do the first time it detects this state.

## Related Changes

- `add-openspec-traceability-index` — introduced `openspec/INDEX.md`, selective prior-context loading, and commit trailer traceability.
- `implement-trio-workflow-process-contract` — established factual tasks and post-review workflow gates.

## What Changes

- Update trio-os planning guidance so when `openspec/` exists but `openspec/INDEX.md` is missing, the agent asks the user to choose how to proceed.
- Offer explicit choices:
  - create the traceability index first as a separate OpenSpec/bootstrap change;
  - continue without the index for this task;
  - skip the index prompt for the current session.
- Add a dedicated prompt-template workflow for explicit index bootstrap, exposed as a Pi prompt command such as `/trio-os-make-index` and documented for users who ask for `/trio-os:make_index` style behavior.
- Ensure the agent does not create `openspec/INDEX.md` automatically unless the user chooses index creation or invokes the dedicated index-bootstrap workflow.
- Document fallback behavior for repositories that use OpenSpec without the traceability index.
- Update specs for OpenSpec traceability and trio-os workflow process behavior.

## Capabilities

### Modified Capabilities

- `openspec-traceability`: Defines missing-index fallback and user selection behavior.
- `trio-workflow-process-contract`: Defines how trio-os planning handles the missing-index prompt and separate bootstrap workflow.

## Impact

- Affected prompts: `prompts/trio-os.md`, `prompts/trio-os-make-index.md`.
- Affected docs: `README.md`, `CHANGELOG.md`.
- OpenSpec artifacts for this change.
- No extension runtime code changes are planned.
- No package dependency, lockfile, model/provider, or installation metadata changes are planned.

## Source Boundary

Allowed implementation changes before review:

- `prompts/trio-os.md`
- `prompts/trio-os-make-index.md`
- `README.md`
- `CHANGELOG.md`
- `openspec/INDEX.md`
- `openspec/changes/prompt-for-openspec-index-bootstrap/**`

Allowed post-review archive outputs after implementation review passes:

- `openspec/specs/openspec-traceability/spec.md`
- `openspec/specs/trio-workflow-process-contract/spec.md`
- `openspec/changes/archive/**/prompt-for-openspec-index-bootstrap/**`
- deletion or movement of `openspec/changes/prompt-for-openspec-index-bootstrap/**` as performed by the OpenSpec archive workflow

Forbidden changes unless the OpenSpec change is amended and re-reviewed:

- `extensions/trio-reviewer/**`
- `skills/**`
- package metadata or lockfiles
- generated files
- prompt templates other than `prompts/trio-os.md` and `prompts/trio-os-make-index.md`

## Rollback

Rollback is to revert the prompt/documentation/index commit. Repositories without `openspec/INDEX.md` would return to current behavior: continue normally when the index is absent unless the user explicitly asks for traceability setup.
