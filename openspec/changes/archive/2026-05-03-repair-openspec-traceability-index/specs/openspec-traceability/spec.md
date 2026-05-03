## ADDED Requirements

### Requirement: Make-index workflow SHALL repair an existing traceability index
When `openspec/INDEX.md` already exists, the make-index workflow SHALL update or repair it from compact current OpenSpec context.

#### Scenario: Existing index is reconciled with current tree
- **GIVEN** `openspec/INDEX.md` exists
- **WHEN** the make-index workflow runs
- **THEN** the index is checked against currently present baseline specs, active changes, and archived changes
- **AND** missing or stale compact cards are updated within the approved source boundary

#### Scenario: Baseline specs are represented
- **WHEN** baseline specs exist under `openspec/specs/`
- **THEN** the index includes compact baseline spec cards for those specs
- **AND** does not copy full requirement bodies into the index

#### Scenario: Active and archived changes are represented
- **WHEN** active or archived OpenSpec changes are present
- **THEN** the index includes compact cards for relevant currently present active and archived changes
- **AND** archived cards include archive paths when known

#### Scenario: Index repair stays compact
- **WHEN** the index is repaired
- **THEN** baseline spec entries summarize status, path, summary, related changes, and key decisions when useful
- **AND** active and archived change entries summarize status, capabilities, summary, source boundaries, related changes, key decisions, archive paths, and commits when useful
- **AND** entries do not duplicate full specs, full task lists, or full designs

#### Scenario: Commit hashes are verified before use
- **WHEN** the index repair records a commit hash
- **THEN** that hash is verified against local git history when possible
- **AND** unverified or unknown commits use `Commit: pending`

#### Scenario: Missing commit remains pending
- **WHEN** a final implementation commit hash is not known during index repair
- **THEN** the index may use `Commit: pending`
- **AND** commit trailers remain the primary git-to-spec link

#### Scenario: Archived classification only changes index placement
- **WHEN** the index repair moves a completed or archived change out of active status
- **THEN** it updates only the index classification or card placement before the explicit archive workflow
- **AND** it does not move OpenSpec change directories as part of pre-review index repair
