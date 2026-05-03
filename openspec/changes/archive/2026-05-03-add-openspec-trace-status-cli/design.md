## Context

Traceability workflow has multiple gates that are easy to forget: OpenSpec validation, source-boundary checks, review readiness, archive state, and commit trailer readiness. A read-only command can provide a single status view without mutating repository state.

## Dependency / Implementation Order

This change can be implemented before or after `add-openspec-trace-task-runner-cli`. If task-check helper behavior is not implemented yet, `status` must report task readiness as `not checked` or warning rather than failing solely because task automation is unavailable. Once task-check behavior exists, `status` should use the shared helper instead of duplicating task rules.

## Goals

- Provide a read-only status command for one OpenSpec change.
- Support phase-aware checks such as `pre-review`, `post-review`, `archive`, and `commit`.
- Detect obvious missing artifacts and source-boundary drift.
- Produce human-readable output and optionally machine-readable JSON.

## Non-Goals

- No file mutation.
- No index updates.
- No task checkbox editing.
- No commit creation.
- No `trio_review` invocation.

## Command Namespace

All trace automation commands should live under one local CLI namespace. The implementation may expose it as `openspec-trace` or as a script wrapper such as `bun scripts/openspec-trace.ts`, but command semantics are documented as:

```bash
openspec-trace <command> [...args]
```

## Proposed Command Shape

```bash
openspec-trace status <change-id> [--phase pre-review|post-review|archive|commit] [--json]
```

## Change Resolution

`status` resolves a change id in this order:

1. Active path: `openspec/changes/<change-id>/`.
2. Archived path: `openspec/changes/archive/<date>-<change-id>/` where `<date>` is `YYYY-MM-DD`.

If both active and archived versions exist, the active change wins and the archived duplicate is reported as a warning. If neither exists, status fails.

Phase validity:

- active changes support `pre-review`, `post-review`, `archive`, and `commit`;
- archived changes support `archive` and `commit`;
- running `pre-review` or `post-review` for an archived change returns a failed gate with a clear message.

## Artifact Checks

For active changes, check these paths:

- `openspec/changes/<change-id>/proposal.md` — fail if missing;
- `openspec/changes/<change-id>/tasks.md` — fail if missing;
- `openspec/changes/<change-id>/design.md` — warn if missing;
- `openspec/changes/<change-id>/specs/**/spec.md` — fail if no spec files exist.

For archived changes, check equivalent paths under the resolved archive directory. Missing archived artifacts fail for `archive` and `commit` phases because archived state should be complete.

## Changed File Discovery

Source-boundary checks use git status/diff from the current working tree, not branch comparison:

- staged changes from `git diff --name-only --cached`;
- unstaged changes from `git diff --name-only`;
- untracked files from `git ls-files --others --exclude-standard`.

Deleted files are included as changed paths. Paths under the active change directory itself are ignored for source-boundary drift unless the source boundary explicitly includes OpenSpec planning artifacts. Archived paths are not checked for source-boundary drift.

This MVP does not compare against `origin/master`, merge-base, or pull-request diff. Branch-diff status can be added later.

## Source-Boundary Parsing

The parser is best-effort and only recognizes explicit source-boundary blocks in `proposal.md` or `design.md` containing bullet-list paths under headings that include `Source Boundary` or `Allowed implementation`. Parsed path prefixes are compared against changed files.

Boundary check states:

- `pass`: boundary is parseable and all changed implementation files are inside it;
- `fail`: boundary is parseable and at least one changed implementation file is outside it;
- `warn`: boundary is missing or not parseable;
- `not_checked`: archived change or git command unavailable.

## Phase Gate Matrix

Check severities by phase:

| Check | pre-review | post-review | archive | commit |
| --- | --- | --- | --- | --- |
| change exists | fail | fail | fail | fail |
| required artifacts | fail | fail | fail | fail |
| active strict validation | fail | fail | fail | warn |
| baseline strict validation | skip | skip | warn | warn |
| source-boundary drift | fail | fail | warn | warn |
| task readiness | fail/warn | fail/warn | warn | warn |
| archive state | skip | skip | fail | warn |
| commit trailer readiness | skip | skip | skip | fail |

Task readiness is `fail` when the shared task helper reports the requested phase is not ready. It is `warn`/`not_checked` when the helper is unavailable or cannot classify headings.

Archive state for `archive` requires the active change to still exist before archive, or the archived change to exist after archive depending on resolved change state. If an active change has all pre-review/post-review gates passing, archive state passes with message `ready to archive`. If an archived change exists, archive state passes with message `already archived`.

Commit trailer readiness for `commit` checks that a commit message can be generated or validated with the original active change id format. The first implementation may validate only that `<change-id>` is lowercase kebab-case and not a dated archive folder name; deeper git-history checks belong to commit-helper behavior.

## Task Helper Integration

When `tasks check` behavior is available in the local CLI implementation, status should call the shared in-process helper or equivalent shared function, not spawn itself recursively. The consumed contract is:

```ts
type TaskPhaseStatus = {
  state: 'pass' | 'fail' | 'warn' | 'not_checked';
  pending: Array<{ id: string; text: string }>;
  warnings: string[];
};
```

If shared task helper functions are not available, status reports task readiness as `not_checked` with a warning and does not fail solely for that reason.

## Output

Human output groups checks by area and uses these states: `pass`, `fail`, `warn`, `not_checked`, `skip`.

JSON output uses this v1 shape:

```json
{
  "version": 1,
  "changeId": "add-example",
  "phase": "pre-review",
  "resolvedState": "active",
  "exitState": "fail",
  "checks": [
    {
      "id": "required_artifacts",
      "label": "Required artifacts",
      "state": "pass",
      "severity": "required",
      "message": "proposal.md, tasks.md, design.md, and specs found",
      "details": {}
    }
  ]
}
```

`exitState` is `pass` when no checks have state `fail`; otherwise `fail`. JSON mode uses the same exit codes as human mode.

Exit code policy:

- exit `0` when `exitState` is `pass`;
- exit `1` when any required gate fails;
- exit `2` for invalid CLI usage, invalid phase, unreadable repository root, or malformed arguments;
- warnings, `not_checked`, and `skip` do not make the command non-zero by themselves.

## Command Responsibility

`status` is the aggregate read-only gate. It may call or share logic with other commands, but ownership is split as follows:

- `status`: overall phase gate aggregation and human summary.
- `index validate`: index/card consistency only.
- `tasks check`: task checkbox readiness only when implemented.
- `review-pack`: review handoff payload generation only.

## Accepted Trade-offs

- Source-boundary parsing can be best-effort in the first implementation. Missing boundary data should warn; a parseable boundary with changed files outside it should fail for phases that require source-boundary compliance.
- Task status checks can use naming/section heuristics until a structured task format exists.
