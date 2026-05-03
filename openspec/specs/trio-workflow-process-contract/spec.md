# trio-workflow-process-contract Specification

## Purpose
TBD - created by archiving change implement-trio-workflow-process-contract. Update Purpose after archive.
## Requirements
### Requirement: Executor SHALL preserve the approved trio-os process contract
The executor skill SHALL instruct agents to treat approved OpenSpec artifacts as the implementation contract for trio-os work.

#### Scenario: Task checkboxes are factual
- **WHEN** the executor updates task checkboxes
- **THEN** the executor skill instructs it to mark a task complete only after the action happened
- **AND** not mark currently-running review tasks complete before the review result is known
- **AND** not mark post-review archive, baseline validation, commit, push, or deploy tasks complete before those actions happen

#### Scenario: Available task helper is used for checkbox updates
- **GIVEN** the repository provides `scripts/openspec-trace.ts`
- **AND** the helper can be run safely for the current change
- **WHEN** the executor marks an OpenSpec task checkbox complete
- **THEN** it uses `bun scripts/openspec-trace.ts run <change-id> --task <task-id> -- <command...>` for command-backed tasks
- **AND** uses `bun scripts/openspec-trace.ts tasks mark <change-id> --task <task-id>` for explicit factual updates after non-command actions
- **AND** does not manually edit task checkboxes

#### Scenario: Manual checkbox edit exception is documented
- **GIVEN** the task helper is unavailable, broken, or currently being modified in a way that prevents safe use
- **WHEN** the executor must update task checkboxes manually
- **THEN** the executor records the exception reason in the verification notes or review handoff
- **AND** preserves factual checkbox timing rules

### Requirement: Executor SHALL provide complete implementation-review evidence
The executor skill SHALL instruct agents to provide enough review evidence for an independent implementation reviewer to verify compliance without hidden conversation or terminal history.

#### Scenario: Review pack contains relevant modified artifacts
- **WHEN** the executor calls implementation review
- **THEN** it is instructed to include every relevant created or modified source, spec, documentation, and verification artifact
- **AND** avoid passing directories, unrelated paths, or non-existent paths as reviewed files
- **AND** provide OpenSpec specs through the designated specs directory when available

#### Scenario: Review handoff summarizes validation
- **WHEN** the executor calls implementation review
- **THEN** it is instructed to summarize completed validation commands, results, pending or skipped checks, and known environmental limitations
- **AND** identify intentionally pending post-review tasks as pending

#### Scenario: Verification artifacts record completed facts only
- **WHEN** the executor writes verification notes, smoke reports, or audit logs
- **THEN** it is instructed to record completed commands and observed results only
- **AND** not predict future review, archive, commit, push, or deploy outcomes
- **AND** record historical failures and later passes as separate events when both occurred

#### Scenario: Validation tools match artifact kind
- **WHEN** the executor runs validation
- **THEN** it is instructed to apply validation tools only to artifact kinds those tools are intended to validate
- **AND** avoid language-specific linters on unrelated prose or specification artifacts unless explicitly supported

### Requirement: Implementation reviewer SHALL understand trio-os workflow gates
The implementation reviewer prompt SHALL distinguish implementation correctness from workflow tasks that are necessarily pending during review.

#### Scenario: Reviewer remains read-only for task updates
- **WHEN** implementation review completes
- **THEN** the reviewer does not mutate `tasks.md`
- **AND** does not require `trio_review` to automatically mark review tasks complete
- **AND** may suggest exact `openspec-trace tasks mark` commands when an approving implementation-review verdict such as `PASS` makes a specific review task eligible to mark

### Requirement: trio-os SHALL separate implementation, validation, review handoff, and post-review tasks
The trio-os workflow prompt SHALL instruct agents to keep task phases separate so implementation review does not conflict with post-review operations.

#### Scenario: Planning asks for phase-separated tasks
- **WHEN** trio-os creates OpenSpec planning artifacts
- **THEN** the workflow prompt asks for task sections that distinguish implementation, focused validation, review handoff, and post-review operations when applicable

#### Scenario: Execution keeps post-review tasks pending until they happen
- **WHEN** trio-os execution updates task checkboxes
- **THEN** the workflow prompt instructs that post-review operations remain pending until their actions actually happen

