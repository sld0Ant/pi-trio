# Tasks: Add roadmap-spec artifact guidance

## Implementation

- [x] 1.1 Update `/trio-os` workflow guidance so agents read relevant `openspec/roadmaps/` files selectively after `openspec/INDEX.md` when roadmap context exists.
- [x] 1.2 Update the OpenSpec skill guide to document roadmap specs as optional upper-level planning artifacts.
- [x] 1.3 Update README and changelog with concise roadmap-spec usage notes.
- [x] 1.4 Ensure roadmap guidance distinguishes planning context from implemented requirements without changing reviewer sub-agent behavior in this slice.

## Focused Validation

- [x] 2.1 Run `openspec validate add-roadmap-spec-artifact --strict`.
- [x] 2.2 Verify documentation states that baseline specs remain the current-behavior source of truth and roadmap items are not implemented behavior by themselves.
- [x] 2.3 Verify roadmap loading guidance is selective and does not require roadmaps for all repositories.

## Review Handoff

- [x] 3.1 Run `trio_review` with implementation files and `openspec/changes/add-roadmap-spec-artifact/specs/`.
- [x] 3.2 If review passes, mark the review task complete using `bun scripts/openspec-trace.ts tasks mark add-roadmap-spec-artifact --task 3.1`.

## Post-Review Operations

- [x] 4.1 Archive the OpenSpec change after implementation review passes.
- [x] 4.2 Update `openspec/INDEX.md` after archive when the traceability index is in use.
- [x] 4.3 Run baseline OpenSpec validation after archive.
- [x] 4.4 Commit with trailer `OpenSpec-Change: add-roadmap-spec-artifact`.
