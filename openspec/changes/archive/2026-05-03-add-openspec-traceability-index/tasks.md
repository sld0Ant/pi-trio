## 1. Pre-implementation validation

- [x] 1.1 Confirm `openspec validate add-openspec-traceability-index --strict` passes before source changes.
- [x] 1.2 Confirm implementation source changes stay within the pre-review source boundary in `design.md`.

## 2. OpenSpec index artifact

- [x] 2.1 Add `openspec/INDEX.md` with compact active and archived change cards.
- [x] 2.2 Seed the index with currently present pi-trio OpenSpec history: active completed changes under `openspec/changes/`, archived changes under `openspec/changes/archive/`, baseline specs under `openspec/specs/`, and known related commits without rewriting history.
- [x] 2.3 Document index card fields for status, capability, summary, source boundary, related changes, key decisions, archive path, and commit when known.
- [x] 2.4 Keep index entries compact and avoid duplicating full specs, tasks, or designs.

## 3. trio-os planning prompt

- [x] 3.1 Update `prompts/trio-os.md` so Phase 1 reads `openspec/INDEX.md` when present before creating a new proposal.
- [x] 3.2 Add selective context loading guidance: read relevant baseline specs and archived proposal/design files only when indicated by shared capability, explicit related-change links, shared source boundary/workflow behavior, user request dependency, or concrete planner-identified dependency/conflict.
- [x] 3.3 Add proposal/design traceability guidance for `Related Changes` and `Prior Decisions Used` sections when prior context is relevant.
- [x] 3.4 Add archive/post-review guidance to update `openspec/INDEX.md` after a change is archived.

## 4. Executor commit guidance

- [x] 4.1 Update `skills/executor/SKILL.md` to include `OpenSpec-Change: <change-id>` trailers for commits implementing OpenSpec changes.
- [x] 4.2 Clarify that the trailer uses the original active change id, not the dated archive folder name.
- [x] 4.3 Clarify that commits covering multiple OpenSpec changes should either include multiple trailers or be split.

## 5. Documentation

- [x] 5.1 Update `README.md` with the OpenSpec traceability index and commit trailer workflow.
- [x] 5.2 Update `CHANGELOG.md` with the traceability workflow behavior.

## 6. Focused validation

- [x] 6.1 Run `openspec validate add-openspec-traceability-index --strict`.
- [x] 6.2 Run `git diff --check`.
- [x] 6.3 Inspect `openspec/INDEX.md` for compactness and current pi-trio change coverage.
- [x] 6.4 Inspect source-boundary diff.

## 7. Review handoff

- [x] 7.1 Call `trio_review` with `tasks.md` as the plan; include all modified source and documentation files in `files`; include this change's `specs/` directory; summarize completed validation commands/results, skipped or pending checks, environmental limitations, and source-boundary diff.
- [x] 7.2 Fix Critical review findings, if any, and repeat review.

## 8. Post-review operations

These tasks are expected to remain pending until after implementation review passes.

- [x] 8.1 Archive the OpenSpec change after `trio_review` passes, using the post-review archive output boundary from `design.md`.
- [x] 8.2 Run baseline OpenSpec validation after archive.
- [ ] 8.3 Commit the completed implementation with `OpenSpec-Change: add-openspec-traceability-index` trailer.
- [ ] 8.4 Push the branch if requested.
