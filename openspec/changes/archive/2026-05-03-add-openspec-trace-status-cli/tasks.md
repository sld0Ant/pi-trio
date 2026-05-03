## 1. Pre-implementation validation

- [x] 1.1 Validate this OpenSpec change strictly.
- [x] 1.2 Confirm dependency on `add-openspec-traceability-index` is acceptable or already implemented.

## 2. CLI status command

- [x] 2.1 Add command parsing for `status <change-id>`.
- [x] 2.2 Add phase option for `pre-review`, `post-review`, `archive`, and `commit` using the defined phase gate matrix.
- [x] 2.3 Add human-readable output with `pass`, `fail`, `warn`, `not_checked`, and `skip` states.
- [x] 2.4 Add optional JSON output using the v1 schema from `design.md`.

## 3. Checks

- [x] 3.1 Check required OpenSpec artifacts using exact active/archive paths and required-vs-warning rules.
- [x] 3.2 Run or report strict validation results according to the selected phase.
- [x] 3.3 Discover changed files from staged, unstaged, and untracked working-tree paths.
- [x] 3.4 Check source-boundary drift when parseable and apply phase-specific fail/warn behavior.
- [x] 3.5 Report task readiness by phase through shared task helper behavior when available.
- [x] 3.6 Return exit `0` for pass, `1` for failed gates, and `2` for invalid usage/repository errors.

## 4. Documentation and validation

- [x] 4.1 Document usage.
- [x] 4.2 Add focused tests or manual verification notes.
- [x] 4.3 Run package validation and OpenSpec validation.

## 5. Post-review operations

- [x] 5.1 Archive after review passes.
- [x] 5.2 Commit with `OpenSpec-Change: add-openspec-trace-status-cli`.
