## 1. Pre-implementation validation

- [ ] 1.1 Validate this OpenSpec change strictly.
- [ ] 1.2 Confirm dependency on `add-openspec-traceability-index` is acceptable or already implemented.

## 2. CLI status command

- [ ] 2.1 Add command parsing for `status <change-id>`.
- [ ] 2.2 Add phase option for `pre-review`, `post-review`, `archive`, and `commit`.
- [ ] 2.3 Add human-readable output.
- [ ] 2.4 Add optional JSON output.

## 3. Checks

- [ ] 3.1 Check required OpenSpec artifacts.
- [ ] 3.2 Run or report strict validation results.
- [ ] 3.3 Check source-boundary drift when parseable.
- [ ] 3.4 Report task readiness by phase.
- [ ] 3.5 Return non-zero exit code for failed required gates.

## 4. Documentation and validation

- [ ] 4.1 Document usage.
- [ ] 4.2 Add focused tests or manual verification notes.
- [ ] 4.3 Run package validation and OpenSpec validation.

## 5. Post-review operations

- [ ] 5.1 Archive after review passes.
- [ ] 5.2 Commit with `OpenSpec-Change: add-openspec-trace-status-cli`.
