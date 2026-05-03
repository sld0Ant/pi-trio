## Context

pi-trio now has multiple OpenSpec-driven changes and archived specs. The workflow has two traceability gaps:

1. Git commits do not consistently identify the OpenSpec change they implement.
2. Future planners need prior spec context, but loading all archived specs and tasks is too expensive and noisy.

The target workflow is a compact index-first model:

- always read a small index before planning;
- load full baseline specs or archived proposal/design files only when the index indicates relevance;
- record related changes and prior decisions in new OpenSpec artifacts;
- keep commit history connected to the OpenSpec change id through trailers.

## Goals / Non-Goals

### Goals

- Add a compact `openspec/INDEX.md` format for active and archived change cards.
- Teach `/trio-os` planning to use the index before proposing new changes.
- Teach planning to selectively load prior context instead of dumping all archived changes.
- Teach post-review/archive workflow to update the index.
- Teach executor commit guidance to include `OpenSpec-Change: <change-id>` trailers.
- Seed the index with current relevant pi-trio OpenSpec history.

### Non-Goals

- No runtime extension code changes.
- No automatic index generator in this slice.
- No machine-readable registry file in this slice.
- No history rewrite to add trailers to already-merged commits.
- No requirement to load all archived specs or tasks during planning.

## Decisions

### Index format is Markdown cards

Use `openspec/INDEX.md` as a compact, human-readable index. It is easy for agents to read and easy for humans to edit during archive.

The index should include sections:

- `Active Changes`
- `Archived Changes`
- optionally `Traceability Rules`

Each change card should stay short and include fields when known:

- `Status`
- `Capability`
- `Summary`
- `Source boundary`
- `Related changes`
- `Key decisions`
- `Archive path`
- `Commit`

The index must summarize; it must not duplicate full specs, full task lists, or full designs.

The initial seed set should include currently relevant pi-trio OpenSpec history only:

- active completed changes still under `openspec/changes/`;
- archived changes currently present under `openspec/changes/archive/`;
- baseline specs currently present under `openspec/specs/`.

It does not need to reconstruct changes that are absent from the local OpenSpec tree. Existing merged commits can be referenced when their relationship to local OpenSpec artifacts is known.

### Planner uses three levels of context

`/trio-os` planning should use progressive context loading:

1. Level 1: read `openspec/INDEX.md` when it exists.
2. Level 2: read relevant baseline specs named by the index or task domain.
3. Level 3: read archived `proposal.md` and `design.md` only for directly related prior changes.

Avoid reading archived `tasks.md` or full delta specs by default. They are loaded only when a concrete dependency or conflict requires them.

A prior change is relevant when at least one condition applies:

- it shares a capability with the proposed change;
- it is explicitly listed as related by an index card;
- it touches the same source boundary or public workflow behavior;
- the user request names it or depends on it;
- the planner identifies a concrete dependency, conflict, or rollback relationship.

### New proposals record related context

New OpenSpec proposals/designs should include compact traceability sections when prior context is relevant:

- proposal: `Related Changes` or equivalent;
- design: `Prior Decisions Used` or equivalent.

This keeps review packs self-contained enough for plan review without dumping all history.

### Archive updates the index

After implementation review passes and the change is archived, update `openspec/INDEX.md`:

- remove or update the active card;
- add or update the archived card;
- record archive path;
- record capabilities changed;
- summarize key decisions;
- record commit hash when available.

If the commit hash is not available until after commit, the workflow may leave `Commit: pending` or omit the commit field for that archive entry. That state is acceptable permanently for the same change's implementation commit because the commit trailer is the primary git-to-spec link. A later follow-up may replace `pending` with an exact hash when useful, but it is not required for MVP traceability.

### Commits include OpenSpec trailers

For commits implementing an OpenSpec change, use a trailer:

```text
OpenSpec-Change: <change-id>
```

Use the original active change id, not the dated archive folder name. If a commit intentionally covers multiple OpenSpec changes, include one trailer per change or split the commit.

This is a convention for future commits. Existing merged commits are indexed without rewriting history.

## Accepted Trade-offs

- Markdown index maintenance is manual in this slice; automation can be added later.
- Commit hashes in the index may lag the commit unless a follow-up update is made.
- The index is not a replacement for baseline specs; it is a navigation aid.

## Verification

- Run `openspec validate add-openspec-traceability-index --strict`.
- Run `openspec validate --specs --strict` if baseline specs are touched during implementation.
- Run `git diff --check`.
- Inspect `openspec/INDEX.md` for compactness and current pi-trio change coverage.
- Inspect source-boundary diff.

## Source Boundary

Allowed implementation files before review:

- `prompts/trio-os.md`
- `skills/executor/SKILL.md`
- `README.md`
- `CHANGELOG.md`
- `openspec/INDEX.md`

Allowed OpenSpec files before review:

- `openspec/changes/add-openspec-traceability-index/**`

Allowed post-review archive outputs after implementation review passes:

- `openspec/specs/openspec-traceability/spec.md`
- `openspec/specs/trio-workflow-process-contract/spec.md`
- `openspec/changes/archive/**/add-openspec-traceability-index/**`
- removal or movement of `openspec/changes/add-openspec-traceability-index/**` by the archive workflow

The allowed `prompts/trio-os.md` change is intentionally allowed to adjust trio-os planning workflow instructions. The forbidden planner/OpenSpec behavior boundary applies to planner skill files, OpenSpec skill files, OpenSpec CLI behavior, and unrelated prompts.

If implementation requires other source files before review, stop and amend this OpenSpec change before editing them.
