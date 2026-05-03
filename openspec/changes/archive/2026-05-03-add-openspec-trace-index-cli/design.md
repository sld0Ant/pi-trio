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

## Index Contract

The CLI operates on this markdown contract:

- `# OpenSpec Index` document heading.
- `## Baseline Specs`, `## Active Changes`, and `## Archived Changes` sections.
- One card per change using heading `### <change-id>`.
- Field labels are exact markdown labels:
  - `- Status: <status>`;
  - `- Capability:` followed by bullet items;
  - `- Summary: <text>`;
  - `- Source boundary:` followed by bullet items or `pending`;
  - `- Related changes:` followed by bullet items or `pending`;
  - `- Key decisions:` followed by bullet items or `pending`;
  - `- Archive path: <path|pending>`;
  - `- Commit: <hash|pending>`.

Cards may include additional human-owned fields after these labels. The CLI should preserve unknown fields inside a card when possible.

Ordering:

- active cards are sorted by change id;
- archived cards are sorted newest archive date first, then change id;
- baseline spec cards are not modified in this slice except by `index validate` reporting.

## Placeholder Contract

Generated placeholder values are exact strings or bullet values beginning with `TODO(index):`.

Examples:

```text
- Summary: TODO(index): summarize change
- Related changes:
  - TODO(index): add related changes
- Key decisions:
  - TODO(index): add key decisions
```

A field is considered generated-placeholder-owned only when its scalar value starts with `TODO(index):` or every non-empty bullet value under the field starts with `TODO(index):`. Human-owned fields are preserved whenever they do not match that rule.

`Commit: pending` is an accepted value for both active and archived cards and is not a validation failure. It may be reported as informational for archived cards.

## Active Card Generation

`index add-active <change-id>` requires an active directory at `openspec/changes/<change-id>/`. It reads available `proposal.md`, `design.md`, and `specs/**/spec.md` files and creates or updates a compact card under `## Active Changes`.

Derived fields:

- status: `active`;
- capabilities: delta spec directory names under `specs/`;
- source boundary: parsed from `proposal.md` and `design.md` under headings containing `Source Boundary` or `Allowed implementation`, using bullet-list paths;
- archive path: `pending`;
- commit: `pending`.

When no source boundary is found, use `- Source boundary: pending` and validation reports a warning, not a failure.

Idempotency:

- rerunning `add-active` updates generated-owned fields in place;
- rerunning does not create duplicate cards;
- malformed duplicate cards for the same change cause the command to fail until the user fixes the index;
- human-owned fields are preserved unless they are still generated placeholders.

## Archive Card Update

`index archive <change-id>` is intended to run after `openspec archive`. It requires exactly one archive directory matching `openspec/changes/archive/<date>-<change-id>/`.

Behavior:

- if no matching archive directory exists, fail and do not mutate the index;
- if multiple matching archive directories exist, fail and do not mutate the index;
- if an active card exists, move/update it under `## Archived Changes`;
- if no active card exists, create an archived card from archived artifacts and TODO placeholders;
- remove the active card after the archived card is written;
- record archive path as ``openspec/changes/archive/<date>-<change-id>/``;
- record `Commit: pending` when no exact hash is known.

`index archive` must not run `openspec archive` itself.

## Validation

`index validate` checks card consistency and compactness only. It does not mutate files.

Consistency checks:

- every present active change directory under `openspec/changes/*` except `archive` has exactly one active card;
- every present archive directory under `openspec/changes/archive/*` has exactly one archived card;
- active cards pointing to missing active directories are failures;
- archived cards whose archive path is missing are failures;
- duplicate cards for the same change in the same section are failures;
- the same change appearing in both active and archived sections is a warning when both filesystem states exist, otherwise a failure for stale placement.

Compactness checks are deterministic:

- fail when a card exceeds 80 lines;
- fail when a card exceeds 6000 characters;
- fail when a card contains OpenSpec delta headings such as `## ADDED Requirements`, `## MODIFIED Requirements`, or `## REMOVED Requirements`;
- fail when a card contains task checkbox list items matching `- [ ]` or `- [x]`;
- warn when an active card still contains `TODO(index):` placeholders;
- warn when an archived card still contains `TODO(index):` placeholders;
- info when an archived card has `Commit: pending`.

## Validation Output and Exit Codes

Human output should list checks with `pass`, `fail`, `warn`, and `info` states.

JSON output is not required in this slice for index commands.

Exit codes:

- `0`: no failed checks;
- `1`: one or more failed checks;
- `2`: invalid CLI usage, missing `openspec/INDEX.md`, missing `openspec/` root, or malformed index structure that prevents parsing.

## Command Responsibility

`index validate` owns only index/card consistency and compactness. It does not replace aggregate phase status checks or task readiness checks.

## Accepted Trade-offs

- Generated summaries may contain TODO placeholders.
- Exact commit hash may remain pending when commit trailer provides primary traceability.
