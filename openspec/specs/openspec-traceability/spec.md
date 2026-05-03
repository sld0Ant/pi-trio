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

