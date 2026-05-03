# Verification Notes

## Plan review

- `openspec validate add-openspec-trace-status-cli --strict` passed before implementation.
- Initial `trio_plan_review` returned `BLOCKED` because phase gate semantics and changed-file discovery were underspecified.
- The OpenSpec design/spec/tasks were amended to define the phase gate matrix, working-tree changed-file discovery, artifact paths, active/archive behavior, task helper contract, JSON v1 schema, and exit code policy.
- Critical-only `trio_plan_review` returned `APPROVED`.

## Manual CLI checks

Ran from repository root.

### Build and OpenSpec validation

```bash
bun build scripts/openspec-trace.ts --target=bun --outdir /tmp/pi-trace-build
openspec validate add-openspec-trace-status-cli --strict
```

Result: both passed.

### Human status output

```bash
bun scripts/openspec-trace.ts status add-openspec-trace-status-cli --phase pre-review
```

Result before task completion: command printed grouped human checks with `pass`, `fail`, and `skip` states. It exited non-zero while implementation tasks were still pending, as expected.

Result after task completion: command exited successfully with all pre-review required gates passing, including source-boundary drift and task readiness.

### JSON output

```bash
bun scripts/openspec-trace.ts status add-openspec-trace-status-cli --phase pre-review --json
```

Result: command printed JSON with `version`, `changeId`, `phase`, `resolvedState`, `exitState`, and `checks`. It exited non-zero while implementation tasks were still pending, as expected.

### Invalid usage and missing-change behavior

```bash
bun scripts/openspec-trace.ts status add-openspec-trace-status-cli --phase nope
bun scripts/openspec-trace.ts status add-openspec-trace-status-cli --phase --json
```

Result: commands exited with code `2`; JSON mode returned a v1 payload with a `usage` failed check. Unknown options such as `--bogus` also exit `2` through the same usage payload.

```bash
bun scripts/openspec-trace.ts status missing-change --phase pre-review --json
```

Result: command exited with code `1` and returned a v1 payload with `resolvedState: "missing"` and a `change_exists` failed check.

### Archived pre-review phase rejection

```bash
bun scripts/openspec-trace.ts status add-openspec-trace-commit-cli --phase pre-review --json
```

Result: command exited with code `1` and returned a `phase_validity` failed check because archived changes support only `archive` and `commit` phases.

### Source-boundary discovery availability

After review feedback, changed-file discovery was updated to return command availability, completeness, and warnings. If any required git discovery command fails, source-boundary status is now `not_checked` instead of passing with incomplete changed-file data.

### Archived commit status

```bash
bun scripts/openspec-trace.ts status add-openspec-trace-commit-cli --phase commit --json
```

Result: command resolved the archived change, checked archived artifacts, ran baseline validation, skipped source-boundary drift, warned that task readiness is informational for commit phase, warned archive state for commit phase, and passed commit readiness.

### Package and diff validation

```bash
bun install --frozen-lockfile
git diff --check
```

Result: both passed.
