# openspec-roadmap-spec Specification

## Purpose
TBD - created by archiving change add-roadmap-spec-artifact. Update Purpose after archive.
## Requirements
### Requirement: Roadmap specs SHALL provide an upper planning layer
A roadmap spec SHALL describe strategic direction and sequencing above individual baseline specs and active OpenSpec changes.

#### Scenario: Roadmap sits above capability specs
- **WHEN** a repository maintains roadmap specs
- **THEN** roadmap specs describe high-level direction, milestones, dependencies, and candidate change slices
- **AND** baseline specs under `openspec/specs/` remain the source of truth for current implemented behavior
- **AND** active changes under `openspec/changes/` remain the implementation contract after approval

#### Scenario: Roadmap does not replace delta specs
- **WHEN** a roadmap identifies a desired future capability
- **THEN** implementing that capability still requires normal OpenSpec proposal, design, delta specs, tasks, approval, implementation review, and archive gates
- **AND** roadmap items are not treated as implemented behavior until corresponding baseline specs and implementation exist

#### Scenario: Roadmap is optional
- **WHEN** a repository does not contain roadmap specs
- **THEN** trio-os planning continues with existing index, baseline spec, and archived-change discovery
- **AND** absence of a roadmap is not treated as a blocker

### Requirement: Roadmap specs SHALL live in a dedicated roadmap directory
Roadmap specs SHALL use a predictable repository-level location separate from baseline specs and active changes.

#### Scenario: Roadmap directory is used
- **WHEN** a repository maintains roadmap specs
- **THEN** roadmap files live under `openspec/roadmaps/`
- **AND** baseline specs remain under `openspec/specs/`
- **AND** active change artifacts remain under `openspec/changes/`

#### Scenario: Roadmap files are markdown documents
- **WHEN** a roadmap spec is created
- **THEN** it is stored as a Markdown file under `openspec/roadmaps/`
- **AND** its filename identifies the roadmap area or theme in kebab-case

### Requirement: Roadmap specs SHALL use compact navigational structure
A roadmap spec SHALL summarize roadmap context without duplicating detailed OpenSpec artifacts.

#### Scenario: Roadmap contains standard sections
- **WHEN** a roadmap spec is created or updated
- **THEN** it includes purpose, scope, current state, target direction, milestones, candidate changes, deferred or non-goal items, and traceability links where applicable

#### Scenario: Roadmap remains compact
- **WHEN** a roadmap references specs, changes, or archived decisions
- **THEN** it links or summarizes them compactly
- **AND** it does not duplicate full baseline specs, full delta specs, full task lists, or full designs

#### Scenario: Roadmap records sequencing decisions
- **WHEN** roadmap milestones depend on each other
- **THEN** the roadmap records dependency order and acceptance signals at a high level
- **AND** detailed implementation tasks remain in change-level `tasks.md` files

### Requirement: trio-os planning SHALL load roadmap context selectively
The trio-os workflow SHALL use roadmap specs as an optional prior-context layer when they are present and relevant.

#### Scenario: Planner reads relevant roadmaps
- **GIVEN** `openspec/roadmaps/` exists
- **WHEN** trio-os planning starts
- **THEN** the planner identifies relevant roadmap specs using the user request, capability names, source boundaries, explicit index links, or concrete dependency/conflict signals
- **AND** reads only relevant roadmap specs by default

#### Scenario: Planner records roadmap influence
- **WHEN** roadmap context affects the selected scope, sequencing, or non-goals of a new OpenSpec change
- **THEN** the new proposal or design records the relevant roadmap file and decision compactly

#### Scenario: Planner avoids roadmap scope drift
- **WHEN** a roadmap contains future milestones outside the current requested change
- **THEN** trio-os planning treats those milestones as context or deferred work
- **AND** it does not silently expand the current change to include unrelated roadmap items

### Requirement: Roadmap traceability SHALL complement the OpenSpec index
Roadmap specs SHALL work with `openspec/INDEX.md` without replacing it.

#### Scenario: Index links to roadmap compactly
- **WHEN** `openspec/INDEX.md` records roadmap-related context
- **THEN** it may link to roadmap files or summarize their scope compactly
- **AND** it does not duplicate roadmap milestone bodies

#### Scenario: Roadmap links to specs and changes
- **WHEN** a roadmap references existing implementation state or planned work
- **THEN** it links to relevant baseline specs, active changes, archived changes, or index cards when available
- **AND** unknown future change ids may be represented as candidate descriptions until they become approved OpenSpec changes

### Requirement: Roadmap guidance SHALL distinguish roadmap intent from implementation requirements
Roadmap workflow guidance SHALL treat roadmap specs as planning context unless a change explicitly promotes roadmap items into approved requirements.

#### Scenario: Plan guidance checks roadmap consistency
- **WHEN** an OpenSpec plan cites a roadmap spec
- **THEN** roadmap guidance requires the proposed scope to be consistent with the roadmap decision being used
- **AND** non-cited future roadmap milestones do not become mandatory scope for the current change

#### Scenario: Implementation guidance checks approved scope only
- **WHEN** implementation review receives specs and files for a change influenced by a roadmap
- **THEN** roadmap guidance requires review of approved delta specs, tasks, and modified artifacts
- **AND** does not require unrelated roadmap milestones to be implemented

