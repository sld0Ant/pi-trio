## 1. Pre-implementation validation

- [x] 1.1 Confirm `openspec validate prompt-for-openspec-index-bootstrap --strict` passes before source changes.
- [x] 1.2 Confirm implementation source changes stay within the pre-review source boundary in `design.md`.

## 2. trio-os prompt behavior

- [x] 2.1 Update `prompts/trio-os.md` to detect the documented state where `openspec/` exists but `openspec/INDEX.md` is missing.
- [x] 2.2 Add user-choice guidance with options to create the traceability index first, continue without the index for the task, or skip prompting for the session.
- [x] 2.3 Clarify that `openspec/INDEX.md` must not be created automatically unless index creation is explicitly selected or already in scope.
- [x] 2.4 Clarify that continuing without the index uses normal OpenSpec discovery and available relevant specs/changes.
- [x] 2.5 Clarify non-interactive, ambiguous, or no-selection fallback: continue without index for the current task and do not create the index.
- [x] 2.6 Clarify that create-index-first uses a separate bootstrap OpenSpec change unless the user explicitly expands scope or the original request is already about traceability/index setup.

## 3. Dedicated make-index workflow

- [x] 3.1 Add `prompts/trio-os-make-index.md` as a dedicated traceability index bootstrap workflow.
- [x] 3.2 Document `/trio-os-make-index` as the canonical Pi prompt-template command for users asking for `/trio-os:make_index` style behavior, without implying a runtime alias.
- [x] 3.3 Ensure the make-index workflow checks whether `openspec/INDEX.md` already exists, then creates it when missing or updates/repairs it when present.
- [x] 3.4 Ensure the make-index workflow creates or updates `openspec/INDEX.md` through a normal OpenSpec change and does not mix unrelated feature work.
- [x] 3.5 Ensure the make-index workflow does not bypass plan review, implementation review, archive, or commit-trailer gates.

## 4. Documentation and index update

- [x] 4.1 Update `README.md` with missing-index behavior, the three user choices, make-index workflow, and a note that this is agent workflow guidance rather than extension-runtime automation.
- [x] 4.2 Update `CHANGELOG.md` with the missing-index prompt and make-index workflow behavior.
- [x] 4.3 Update `openspec/INDEX.md` with a compact active card for this change.

## 5. Focused validation

- [x] 5.1 Run `openspec validate prompt-for-openspec-index-bootstrap --strict`.
- [x] 5.2 Run `git diff --check`.
- [x] 5.3 Inspect prompt/docs wording to confirm no automatic index creation is required.
- [x] 5.4 Inspect source-boundary diff.

## 6. Review handoff

- [x] 6.1 Call `trio_review` with `tasks.md` as the plan; include all modified source and documentation files in `files`; include this change's `specs/` directory; summarize completed validation commands/results, skipped or pending checks, environmental limitations, and source-boundary diff.
- [x] 6.2 Fix Critical review findings, if any, and repeat review.

## 7. Post-review operations

These tasks are expected to remain pending until after implementation review passes.

- [x] 7.1 Archive the OpenSpec change after `trio_review` passes.
- [x] 7.2 Run baseline OpenSpec validation after archive.
- [ ] 7.3 Commit the completed implementation with `OpenSpec-Change: prompt-for-openspec-index-bootstrap` trailer.
- [ ] 7.4 Push the branch if requested.
