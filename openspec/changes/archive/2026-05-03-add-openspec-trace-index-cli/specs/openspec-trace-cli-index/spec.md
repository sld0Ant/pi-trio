## ADDED Requirements

### Requirement: Trace index CLI SHALL require an index contract
The traceability index CLI SHALL operate against an existing OpenSpec traceability index contract.

#### Scenario: Index contract exists
- **WHEN** index CLI implementation starts
- **THEN** `openspec/INDEX.md` format is already defined by baseline specs or the same approved implementation slice
- **AND** the format includes active and archived sections plus compact change cards

#### Scenario: Index contract is missing
- **WHEN** the repository does not define the required index format
- **THEN** index CLI implementation must stop or amend the OpenSpec plan before proceeding

### Requirement: Trace index CLI SHALL maintain active change cards
The traceability CLI SHALL help create and update active cards in `openspec/INDEX.md`.

#### Scenario: Active card is generated
- **WHEN** `index add-active <change-id>` is run for an active change
- **THEN** the command creates or updates a compact active card under `## Active Changes`
- **AND** includes capabilities and source boundary when they can be derived
- **AND** uses `TODO(index):` placeholders for fields that require human judgment
- **AND** sets archive path and commit to `pending`

#### Scenario: Active card update is idempotent
- **WHEN** `index add-active <change-id>` is run more than once
- **THEN** the command updates generated-owned fields in place
- **AND** does not create duplicate cards
- **AND** fails without mutation when duplicate cards already exist

#### Scenario: Human-edited fields are preserved
- **WHEN** an existing card is updated
- **THEN** human-authored summary, related changes, key decisions, and notes are preserved when possible
- **AND** generated structural fields such as status, capabilities, archive path, and directly parsed source boundary may be refreshed
- **AND** fields are considered generated placeholders only when scalar values or every non-empty bullet value starts with `TODO(index):`

### Requirement: Trace index CLI SHALL archive change cards
The traceability CLI SHALL help move or update cards after OpenSpec archive.

#### Scenario: Archived card is recorded
- **WHEN** `index archive <change-id>` is run after a change is archived
- **THEN** exactly one matching `openspec/changes/archive/<date>-<change-id>/` directory is required
- **AND** the command records an archived card under `## Archived Changes` with archive path, capabilities, summary, key decisions, and commit state when known
- **AND** removes the active card when present
- **AND** creates the archived card from archived artifacts and placeholders when no active card exists

#### Scenario: Archive directory is missing or ambiguous
- **WHEN** no matching archive directory exists or multiple matching archive directories exist
- **THEN** `index archive <change-id>` fails without mutating `openspec/INDEX.md`

#### Scenario: Commit may be pending
- **WHEN** no implementation commit hash is available
- **THEN** the archived card may record `Commit: pending`

### Requirement: Trace index CLI SHALL validate index consistency
The traceability CLI SHALL provide an index validation command.

#### Scenario: Active and archived cards are checked
- **WHEN** `index validate` is run
- **THEN** it checks cards against currently present active changes and archive directories
- **AND** reports missing, duplicate, or stale cards as failed checks
- **AND** reports active/archived section placement conflicts according to filesystem state

#### Scenario: Index compactness is checked
- **WHEN** `index validate` inspects cards
- **THEN** it reports entries that appear to duplicate full specs, full task lists, or full designs
- **AND** fails cards longer than 80 lines or 6000 characters
- **AND** fails cards containing OpenSpec delta headings or task checkbox list items
- **AND** reports `TODO(index):` placeholders as warnings
- **AND** treats `Commit: pending` as accepted informational state

#### Scenario: Validation exit codes are deterministic
- **WHEN** `index validate` runs
- **THEN** it exits `0` when no failed checks are present
- **AND** exits `1` when one or more failed checks are present
- **AND** exits `2` for invalid usage, missing index, missing OpenSpec root, or malformed index structure that prevents parsing
