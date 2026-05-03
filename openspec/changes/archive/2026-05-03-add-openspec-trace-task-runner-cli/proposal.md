## Why

Validation tasks are often checklist items in `tasks.md`. Agents can run a command but forget to mark the corresponding task complete, or mark it complete before the command succeeds. A task runner wrapper can run a command and mark the task only when the command exits successfully.

## What Changes

- Add a CLI wrapper for running a command tied to a task id.
- Mark a task checkbox complete only after the command succeeds.
- Leave the task unchanged when the command fails.
- Defer optional command-output verification note recording to future work.

## Capabilities

### New Capabilities

- `openspec-trace-cli-tasks`: Command-backed task checkbox updates for factual OpenSpec task status.

## Impact

- Future implementation may add `scripts/openspec-trace.ts` or equivalent local CLI entry point.
- This command mutates `tasks.md` only after successful command execution.

## Rollback

Rollback is to remove the task runner command and documentation. Manual task checkbox updates remain possible.
