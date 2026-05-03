## 1. Pre-implementation validation

- [x] 1.1 Confirm `openspec validate implement-trio-workflow-process-contract --strict` passes before source changes.
- [x] 1.2 Confirm the working tree is clean except this OpenSpec change.
- [x] 1.3 Confirm implementation source changes stay within the pre-review source boundary in `design.md`.

## 2. Executor skill contract

- [x] 2.1 Update `skills/executor/SKILL.md` to state that trio-os execution uses approved OpenSpec artifacts as the implementation contract.
- [x] 2.2 Add stop-and-amend instructions for source-boundary expansion before editing out-of-scope files or behavior.
- [x] 2.3 Add ambiguity/deviation handling for impossible, conflicting, or underspecified tasks.
- [x] 2.4 Add factual checkbox lifecycle rules for implementation, review, and post-review tasks.
- [x] 2.5 Add review-pack construction requirements covering source, specs, docs, and verification artifacts.
- [x] 2.6 Add validation-summary and verification-artifact factuality requirements.
- [x] 2.7 Add artifact-appropriate validation guidance.

## 3. Implementation reviewer prompt contract

- [x] 3.1 Update `extensions/trio-reviewer/reviewer-prompt.md` to remove the rule that the reviewer must always find something to improve.
- [x] 3.2 Add workflow-gate awareness for post-review archive, baseline sync, commit, push, and deploy tasks.
- [x] 3.3 Add current-review invocation awareness to avoid recursive failures on the active review task.
- [x] 3.4 Add Critical/Important/Suggestion severity calibration.
- [x] 3.5 Add guidance to distinguish incomplete review packs from implementation defects.
- [x] 3.6 Add bounded validation expectations for the approved risk boundary.

## 4. trio-os workflow prompt

- [x] 4.1 Update `prompts/trio-os.md` so Phase 1 asks for task sections that distinguish implementation, focused validation, review handoff, and post-review operations when applicable.
- [x] 4.2 Update Phase 2 instructions so checkboxes are factual and post-review tasks remain pending until their actions happen.
- [x] 4.3 Update Phase 3 instructions so archive/baseline/commit/push/deploy operations happen only after implementation review passes.

## 5. Documentation

- [x] 5.1 Update `README.md` with a concise trio-os process-contract summary.
- [x] 5.2 Update `CHANGELOG.md` with the executor/reviewer workflow-contract behavior.

## 6. Focused validation

- [x] 6.1 Run `openspec validate implement-trio-workflow-process-contract --strict`.
- [x] 6.2 Run `bun build extensions/trio-reviewer/index.ts --target=node --outdir /tmp/pi-trio-build` to confirm the package extension still bundles.
- [x] 6.3 Inspect `git diff --check` and source-boundary diff.

## 7. Review handoff

- [x] 7.1 Call `trio_review` with `tasks.md` as the plan; include all modified source and documentation files in `files`; include this change's `specs/` directory; summarize completed validation commands/results, skipped or pending checks, environmental limitations, and the source-boundary diff.
- [x] 7.2 Fix Critical review findings, if any, and repeat review.

## 8. Post-review operations

These tasks are expected to remain pending until after implementation review passes.

- [x] 8.1 Archive the OpenSpec change after `trio_review` passes.
- [x] 8.2 Run baseline OpenSpec validation after archive.
- [ ] 8.3 Commit the completed implementation.
- [ ] 8.4 Push the branch if requested.
