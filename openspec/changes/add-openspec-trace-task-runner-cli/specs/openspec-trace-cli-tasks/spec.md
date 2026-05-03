## ADDED Requirements

### Requirement: Trace task runner SHALL mark command-backed tasks factually
The traceability CLI SHALL provide a command runner that marks a task complete only after the associated command succeeds.

#### Scenario: Successful command marks task complete
- **WHEN** `run <change-id> --task <task-id> -- <command>` is run
- **AND** the command exits with status 0
- **THEN** the matching task checkbox is changed from `[ ]` to `[x]`

#### Scenario: Failed command leaves task unchanged
- **WHEN** the command exits with non-zero status
- **THEN** the matching task checkbox remains unchanged
- **AND** the runner exits with a failed status

#### Scenario: Missing or ambiguous task does not mutate files
- **WHEN** the task id is missing or matches multiple checklist entries
- **THEN** the runner reports an error
- **AND** does not modify `tasks.md`

#### Scenario: Command runs without shell interpolation by default
- **WHEN** `run <change-id> --task <task-id> -- <command>` executes the command
- **THEN** the command is executed as argv without shell interpolation by default
- **AND** it runs from the repository root with inherited environment unless explicitly configured otherwise

### Requirement: Trace task helper SHALL support explicit task checks
The traceability CLI SHALL provide task helper commands for explicit factual status updates and phase checks.

#### Scenario: Explicit mark updates one task
- **WHEN** `tasks mark <change-id> --task <task-id>` is run
- **THEN** exactly one matching task is marked complete
- **AND** task ids match dot-separated numeric checklist identifiers such as `1`, `1.2`, or `6.1`
- **AND** missing or ambiguous task ids fail without mutation

#### Scenario: Phase check reports task readiness
- **WHEN** `tasks check <change-id> --phase <phase>` is run
- **THEN** the command reports task readiness for that phase
- **AND** distinguishes implementation tasks from review and post-review tasks when section headings make that possible

#### Scenario: Post-review tasks are not auto-completed accidentally
- **WHEN** task automation runs before post-review actions happen
- **THEN** post-review tasks remain unchecked unless explicitly targeted by the user after the action occurs
