## ADDED Requirements

### Requirement: trio-os workflow SHALL preserve OpenSpec-to-git traceability
The trio-os workflow prompt and executor guidance SHALL connect OpenSpec changes to prior specs and implementation commits without requiring full history dumps.

#### Scenario: Planning starts from traceability index
- **WHEN** trio-os enters OpenSpec propose phase
- **THEN** the workflow instructs the planner to read `openspec/INDEX.md` when present
- **AND** use it to select only relevant baseline specs and archived proposal/design files

#### Scenario: Tasks include traceability post-review operations
- **WHEN** trio-os creates or updates `tasks.md`
- **THEN** post-review operations include updating the traceability index when applicable
- **AND** commit tasks include the `OpenSpec-Change: <change-id>` trailer for OpenSpec implementation commits

#### Scenario: Executor commit guidance includes OpenSpec trailer
- **WHEN** the executor commits work that implements an OpenSpec change
- **THEN** executor guidance instructs it to include `OpenSpec-Change: <change-id>`
- **AND** use the original active change id rather than the dated archive folder name
