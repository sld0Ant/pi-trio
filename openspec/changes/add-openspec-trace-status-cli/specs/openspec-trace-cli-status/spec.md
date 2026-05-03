## ADDED Requirements

### Requirement: Trace status command SHALL report OpenSpec workflow state
The traceability CLI SHALL provide a read-only status command for a single OpenSpec change.

#### Scenario: Required artifacts are checked
- **WHEN** the status command is run for a change id
- **THEN** it reports whether proposal, design, tasks, and specs artifacts exist
- **AND** missing required artifacts are reported as failed checks

#### Scenario: Validation state is reported
- **WHEN** the status command runs in active-change phase
- **THEN** it runs or reports `openspec validate <change-id> --strict`
- **AND** returns a failed gate when strict validation fails

#### Scenario: Phase readiness is summarized
- **WHEN** the status command is run with a phase
- **THEN** it reports checks relevant to that phase
- **AND** it distinguishes failed gates from warnings and informational notes
- **AND** task-specific readiness uses the same rules as the task-checking command when that helper is available

#### Scenario: Task helper is unavailable
- **WHEN** task-check helper behavior has not been implemented yet
- **THEN** the status command reports task readiness as not checked or warning
- **AND** it does not fail solely because task automation is unavailable

#### Scenario: Source-boundary drift is best-effort checked
- **WHEN** changed files can be compared with approved source-boundary information
- **THEN** the status command reports files that appear outside the boundary
- **AND** fails phases that require source-boundary compliance when a parseable boundary is violated
- **AND** reports a warning instead of a failure when boundary parsing is incomplete

#### Scenario: Command is read-only
- **WHEN** the status command runs
- **THEN** it does not modify repository files
- **AND** it communicates failure through output and exit status

### Requirement: Trace status command SHALL support machine-readable output
The traceability CLI SHALL support a JSON output mode for future automation.

#### Scenario: JSON output is requested
- **WHEN** the status command is run with JSON output enabled
- **THEN** it returns stable fields for change id, phase, checks, severity, and exit state
