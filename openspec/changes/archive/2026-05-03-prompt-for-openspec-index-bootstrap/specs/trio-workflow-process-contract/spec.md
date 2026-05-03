## ADDED Requirements

### Requirement: trio-os workflow SHALL avoid missing-index scope drift
The trio-os workflow prompt SHALL preserve user control when a repository has OpenSpec artifacts but lacks the optional traceability index.

#### Scenario: Missing index prompt occurs before proposal creation
- **WHEN** `openspec/` exists and `openspec/INDEX.md` is missing
- **AND** trio-os enters the propose phase
- **THEN** the workflow asks for user direction before creating the requested proposal

#### Scenario: Continuing without index is valid
- **WHEN** the user chooses to continue without the index
- **THEN** the workflow continues with regular OpenSpec planning
- **AND** absence of `openspec/INDEX.md` is not treated as a blocker
- **AND** the choice applies only to the current task

#### Scenario: Index bootstrap is separate work by default
- **WHEN** the user chooses to create the index first
- **THEN** the workflow treats index bootstrap as a separate OpenSpec change by default
- **AND** avoids mixing index bootstrap into unrelated feature scope unless the user explicitly requests that scope expansion or the request is already about traceability/index setup

#### Scenario: Dedicated make-index workflow bootstraps index only
- **WHEN** the user invokes the dedicated make-index workflow
- **THEN** the workflow focuses on traceability index bootstrap or maintenance
- **AND** it checks whether `openspec/INDEX.md` is missing or already present
- **AND** it does not implement unrelated feature work
- **AND** it follows normal OpenSpec proposal, review, implementation, archive, and commit-trailer gates

#### Scenario: Canonical make-index prompt name is documented
- **WHEN** the make-index workflow is documented
- **THEN** `/trio-os-make-index` is identified as the canonical Pi prompt-template command
- **AND** `/trio-os:make_index` is not presented as a working runtime alias unless alias support is implemented

#### Scenario: Session skip is non-persistent
- **WHEN** the user chooses to skip the missing-index prompt for the current session
- **THEN** the workflow suppresses repeated prompts only in the current conversational/session context
- **AND** it does not persist that choice to repository files or configuration

#### Scenario: No user selection falls back safely
- **WHEN** the missing-index choice cannot be collected or is ambiguous
- **THEN** the workflow continues without the index for the current task
- **AND** it does not create traceability index files
