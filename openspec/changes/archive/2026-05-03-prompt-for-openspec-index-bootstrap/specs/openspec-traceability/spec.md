## ADDED Requirements

### Requirement: trio-os planning SHALL ask before bootstrapping a missing traceability index
When an OpenSpec project does not yet have `openspec/INDEX.md`, trio-os planning SHALL ask the user how to proceed instead of silently creating the index or failing the workflow.

#### Scenario: OpenSpec project has no traceability index
- **GIVEN** `openspec/` exists
- **AND** `openspec/INDEX.md` does not exist
- **WHEN** trio-os planning starts
- **THEN** the agent asks the user whether to create a traceability index first, continue without the index for this task, or skip prompting for the current session
- **AND** it does not create `openspec/INDEX.md` automatically without user selection or explicit make-index workflow invocation

#### Scenario: User chooses to create index first
- **GIVEN** the missing-index prompt is shown
- **WHEN** the user chooses to create the traceability index first
- **THEN** the current feature planning flow pauses
- **AND** the workflow starts a separate OpenSpec change for traceability index bootstrap
- **AND** the original requested change does not absorb index creation unless the user explicitly expands scope or the request is already about traceability/index setup
- **AND** the original task can resume after the bootstrap workflow completes

#### Scenario: User chooses to continue without index
- **GIVEN** the missing-index prompt is shown
- **WHEN** the user chooses to continue without the index for this task
- **THEN** trio-os planning continues with normal OpenSpec discovery
- **AND** it uses available baseline specs and active changes as relevant
- **AND** it does not create `openspec/INDEX.md`
- **AND** the choice applies only to the current task

#### Scenario: User chooses to skip for session
- **GIVEN** the missing-index prompt is shown
- **WHEN** the user chooses to skip prompting for the current session
- **THEN** trio-os planning continues without the index
- **AND** the workflow does not ask again in the same conversational/session context
- **AND** no repository config or persistent user setting is written by this choice

#### Scenario: User selection is unavailable or ambiguous
- **GIVEN** `openspec/` exists
- **AND** `openspec/INDEX.md` does not exist
- **WHEN** the user cannot be asked, does not select an option, or gives an ambiguous answer
- **THEN** trio-os planning continues without the index for the current task
- **AND** the workflow notes that traceability index setup was not selected
- **AND** it does not create `openspec/INDEX.md`

#### Scenario: User invokes dedicated make-index workflow
- **WHEN** the user invokes the dedicated traceability index bootstrap workflow
- **THEN** creating or updating `openspec/INDEX.md` is treated as the requested scope
- **AND** unrelated feature work is not mixed into that workflow

#### Scenario: Make-index workflow handles existing index state
- **WHEN** the dedicated make-index workflow runs
- **THEN** it checks whether `openspec/INDEX.md` already exists
- **AND** creates it when missing or updates/repairs it when present

#### Scenario: Make-index workflow preserves review gates
- **WHEN** the dedicated make-index workflow creates or updates the index
- **THEN** it uses normal OpenSpec proposal, plan review, implementation review, archive, and commit-trailer gates
- **AND** it does not bypass review because the user invoked a dedicated workflow

#### Scenario: Traceability setup is already in scope
- **GIVEN** the user request or approved OpenSpec source boundary explicitly includes traceability index setup
- **WHEN** trio-os planning needs `openspec/INDEX.md`
- **THEN** creating or updating the index is allowed within that approved scope
