## 1. Pre-implementation validation

- [x] 1.1 Validate this OpenSpec change strictly before implementation.
- [x] 1.2 Confirm implementation source changes stay within the pre-review source boundary in `design.md`.

## 2. Diagnostic logging implementation

- [x] 2.1 Add per-invocation timing collection for `trio_plan_review` and `trio_review`.
- [x] 2.2 Write safe JSON diagnostic logs to `/tmp/pi-trio-review-logs` by default.
- [x] 2.3 Support `TRIO_REVIEW_LOG_DIR` for local log directory override.
- [x] 2.4 Use unique per-invocation log filenames and collision-safe writes where practical.
- [x] 2.5 Create log directories/files with private permissions (`0700` directories, `0600` files) where supported.
- [x] 2.6 Keep raw prompts, full file contents, and model responses out of default logs.
- [x] 2.7 Support bounded opt-in raw capture through `TRIO_REVIEW_LOG_RAW=1` with a 64 KiB per-field limit and truncation metadata.
- [x] 2.8 Ensure logging failures become diagnostic warnings and do not fail the review.

## 3. Review tool details and progress

- [x] 3.1 Return `durationMs`, `logPath`, and diagnostic warnings in `trio_plan_review` details.
- [x] 3.2 Return `durationMs`, `logPath`, and diagnostic warnings in `trio_review` details.
- [x] 3.3 Preserve existing details fields such as `profiles`, `rawVerdict`, and `openspecValidationStatus`.
- [x] 3.4 Inspect the current Pi tool API path for progress-output support and add progress output for major review phases when supported.
- [x] 3.5 Document checked SDK/API limitations in verification notes if progress output is not feasible.

## 4. Documentation and validation

- [x] 4.1 Document reviewer diagnostics, log location, environment variables, default-safe logging, and raw logging sensitivity.
- [x] 4.2 Add focused tests or manual verification notes for timing details, log creation, unique filenames, private permissions where supported, default raw omission, raw opt-in/truncation, logging failure tolerance, and profile reporting.
- [x] 4.3 Run package validation and OpenSpec validation.
- [x] 4.4 Run source-boundary diff inspection.

## 5. Review handoff

- [x] 5.1 Call `trio_review` with `tasks.md` as the plan; include modified source/docs/verification files and this change's specs directory.
- [x] 5.2 Fix Critical review findings, if any, and repeat review.

## 6. Post-review operations

These tasks stay pending until after implementation review passes.

- [x] 6.1 Archive the OpenSpec change after `trio_review` passes.
- [x] 6.2 Run baseline OpenSpec validation after archive.
- [x] 6.3 Update `openspec/INDEX.md` after archive.
- [x] 6.4 Commit with `OpenSpec-Change: add-trio-reviewer-diagnostics`.
- [ ] 6.5 Push the branch if requested.
