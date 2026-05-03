## Why

Agents can forget workflow gates such as validation, source-boundary checks, review readiness, archive state, and pending post-review tasks. A small status command can make the current OpenSpec traceability state visible before review, archive, and commit.

This change specifies a status/check command for OpenSpec traceability automation. It is intentionally separate from index mutation, review-pack generation, commit-message generation, and task-running automation.

## What Changes

- Add a CLI status command for an OpenSpec change.
- Report whether required OpenSpec artifacts exist.
- Run or summarize strict OpenSpec validation.
- Check source-boundary drift from changed files when possible.
- Report phase readiness for pre-review, post-review, archive, and commit.
- Keep the command read-only: it reports state and exits non-zero on failed gates but does not modify files.

## Capabilities

### New Capabilities

- `openspec-trace-cli-status`: Read-only status and gate checks for OpenSpec traceability workflow.

## Impact

- Future implementation may add `scripts/openspec-trace.ts` or equivalent local CLI entry point.
- No runtime reviewer extension behavior is required by this spec.
- Depends conceptually on `add-openspec-traceability-index` being implemented first.

## Source Boundary

Allowed future implementation files should be defined by the implementation change, likely including:

- `scripts/openspec-trace.ts`
- README/CHANGELOG documentation
- tests or fixtures if introduced

## Rollback

Rollback is to remove the CLI status command and documentation. It does not alter OpenSpec artifacts by itself.
