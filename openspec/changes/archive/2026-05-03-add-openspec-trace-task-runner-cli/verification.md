# Verification Notes

## Plan review

- `openspec validate add-openspec-trace-task-runner-cli --strict` passed before implementation.
- Initial `trio_plan_review` returned `BLOCKED` for underspecified `tasks check --phase` behavior.
- The OpenSpec design/spec were amended to define readiness, phase mapping, output, exit codes, `tasks mark` behavior, validation commands, and deferred output-note recording.
- Critical-only `trio_plan_review` returned `APPROVED`.

## Regex and mutation checks

Ran against a temporary OpenSpec fixture under `mktemp -d`, using the repository script path.

### Trailer regex checks

- `OpenSpec-Change: test-change` passed with `--change test-change`.
- Body text containing `OpenSpec-Change` in the middle of a sentence was not treated as a malformed trailer.
- `openspec-change: test-change` was rejected as invalid trailer syntax.
- `OpenSpec-Change test-change` was rejected as invalid trailer syntax.
- `OpenSpec-Change: 2026-05-03-archived-change` was rejected with a message pointing to `archived-change`.
- `OpenSpec-Change: archived-change` passed for an archived original change id.

### Task id matching checks

- `tasks mark test-change --task 2.1` marked only `2.1`; it did not mark `2.10`.
- `tasks mark test-change --task 2` failed because no exact task id exists.
- `tasks mark test-change --task 2.x` failed as an invalid task id.
- `tasks mark test-change --task 9.9` failed as a missing task.

### Command-backed mutation checks

- `run test-change --task 1.1 -- bun -e 'process.exit(0)'` marked task `1.1` complete.
- `run test-change --task 2.10 -- bun -e 'process.exit(7)'` exited with status `7` and left `tasks.md` unchanged.
- `run` on already-complete task `1.2` reported already complete and did not execute the command.

### Phase readiness checks

- `tasks check --phase pre-review` failed while implementation task `2.10` was pending.
- After marking `2.10`, `pre-review` passed while review/post-review tasks remained pending.
- `tasks check --phase post-review` failed while review handoff task `4.1` was pending.
- After marking `4.1`, `post-review` passed while post-review task `5.1` remained pending.

## Package and OpenSpec validation

```bash
bun install --frozen-lockfile
openspec validate add-openspec-trace-task-runner-cli --strict
git diff --check
```

Result: all passed.
