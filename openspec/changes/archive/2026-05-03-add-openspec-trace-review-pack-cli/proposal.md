## Why

Implementation review quality depends on passing all relevant modified files, specs, and validation context to `trio_review`. Agents can omit files or forget validation summaries. A review-pack command can generate a complete handoff payload without invoking the review tool directly.

## What Changes

- Add a CLI command that builds review-pack metadata for an OpenSpec change.
- Discover modified source/documentation/verification files from git diff.
- Provide the correct specs directory.
- Summarize validation results and pending post-review tasks when available.
- Output human-readable and JSON formats that agents can copy into `trio_review`.

## Capabilities

### New Capabilities

- `openspec-trace-cli-review-pack`: Review handoff payload generation for OpenSpec implementation review.

## Impact

- Future implementation may add `scripts/openspec-trace.ts` or equivalent local CLI entry point.
- Does not call `trio_review`; it only prepares evidence.

## Rollback

Rollback is to remove the review-pack command and documentation. Existing manual `trio_review` usage remains valid.
