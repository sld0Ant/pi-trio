## Context

Commit trailers are the primary git-to-spec traceability link. A small helper can remove formatting mistakes and make commit-message checks repeatable.

## Goals

- Generate commit message skeletons with `OpenSpec-Change: <change-id>`.
- Validate an existing commit message file.
- Support multiple change ids.
- Ensure original active change ids are used, not dated archive folder names.

## Non-Goals

- No mandatory git hooks.
- No automatic git commit command in MVP.
- No history rewriting.

## Command Namespace

All trace automation commands should live under one local CLI namespace. The implementation may expose it as `openspec-trace` or as a script wrapper such as `bun scripts/openspec-trace.ts`, but command semantics are documented as `openspec-trace <command> [...args]`.

## Proposed Command Shape

```bash
openspec-trace commit-msg <change-id> --title "feat: ..."
openspec-trace commit-msg <change-id> <change-id> --title "feat: ..."
openspec-trace check-commit-msg <file> [--change <change-id>]
```

## Validation Rules

- Trailer line grammar is exactly `OpenSpec-Change: <change-id>`.
- `<change-id>` uses lowercase kebab-case characters (`a-z`, `0-9`, and `-`) and must not start or end with `-`.
- Trailer value matches an active or archived original change id when discoverable.
- Dated archive folder names are rejected when the original change id can be inferred.
- Duplicate trailers for the same change are rejected.
- Multiple trailers are allowed and preserve the order provided by the caller.

## Accepted Trade-offs

- The helper does not need to infer the commit title.
- Hook integration can be added later.
