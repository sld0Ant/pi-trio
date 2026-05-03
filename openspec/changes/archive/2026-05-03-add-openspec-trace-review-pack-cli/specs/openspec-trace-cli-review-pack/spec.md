## ADDED Requirements

### Requirement: Trace review-pack command SHALL generate trio_review inputs
The traceability CLI SHALL provide a command that prepares review handoff metadata for an OpenSpec change.

#### Scenario: Review pack includes plan and specs
- **WHEN** `review-pack <change-id>` is run
- **THEN** output includes the change `tasks.md` as the plan source
- **AND** includes the change `specs/` directory when present

#### Scenario: Review pack includes modified files
- **WHEN** modified source or documentation files are present
- **THEN** output includes absolute paths for relevant reviewed files
- **AND** includes staged, unstaged, and untracked files by default
- **AND** excludes directories, deleted files, and non-existent paths

#### Scenario: Renamed and deleted files are handled explicitly
- **WHEN** git reports renamed or deleted files
- **THEN** renamed files use the new readable path in reviewed files
- **AND** deleted files are reported separately instead of being passed as reviewed file paths

#### Scenario: OpenSpec planning artifacts are not included by default
- **WHEN** OpenSpec planning artifacts are modified only as workflow artifacts
- **THEN** they are not included in reviewed implementation files by default
- **AND** they may be included when they are relevant verification artifacts, implementation-modified documentation, or part of the active change's implementation source boundary

#### Scenario: Review pack summarizes validation context
- **WHEN** review-pack output is generated
- **THEN** it includes a validation summary section or placeholder
- **AND** lists intentionally pending post-review operations

### Requirement: Trace review-pack command SHALL support JSON output
The review-pack command SHALL provide machine-readable output.

#### Scenario: JSON output is requested
- **WHEN** `review-pack <change-id> --json` is run
- **THEN** output includes stable fields for plan, files, specs directory, validation summary, and pending tasks
