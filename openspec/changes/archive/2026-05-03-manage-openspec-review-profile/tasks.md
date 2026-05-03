## 1. Pre-implementation validation

- [x] 1.1 Confirm `openspec validate manage-openspec-review-profile --strict` passes before source changes.
- [x] 1.2 Confirm implementation source changes stay within the pre-review source boundary in `design.md`.

## 2. Managed profile model

- [x] 2.1 Add an extension-local managed profile set containing `openspec`.
- [x] 2.2 Add a helper that returns user-selectable profiles by excluding managed profiles.
- [x] 2.3 Update profile restoration so persisted managed profile names are ignored.
- [x] 2.4 Treat sanitized-empty restored profile lists as unresolved so legacy `["openspec"]` sessions can fall through to picker or no-UI defaults.
- [x] 2.5 Update profile persistence so only user-selectable profile names are saved.

## 3. Picker behavior

- [x] 3.1 Update the profile picker to list only user-selectable profiles.
- [x] 3.2 Keep the picker available for both generic and OpenSpec review contexts when user-selectable profiles exist.
- [x] 3.3 Update no-UI default behavior so generic reviews enable selectable profiles only and do not apply managed `openspec`.

## 4. Per-invocation profile application

- [x] 4.1 Add a helper that determines OpenSpec review context from tool-specific parameters.
- [x] 4.2 Add a helper that builds invocation profiles from user-selected profiles plus required managed profiles.
- [x] 4.3 De-duplicate invocation profiles and keep stable ordering with user-selected profiles first and managed `openspec` appended after them.
- [x] 4.4 Apply managed `openspec` for `trio_plan_review` only when `mode === "openspec"`.
- [x] 4.5 Apply managed `openspec` for `trio_review` only when `specs_dir` is provided.
- [x] 4.6 Ensure managed profiles do not mutate session-level `activeProfiles` and do not bleed into later generic reviews.
- [x] 4.7 Use invocation profiles for plan-review prompt construction, progress text, and `details.profiles`.
- [x] 4.8 Use invocation profiles for code-review prompt construction, progress text, and `details.profiles`.

## 5. Documentation

- [x] 5.1 Update `README.md` to document that `openspec` is managed and hidden from the picker.
- [x] 5.2 Update `CHANGELOG.md` with the managed OpenSpec profile behavior.

## 6. Focused validation

- [x] 6.1 Run `openspec validate manage-openspec-review-profile --strict`.
- [x] 6.2 Run `bun build extensions/trio-reviewer/index.ts --target=node --outdir /tmp/pi-trio-build`.
- [x] 6.3 Run `git diff --check`.
- [x] 6.4 Inspect source-boundary diff.
- [x] 6.5 Manually inspect the profile-selection matrix: generic plan review, OpenSpec plan review, direct generic plan review, code review with `specs_dir`, code review without `specs_dir`, no-UI generic, no-UI OpenSpec, and legacy persisted `["openspec"]`.

## 7. Review handoff

- [x] 7.1 Call `trio_review` with `tasks.md` as the plan; include all modified source and documentation files in `files`; include this change's `specs/` directory; summarize completed validation commands/results, skipped or pending checks, environmental limitations, and source-boundary diff.
- [x] 7.2 Fix Critical review findings, if any, and repeat review.

## 8. Post-review operations

These tasks are expected to remain pending until after implementation review passes.

- [x] 8.1 Archive the OpenSpec change after `trio_review` passes.
- [x] 8.2 Run baseline OpenSpec validation after archive.
- [x] 8.3 Commit the completed implementation.
- [x] 8.4 Push the branch if requested.
