## Context

The repository already contains `openspec/INDEX.md`. It was seeded before the latest missing-index prompt workflow was archived and before this dedicated make-index invocation. The index should now be reconciled with the current tree:

- baseline specs under `openspec/specs/`;
- active changes under `openspec/changes/`;
- archived changes under `openspec/changes/archive/`;
- known implementation commits where available.

## Prior Decisions Used

- `openspec/INDEX.md` is a compact navigation aid, not a dump of full OpenSpec artifacts.
- `Commit: pending` is acceptable when the final commit is unknown and commit trailers remain the primary git-to-spec link.
- Make-index workflow must not implement unrelated feature work.

## Goals / Non-Goals

### Goals

- Update `openspec/INDEX.md` to reflect currently present OpenSpec state.
- Keep active future automation specs listed as active/proposed future work.
- Move archived traceability changes to archived cards when they are present under `openspec/changes/archive/`.
- Add or update baseline spec cards for all currently present baseline specs.
- Keep cards compact and navigational.

### Non-Goals

- No prompt, skill, extension, README, or CHANGELOG changes.
- No implementation of trace CLI automation.
- No reconstruction of absent historical OpenSpec artifacts.
- No rewriting git history to add commit trailers to old commits.

## Decisions

### Reconcile from current tree

Use current repository state as the source of truth:

- `openspec/specs/*/spec.md` → baseline spec cards;
- `openspec/changes/<change>/` excluding `archive/` → active change cards;
- `openspec/changes/archive/<date-change>/` → archived change cards.

### Preserve compact fields

Each card should include only compact fields when useful:

- status;
- capability;
- summary;
- source boundary when known;
- related changes;
- key decisions;
- archive path;
- commit when known.

Do not copy full requirement bodies, full tasks, or full designs.

### Known commit handling

Verify known commits against local git history before writing them into the repaired index. Use `Commit: pending` when a commit cannot be confirmed.

Known commits expected from current local history/index:

- `improve-trio-os-review-convergence` → `6d2112a`;
- `implement-trio-workflow-process-contract` → `b818ccb`;
- `manage-openspec-review-profile` → `1e375b4`;
- `add-openspec-traceability-index` → `a7311b4`;
- `prompt-for-openspec-index-bootstrap` → `e8c7334`.

Future active automation specs should use `Commit: pending`.

### Card field expectations

Baseline spec cards should include:

- status;
- path;
- summary;
- related changes;
- key decisions when useful.

Active change cards should include:

- status;
- capability;
- summary;
- source boundary when known;
- related changes;
- key decisions;
- archive path as `pending`;
- commit as known hash or `pending`.

Archived change cards should include:

- status;
- capability;
- summary;
- source boundary when known;
- related changes;
- key decisions;
- archive path;
- commit as known hash or `pending`.

### Current make-index repair remains active until archived

Add a compact active card for this repair change. It can be moved to archived state after review/archive in a later post-review update or by a future index automation command. If the commit hash is unknown at archive time, `Commit: pending` is acceptable.

When the plan says to move archived or completed changes out of active status, it means updating the index classification/card placement only. It does not mean moving directories or modifying archived artifacts before the explicit archive workflow.

## Verification

- Run `openspec validate repair-openspec-traceability-index --strict`.
- Run `git diff --check`.
- Inspect `openspec/INDEX.md` for compactness and coverage of baseline specs, active changes, and archived changes.
- Inspect source-boundary diff.

## Source Boundary

Allowed implementation files before review:

- `openspec/INDEX.md`

Allowed OpenSpec files before review:

- `openspec/changes/repair-openspec-traceability-index/**`

Allowed post-review archive outputs after implementation review passes:

- `openspec/specs/openspec-traceability/spec.md`
- `openspec/changes/archive/**/repair-openspec-traceability-index/**`
- removal or movement of `openspec/changes/repair-openspec-traceability-index/**` by the archive workflow

If implementation requires other files before review, stop and amend this OpenSpec change before editing them.
