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

## Checks

- Change directory exists for active changes or archive directory exists for archived changes.
- Core artifacts exist: proposal, design, tasks, specs.
- `openspec validate <change-id> --strict` passes for active changes when available.
- `openspec validate --specs --strict` passes for archived/baseline phase when applicable.
- Changed files are compared with source boundary when source-boundary metadata is parseable.
- Phase-specific pending/completed task expectations are summarized through the shared task-check helper when available; otherwise task readiness is reported as not checked.

## Output

Human output should group checks by area and use pass/fail/warn states. JSON output should include stable fields for future automation.

## Command Responsibility

`status` is the aggregate read-only gate. It may call or share logic with other commands, but ownership is split as follows:

- `status`: overall phase gate aggregation and human summary.
- `index validate`: index/card consistency only.
- `tasks check`: task checkbox readiness only when implemented.
- `review-pack`: review handoff payload generation only.

## Accepted Trade-offs

- Source-boundary parsing can be best-effort in the first implementation. Missing boundary data should warn; a parseable boundary with changed files outside it should fail for phases that require source-boundary compliance.
- Task status checks can use naming/section heuristics until a structured task format exists.
