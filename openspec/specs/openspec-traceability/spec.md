# openspec-traceability Specification

## Purpose
TBD - created by archiving change add-openspec-traceability-index. Update Purpose after archive.
## Requirements
### Requirement: OpenSpec traceability index SHALL summarize prior changes compactly
The repository SHALL maintain a compact `openspec/INDEX.md` that helps agents and humans find relevant OpenSpec history without loading all archived artifacts.

#### Scenario: Index contains active and archived change cards
- **WHEN** `openspec/INDEX.md` exists
- **THEN** it includes sections for active and archived changes
- **AND** each change card can include status, capability, summary, source boundary, related changes, key decisions, archive path, and commit when known

#### Scenario: Index remains compact
- **WHEN** change history is recorded in the index
- **THEN** entries summarize the change
- **AND** entries do not duplicate full specs, full task lists, or full designs

#### Scenario: Initial index seed uses present OpenSpec history
- **WHEN** the traceability index is introduced
- **THEN** it includes currently present active changes, archived changes, and baseline specs
- **AND** it does not require reconstructing absent historical OpenSpec artifacts

#### Scenario: Existing history can be indexed without rewriting commits
- **WHEN** older OpenSpec changes predate the commit trailer convention
- **THEN** their index cards can record known commit hashes or archive paths
- **AND** git history does not need to be rewritten

### Requirement: trio-os planning SHALL use selective prior-context loading
The trio-os planning workflow SHALL use the traceability index as the first level of prior context when proposing new changes.

#### Scenario: Planner reads index before proposing
- **WHEN** a trio-os planning phase starts and `openspec/INDEX.md` exists
- **THEN** the planner reads the index before creating new OpenSpec artifacts
- **AND** uses it to identify related active changes, archived changes, capabilities, and prior decisions

#### Scenario: Planner loads relevant baseline specs selectively
- **WHEN** the index or task scope identifies relevant capabilities
- **THEN** the planner reads the corresponding baseline specs as needed
- **AND** does not load unrelated baseline specs by default

#### Scenario: Planner loads archived proposal and design selectively
- **WHEN** the index identifies a directly related archived change
- **THEN** the planner may read that change's archived `proposal.md` and `design.md`
- **AND** does not read archived `tasks.md` or full delta specs by default unless a concrete dependency or conflict requires them

#### Scenario: Relatedness has bounded criteria
- **WHEN** the planner decides whether prior context is relevant
- **THEN** it uses bounded criteria such as shared capability, explicit related-change links, shared source boundary or workflow behavior, user-request dependency, or concrete dependency/conflict identified during planning

#### Scenario: New artifacts record related context
- **WHEN** a new OpenSpec change depends on prior decisions or related changes
- **THEN** its proposal or design records those related changes or prior decisions in a compact section

### Requirement: Archive workflow SHALL update the traceability index
The post-review OpenSpec archive workflow SHALL keep `openspec/INDEX.md` aligned with completed changes.

#### Scenario: Archived change is recorded
- **WHEN** an OpenSpec change is archived after implementation review passes
- **THEN** the index is updated with an archived change card
- **AND** the card records the archive path, affected capabilities, summary, and key decisions

#### Scenario: Active card is resolved
- **WHEN** an active change listed in the index is archived
- **THEN** its active card is removed or updated to indicate completion

#### Scenario: Commit hash may be pending before commit
- **WHEN** the index is updated before the final implementation commit exists
- **THEN** the card may record `Commit: pending`
- **AND** that pending value may remain when the commit trailer provides the primary git-to-spec link

### Requirement: OpenSpec implementation commits SHALL include change trailers
Commits implementing an OpenSpec change SHALL include a trailer that identifies the source OpenSpec change unless the commit is outside the OpenSpec workflow.

#### Scenario: Single-change commit includes trailer
- **WHEN** a commit implements an OpenSpec change
- **THEN** the commit message includes `OpenSpec-Change: <change-id>`
- **AND** `<change-id>` is the original active change id
- **AND** it is not the dated archive folder name

#### Scenario: Multi-change commit is traceable
- **WHEN** one commit intentionally covers multiple OpenSpec changes
- **THEN** the commit message includes one `OpenSpec-Change:` trailer per change
- **OR** the work is split into separate commits

#### Scenario: Non-OpenSpec commits are exempt
- **WHEN** a commit is not implementing an OpenSpec change
- **THEN** the trailer is not required

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

