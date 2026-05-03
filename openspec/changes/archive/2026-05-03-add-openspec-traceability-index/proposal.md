## Why

OpenSpec changes are the source of truth for trio-os work, but git history and future planning context do not currently make that relationship easy to follow. Commit subjects describe the product or workflow change, while the OpenSpec change id often disappears unless a reader knows which archived folder to inspect. Future planners also need awareness of prior specs and decisions without loading all archived changes into context.

This change introduces lightweight traceability conventions so agents and humans can connect OpenSpec changes, commits, archived specs, and future planning decisions with bounded context.

## What Changes

- Introduce an `openspec/INDEX.md` file as a compact human-readable index of active and archived OpenSpec changes.
- Add a trio-os planning rule: before proposing a new change, read `openspec/INDEX.md` when present, then selectively load only relevant baseline specs or archived proposal/design artifacts.
- Add a proposal/design convention for recording related changes and prior decisions used by the new change.
- Add an archive/post-review convention: update `openspec/INDEX.md` after a change is archived and record archive path, capability, summary, key decisions, and commit hash when available.
- Add a commit-message convention: implementation commits for an OpenSpec change include an `OpenSpec-Change: <change-id>` trailer.
- Document the traceability workflow in README/CHANGELOG.

## Capabilities

### New Capabilities

- `openspec-traceability`: Compact OpenSpec index, selective prior-context loading, archive index updates, and commit trailers.

### Modified Capabilities

- `trio-workflow-process-contract`: trio-os task and post-review conventions now include traceability index and commit trailer handling.

## Impact

- Affected prompt: `prompts/trio-os.md`.
- Affected skill: `skills/executor/SKILL.md`.
- Affected docs: `README.md`, `CHANGELOG.md`.
- New documentation/index artifact: `openspec/INDEX.md`.
- OpenSpec artifacts for this change.
- No extension runtime code changes are planned.
- No package dependency, lockfile, model/provider, or installation metadata changes are planned.

## Source Boundary

Allowed implementation changes before review:

- `prompts/trio-os.md`
- `skills/executor/SKILL.md`
- `README.md`
- `CHANGELOG.md`
- `openspec/INDEX.md`
- `openspec/changes/add-openspec-traceability-index/**`

Allowed post-review archive outputs after implementation review passes:

- `openspec/specs/openspec-traceability/spec.md`
- `openspec/specs/trio-workflow-process-contract/spec.md`
- `openspec/changes/archive/**/add-openspec-traceability-index/**`
- deletion or movement of `openspec/changes/add-openspec-traceability-index/**` as performed by the OpenSpec archive workflow

Forbidden changes unless the OpenSpec change is amended and re-reviewed:

- `extensions/trio-reviewer/**`
- planner skill files or generic planner behavior outside `prompts/trio-os.md`
- OpenSpec skill files or OpenSpec CLI behavior outside `prompts/trio-os.md`
- package metadata or lockfiles
- generated files
- unrelated prompt templates

## Rollback

Rollback is to revert the instruction/documentation/index commit. Existing OpenSpec artifacts and git history remain valid; the traceability index can be rebuilt manually from archived changes and commit trailers if needed.
