# openspec-trace-cli-status Specification

## Purpose
TBD - created by archiving change add-openspec-trace-status-cli. Update Purpose after archive.
## Requirements
### Requirement: Trace status command SHALL report OpenSpec workflow state
The traceability CLI SHALL provide a read-only status command for a single OpenSpec change.

#### Scenario: Required artifacts are checked
- **WHEN** the status command is run for an active change id
- **THEN** it checks `openspec/changes/<change-id>/proposal.md`, `tasks.md`, `design.md`, and `specs/**/spec.md`
- **AND** missing proposal, tasks, or specs artifacts are reported as failed checks
- **AND** missing design is reported as a warning for active changes

#### Scenario: Archived artifacts are checked
- **WHEN** the status command is run for an archived change id
- **THEN** it resolves `openspec/changes/archive/<date>-<change-id>/`
- **AND** missing proposal, tasks, design, or specs artifacts are reported as failed checks for archive and commit phases

#### Scenario: Validation state is reported
- **WHEN** the status command runs in active-change phase
- **THEN** it runs or reports `openspec validate <change-id> --strict`
- **AND** returns a failed gate when strict validation fails

#### Scenario: Phase readiness is summarized
- **WHEN** the status command is run with a phase
- **THEN** it reports checks relevant to that phase using a defined phase gate matrix
- **AND** it distinguishes `pass`, `fail`, `warn`, `not_checked`, and `skip` states
- **AND** task-specific readiness uses the same rules as the task-checking command when that helper is available
- **AND** warnings, `not_checked`, and `skip` states do not produce a non-zero exit code by themselves

#### Scenario: Task helper is unavailable
- **WHEN** task-check helper behavior has not been implemented yet
- **THEN** the status command reports task readiness as not checked or warning
- **AND** it does not fail solely because task automation is unavailable

#### Scenario: Source-boundary drift is best-effort checked
- **WHEN** changed files can be compared with approved source-boundary information
- **THEN** changed files are discovered from staged, unstaged, and untracked working-tree paths
- **AND** the status command reports files that appear outside the boundary
- **AND** source-boundary violations fail `pre-review` and `post-review` phases
- **AND** source-boundary violations warn for `archive` and `commit` phases
- **AND** incomplete boundary parsing reports a warning instead of a failure

#### Scenario: Command is read-only
- **WHEN** the status command runs
- **THEN** it does not modify repository files
- **AND** it communicates failure through output and exit status

### Requirement: Trace status command SHALL support machine-readable output
The traceability CLI SHALL support a JSON output mode for future automation.

#### Scenario: JSON output is requested
- **WHEN** the status command is run with JSON output enabled
- **THEN** it returns a versioned object with `version`, `changeId`, `phase`, `resolvedState`, `exitState`, and `checks`
- **AND** each check includes `id`, `label`, `state`, `severity`, `message`, and `details`
- **AND** JSON mode uses the same exit code policy as human output

