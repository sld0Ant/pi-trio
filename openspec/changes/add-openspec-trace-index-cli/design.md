## Context

The traceability index records compact OpenSpec change cards. Agents may forget to add active cards during proposal or move cards to archived state after archive. A CLI can automate the repetitive structure while leaving summaries and key decisions editable.

## Dependency / Implementation Order

This change depends on the policy/index workflow from `add-openspec-traceability-index`. Do not implement the index CLI until `openspec/INDEX.md` and the baseline traceability/index format exist, or implement the equivalent minimum index contract in the same implementation slice via an approved amendment.

The minimum index contract required by this CLI is:

- sections for active and archived changes;
- one markdown heading per change card;
- fields for status, capability, summary, source boundary, related changes, key decisions, archive path, and commit when known;
- compact summaries instead of full specs/tasks/designs.

## Goals

- Add active change cards from existing OpenSpec artifacts.
- Archive cards after `openspec archive` runs.
- Validate index consistency and compactness.
- Avoid reconstructing history that is not present in the local OpenSpec tree.

## Non-Goals

- No full natural-language summarization requirement.
- No automatic git commit creation.
- No review-pack generation.
- No task checkbox editing.

## Command Namespace

All trace automation commands should live under one local CLI namespace. The implementation may expose it as `openspec-trace` or as a script wrapper such as `bun scripts/openspec-trace.ts`, but command semantics are documented as `openspec-trace <command> [...args]`.

## Proposed Command Shape

```bash
openspec-trace index add-active <change-id>
openspec-trace index archive <change-id>
openspec-trace index validate
```

## Active Card Generation

The command should read available proposal/design/spec paths and create a skeletal card with capabilities, source boundary when parseable, and TODO placeholders for summary/key decisions when not safely derivable.

Generated-owned fields are structural fields that can be refreshed safely: status, change id heading, capabilities, archive path, and source boundary when it is directly parsed. Human-owned fields are summary, related changes, key decisions, and notes unless they still contain generated TODO placeholders.

## Archive Card Update

The archive command should find the dated archive directory, move or update the card under Archived Changes, record archive path, capabilities, key decisions or TODO placeholders, and `Commit: pending` when no commit hash is known.

## Validation

Index validation should check for cards matching currently present active changes and archived changes, existing archive paths, compactness heuristics, and invalid full-artifact dumps.

Compactness checks should be deterministic: report entries that exceed a configured line/character threshold per card, contain OpenSpec delta headings such as `## ADDED Requirements`, or contain task checkbox lists copied from `tasks.md`.

## Command Responsibility

`index validate` owns only index/card consistency and compactness. It does not replace aggregate phase status checks or task readiness checks.

## Accepted Trade-offs

- Generated summaries may contain TODO placeholders.
- Exact commit hash may remain pending when commit trailer provides primary traceability.
