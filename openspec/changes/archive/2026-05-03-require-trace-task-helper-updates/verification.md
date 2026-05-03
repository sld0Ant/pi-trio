# Verification Notes

## Plan review

- `which openspec` returned `/home/clyde/.bun/bin/openspec`.
- `openspec validate require-trace-task-helper-updates --strict` passed.
- Initial critical-and-important plan review returned `BLOCKED` because `openspec/INDEX.md` was required by post-review tasks but not allowed in the post-review source boundary.
- The design was amended to allow `openspec/INDEX.md` as a post-review output and wording was clarified from plain `PASS` to “approving implementation-review verdict such as `PASS`”.
- Follow-up critical-only plan review returned `APPROVED`.

## Task helper usage

Task checkboxes for this change were updated with `bun scripts/openspec-trace.ts run ...` or `bun scripts/openspec-trace.ts tasks mark ...` after actions completed.

## Validation

```bash
bun scripts/openspec-trace.ts run require-trace-task-helper-updates --task 3.1 -- openspec validate require-trace-task-helper-updates --strict
bun scripts/openspec-trace.ts run require-trace-task-helper-updates --task 3.2 -- bun build extensions/trio-reviewer/index.ts --target=node --outdir /tmp/pi-trio-reviewer-build
bun scripts/openspec-trace.ts run require-trace-task-helper-updates --task 3.3 -- git diff --check
```

Results:

- OpenSpec strict validation passed.
- Reviewer extension build smoke bundled successfully to `/tmp/pi-trio-reviewer-build`.
- `git diff --check` passed.
