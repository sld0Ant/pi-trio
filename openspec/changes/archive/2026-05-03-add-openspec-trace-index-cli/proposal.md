## Why

`openspec/INDEX.md` is useful only if it stays current. Manual index edits are easy to forget during proposal and archive workflows. A dedicated index command can create active cards, archive cards, and validate compactness without mixing those responsibilities into status, review-pack, commit, or task-running commands.

## What Changes

- Add CLI commands for traceability index maintenance.
- Generate or update active change cards.
- Convert active cards to archived cards after OpenSpec archive.
- Validate index consistency against currently present active and archived changes.
- Keep generated entries compact and editable by humans.

## Capabilities

### New Capabilities

- `openspec-trace-cli-index`: CLI-assisted maintenance and validation of `openspec/INDEX.md`.

## Impact

- Future implementation may add `scripts/openspec-trace.ts` or equivalent local CLI entry point.
- Depends on `add-openspec-traceability-index` providing `openspec/INDEX.md` and the baseline index format, unless an approved amendment implements the minimum index contract in the same slice.

## Rollback

Rollback is to remove index CLI commands and documentation. Existing `openspec/INDEX.md` remains manually editable.
