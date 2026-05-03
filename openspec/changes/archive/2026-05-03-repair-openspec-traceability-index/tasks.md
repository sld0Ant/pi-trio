## 1. Pre-implementation validation

- [x] 1.1 Confirm `openspec validate repair-openspec-traceability-index --strict` passes before index changes.
- [x] 1.2 Confirm implementation source changes stay within the pre-review source boundary in `design.md`.

## 2. Index repair

- [x] 2.1 Verify known commit hashes against local git history and use `Commit: pending` where not confirmed.
- [x] 2.2 Update `openspec/INDEX.md` baseline spec cards for all currently present baseline specs with expected compact fields.
- [x] 2.3 Update active change cards for currently present active changes with expected compact fields.
- [x] 2.4 Update archived change cards for currently present archived changes with expected compact fields.
- [x] 2.5 Add a compact active card for `repair-openspec-traceability-index`.
- [x] 2.6 Preserve compactness: do not copy full specs, full task lists, or full designs.
- [x] 2.7 Ensure moving archived/completed changes means index classification/card placement only, not directory movement before archive.

## 3. Focused validation

- [x] 3.1 Run `openspec validate repair-openspec-traceability-index --strict`.
- [x] 3.2 Run `git diff --check`.
- [x] 3.3 Inspect `openspec/INDEX.md` coverage for baseline specs, active changes, and archived changes.
- [x] 3.4 Inspect source-boundary diff.

## 4. Review handoff

- [x] 4.1 Call `trio_review` with `tasks.md` as the plan; include `openspec/INDEX.md` as the implementation file; include this change's `specs/` directory; summarize completed validation commands/results, skipped or pending checks, environmental limitations, and source-boundary diff.
- [x] 4.2 Fix Critical review findings, if any, and repeat review.

## 5. Post-review operations

These tasks are expected to remain pending until after implementation review passes.

- [x] 5.1 Archive the OpenSpec change after `trio_review` passes.
- [x] 5.2 Run baseline OpenSpec validation after archive.
- [x] 5.3 Commit the completed implementation with `OpenSpec-Change: repair-openspec-traceability-index` trailer.
- [ ] 5.4 Push the branch if requested.
