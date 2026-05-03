## Why

`openspec/INDEX.md` already exists, but recent traceability work changed the local OpenSpec state. The index now needs a focused repair/update pass so it reflects currently present baseline specs, active changes, archived changes, and known commits without copying full artifacts.

This is exactly the dedicated make-index workflow scope: maintain the traceability index only, with no unrelated feature work.

## Related Changes

- `add-openspec-traceability-index` — introduced `openspec/INDEX.md` and the compact index contract.
- `prompt-for-openspec-index-bootstrap` — introduced `/trio-os-make-index` and missing-index prompt behavior.
- `add-openspec-trace-*-cli` changes — active future automation specs that should remain compactly represented in the index.

## What Changes

- Repair `openspec/INDEX.md` so it matches current OpenSpec state.
- Move archived/completed traceability changes out of active status when appropriate.
- Ensure baseline specs under `openspec/specs/` are represented compactly.
- Ensure active future automation changes are represented compactly.
- Ensure archived changes have archive paths and known commits or `pending` when a final hash is not known.
- Avoid copying full specs, full task lists, or full designs into the index.

## Capabilities

### Modified Capabilities

- `openspec-traceability`: Exercises and clarifies index repair/update behavior for an existing `openspec/INDEX.md`.

## Impact

- Affected artifact: `openspec/INDEX.md`.
- OpenSpec artifacts for this change.
- No prompt, skill, extension runtime, package metadata, lockfile, generated file, or unrelated documentation changes are planned.

## Source Boundary

Allowed implementation changes before review:

- `openspec/INDEX.md`
- `openspec/changes/repair-openspec-traceability-index/**`

Allowed post-review archive outputs after implementation review passes:

- `openspec/specs/openspec-traceability/spec.md`
- `openspec/changes/archive/**/repair-openspec-traceability-index/**`
- deletion or movement of `openspec/changes/repair-openspec-traceability-index/**` as performed by the OpenSpec archive workflow

Forbidden changes unless the OpenSpec change is amended and re-reviewed:

- `prompts/**`
- `skills/**`
- `extensions/**`
- `README.md`
- `CHANGELOG.md`
- package metadata or lockfiles
- generated files

## Rollback

Rollback is to revert the index repair commit. The underlying OpenSpec specs and archived artifacts remain unchanged.