#### Scenario: Archive and commit occur after review passes
- **WHEN** implementation review passes
- **THEN** the workflow prompt allows archive, baseline validation, commit, push, or deploy operations to proceed according to the project workflow
- **AND** their completion is recorded only after they happen

### Requirement: Workflow process contract SHALL remain platform-neutral
The implemented process guidance SHALL remain reusable across languages, frameworks, runtimes, package managers, and repository hosts.

#### Scenario: Instructions use generic process terms
- **WHEN** executor, reviewer, and trio-os prompts describe the process contract
- **THEN** they use generic terms such as source boundary, artifact kind, review pack, validation command, verification note, and post-review task
- **AND** they do not require a specific language, framework, runtime, package manager, CI system, or hosting provider

#### Scenario: Project-specific command choices remain local
- **WHEN** a project applies the trio-os workflow
- **THEN** project-specific validation commands and deployment steps are supplied by that project's instructions or OpenSpec tasks
- **AND** pi-trio guidance does not hardcode those project-specific choices

### Requirement: OpenSpec reviewer profile SHALL be managed by review context
The reviewer extension SHALL treat the built-in `openspec` profile as a managed profile rather than a user-selectable supplemental profile.

#### Scenario: Picker excludes openspec for all workflows
- **WHEN** the reviewer profile picker is shown
- **THEN** it lists user-selectable supplemental profiles
- **AND** it does not list the managed `openspec` profile

#### Scenario: Persisted openspec selection is ignored
- **GIVEN** an older session entry contains `openspec` as a saved reviewer profile name
- **WHEN** profiles are restored
- **THEN** `openspec` is ignored as a user-selected profile
- **AND** generic reviews do not apply it from persisted state

#### Scenario: Sanitized-empty persisted profiles remain unresolved
- **GIVEN** an older session entry contains only managed profile names such as `openspec`
- **WHEN** profiles are restored and all names are filtered out
- **THEN** profile selection remains unresolved
- **AND** an interactive review can show the picker for selectable profiles
- **AND** a non-interactive review can use the no-UI selectable-profile default

#### Scenario: Generic reviews do not apply openspec
- **WHEN** `trio_plan_review` is called without OpenSpec mode
- **THEN** the managed `openspec` profile is not applied

#### Scenario: OpenSpec plan reviews apply openspec automatically
- **WHEN** `trio_plan_review` is called with `mode: "openspec"`
- **THEN** the managed `openspec` profile is applied automatically
- **AND** the picker remains available for additional user-selectable profiles when applicable

#### Scenario: Code reviews with specs apply openspec automatically
- **WHEN** `trio_review` is called with `specs_dir`
- **THEN** the managed `openspec` profile is applied automatically
- **AND** the picker remains available for additional user-selectable profiles when applicable

#### Scenario: Code reviews without specs do not apply openspec
- **WHEN** `trio_review` is called without `specs_dir`
- **THEN** the managed `openspec` profile is not applied

#### Scenario: Managed openspec does not bleed between invocations
- **GIVEN** an OpenSpec review invocation applied the managed `openspec` profile
- **WHEN** a later generic review runs in the same session
- **THEN** the generic review does not inherit `openspec` from the previous invocation

#### Scenario: Tool details report actual invocation profiles
- **WHEN** a review tool returns details
- **THEN** `details.profiles` includes the profiles applied to that invocation
- **AND** OpenSpec review details include `openspec`
- **AND** generic review details do not include `openspec` unless a future explicit OpenSpec context applies it

#### Scenario: Invocation profile order is stable
- **WHEN** user-selected profiles and managed profiles are combined for a review invocation
- **THEN** duplicate profile names are removed
- **AND** user-selected profiles keep their selected order
- **AND** managed `openspec` is appended after user-selected profiles when it applies

#### Scenario: No-UI generic reviews exclude managed openspec
- **WHEN** a generic review runs without interactive UI
- **THEN** the default selected profiles exclude managed `openspec`

#### Scenario: No-UI OpenSpec reviews include managed openspec
- **WHEN** an OpenSpec review runs without interactive UI
- **THEN** the default selected profiles include selectable profiles plus managed `openspec`

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

