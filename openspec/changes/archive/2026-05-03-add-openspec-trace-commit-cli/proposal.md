## Why

OpenSpec implementation commits should include `OpenSpec-Change: <change-id>` trailers, but agents can forget the trailer or use the dated archive folder name. A commit helper can generate message skeletons and validate commit messages before commit.

## What Changes

- Add CLI support for generating commit message skeletons with OpenSpec trailers.
- Add CLI support for checking commit messages for required OpenSpec trailers.
- Support multiple OpenSpec trailers when one commit intentionally covers multiple changes.
- Keep actual `git commit` execution outside the MVP unless explicitly requested by a future change.

## Capabilities

### New Capabilities

- `openspec-trace-cli-commit`: Commit-message generation and validation for OpenSpec traceability trailers.

## Impact

- Future implementation may add `scripts/openspec-trace.ts` or equivalent local CLI entry point.
- No git hooks are required in this slice.

## Rollback

Rollback is to remove commit helper commands and documentation. Manual commit messages with trailers remain valid.
