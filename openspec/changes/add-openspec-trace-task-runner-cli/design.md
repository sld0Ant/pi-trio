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

## Task Matching

Task ids are dot-separated numeric identifiers such as `1`, `1.2`, or `6.1`. They are matched against markdown checklist entries that begin with `- [ ] <id>` or `- [x] <id>`. A match is ambiguous when more than one checklist entry starts with the exact task id followed by whitespace. Missing or ambiguous task ids fail without mutation.

## Mutation Rules

- `run` executes the command as argv without shell interpolation by default.
- The working directory is the repository root unless an explicit cwd option is added by implementation.
- The command inherits the parent environment by default.
- `run` marks the task only after command exit code 0.
- Failed commands leave the checkbox unchanged.
- Already-complete tasks are reported as already complete.
- Post-review tasks are not auto-marked by `run` unless explicitly targeted.

## Command Responsibility

`tasks check` owns task readiness only. `status` may aggregate its result, but task matching and phase-readiness rules should remain shared to avoid divergent behavior.

## Accepted Trade-offs

- The first implementation can support simple numeric task ids only.
- Task phase checks can use section heading heuristics.
