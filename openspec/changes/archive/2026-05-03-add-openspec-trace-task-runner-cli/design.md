## Context

The trio-os process contract requires factual checkbox updates. Validation commands are a good fit for automation because success can be determined from process exit status.

## Goals

- Run a shell command associated with a task id.
- Mark the task complete only when the command exits successfully.
- Keep failed tasks unchanged.
- Avoid marking review/post-review tasks prematurely.

## Non-Goals

- No arbitrary task inference.
- No automatic fixing of failed commands.
- No replacement for human judgment on implementation tasks.

## Command Namespace

All trace automation commands should live under one local CLI namespace. The implementation may expose it as `openspec-trace` or as a script wrapper such as `bun scripts/openspec-trace.ts`, but command semantics are documented as `openspec-trace <command> [...args]`.

## Proposed Command Shape

```bash
openspec-trace run <change-id> --task 6.1 -- <command...>
openspec-trace tasks mark <change-id> --task 6.1
openspec-trace tasks check <change-id> [--phase pre-review|post-review]
```

## Command Semantics

### `run`

- Executes `<command...>` as argv without shell interpolation.
- Returns the command exit code when the command runs and fails.
- Returns non-zero when the task id is missing, ambiguous, already invalid, or command spawning fails.
- Marks the task complete only after the command exits with status `0`.
- Reports already-complete tasks as already complete and exits `0` without running the command.

### `tasks mark`

- Marks exactly one matching task complete without running a command.
- Returns `0` after marking the task or when the task is already complete.
- Returns non-zero and leaves the file unchanged for missing or ambiguous task ids.
- Allows review or post-review tasks only because the user explicitly targeted the exact task id with `tasks mark`.

### `tasks check`

`tasks check` is read-only. It reports whether a phase is ready by inspecting `tasks.md` section headings and checklist state.

Supported phases:

- `pre-review`: all checklist tasks before the first review/post-review section must be complete. Review handoff tasks and post-review tasks are allowed to remain pending.
- `post-review`: all checklist tasks before the post-review section and all review handoff tasks must be complete. Post-review tasks may remain pending.

Section classification uses heading text heuristics:

- headings containing `review handoff`, `code review`, or `review` start review scope;
- headings containing `post-review` start post-review scope;
- all prior checklist entries are implementation/pre-review scope.

Output is line-oriented text:

- `ready: <phase>` with exit `0` when the phase is ready;
- `not ready: <phase>` with exit `1` plus pending task ids when required tasks are pending;
- invalid phases or missing files return non-zero with an error message.

## Task Matching

Task ids are dot-separated numeric identifiers such as `1`, `1.2`, or `6.1`. They are matched against markdown checklist entries that begin with `- [ ] <id>` or `- [x] <id>`. A match is ambiguous when more than one checklist entry starts with the exact task id followed by whitespace. Missing or ambiguous task ids fail without mutation.

## Mutation Rules

- `run` executes the command as argv without shell interpolation by default.
- The working directory is the repository root unless an explicit cwd option is added by implementation.
- The command inherits the parent environment by default.
- `run` marks the task only after command exit code 0.
- Failed commands leave the checkbox unchanged.
- Already-complete tasks are reported as already complete.
- `run` always requires an exact `--task <task-id>` and treats that exact target as explicit intent; it does not infer or auto-select post-review tasks.

## Command Responsibility

`tasks check` owns task readiness only. `status` may aggregate its result, but task matching and phase-readiness rules should remain shared to avoid divergent behavior.

## Future Work

- Recording command output into verification notes is intentionally deferred.

## Accepted Trade-offs

- The first implementation can support simple numeric task ids only.
- Task phase checks can use section heading heuristics.
- Package validation for this repo is `bun install --frozen-lockfile`; focused behavior is validated with manual CLI checks unless a test harness is added in a later change.
