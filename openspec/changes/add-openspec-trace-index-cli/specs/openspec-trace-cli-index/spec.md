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
- **THEN** the command creates or updates a compact active card
- **AND** includes capabilities and source boundary when they can be derived
- **AND** uses TODO placeholders for fields that require human judgment

#### Scenario: Human-edited fields are preserved
- **WHEN** an existing card is updated
- **THEN** human-authored summary, related changes, key decisions, and notes are preserved when possible
- **AND** generated structural fields such as status, capabilities, archive path, and directly parsed source boundary may be refreshed

### Requirement: Trace index CLI SHALL archive change cards
The traceability CLI SHALL help move or update cards after OpenSpec archive.

#### Scenario: Archived card is recorded
- **WHEN** `index archive <change-id>` is run after a change is archived
- **THEN** the command records an archived card with archive path, capabilities, summary, key decisions, and commit state when known
- **AND** removes or marks the active card as completed

#### Scenario: Commit may be pending
- **WHEN** no implementation commit hash is available
- **THEN** the archived card may record `Commit: pending`

### Requirement: Trace index CLI SHALL validate index consistency
The traceability CLI SHALL provide an index validation command.

#### Scenario: Active and archived cards are checked
- **WHEN** `index validate` is run
- **THEN** it checks cards against currently present active changes and archive directories
- **AND** reports missing or stale cards

#### Scenario: Index compactness is checked
- **WHEN** `index validate` inspects cards
- **THEN** it reports entries that appear to duplicate full specs, full task lists, or full designs
- **AND** uses deterministic checks such as card size thresholds, copied task checkboxes, and OpenSpec delta headings
