## 1. Planning validation

- [x] 1.1 Validate this OpenSpec change strictly.
- [x] 1.2 Run OpenSpec plan review and resolve blockers.

## 2. Implementation

- [x] 2.1 Update executor skill with helper-backed task update rule and exceptions.
- [x] 2.2 Update trio-os prompt with helper-backed task update guidance.
- [x] 2.3 Update reviewer prompt to keep review read-only and allow exact command suggestions after PASS.
- [x] 2.4 Update README and CHANGELOG.

## 3. Focused validation

- [x] 3.1 Validate this OpenSpec change strictly after implementation.
- [x] 3.2 Run reviewer extension build smoke.
- [x] 3.3 Run `git diff --check`.

## 4. Review handoff

- [x] 4.1 Run `trio_review` with all modified source/docs/spec/verification files.

## 5. Post-review operations

- [x] 5.1 Archive after review passes.
- [x] 5.2 Validate baseline specs after archive.
- [x] 5.3 Update `openspec/INDEX.md` after archive.
- [x] 5.4 Commit with `OpenSpec-Change: require-trace-task-helper-updates`.
- [x] 5.5 Push branch.
