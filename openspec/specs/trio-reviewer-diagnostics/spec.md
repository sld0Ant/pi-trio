# trio-reviewer-diagnostics Specification

## Purpose
TBD - created by archiving change add-trio-reviewer-diagnostics. Update Purpose after archive.
## Requirements
### Requirement: Reviewer diagnostics SHALL record safe timing logs
The trio reviewer extension SHALL write local diagnostic metadata for review invocations without exposing raw review content by default.

#### Scenario: Review invocation writes diagnostic log
- **WHEN** `trio_plan_review` or `trio_review` completes
- **THEN** a JSON diagnostic log is written when the log directory is writable
- **AND** the log includes tool name, start time, finish time, total duration, phase durations, applied profiles, input counts or paths, pack size metadata, result verdict metadata, and diagnostic warnings when present
- **AND** each invocation uses a unique log path to avoid concurrent write collisions

#### Scenario: Default log location is local temporary storage
- **WHEN** no log directory override is configured
- **THEN** diagnostic logs are written under `/tmp/pi-trio-review-logs`

#### Scenario: Log directory override is supported
- **WHEN** `TRIO_REVIEW_LOG_DIR` is set
- **THEN** diagnostic logs are written under that directory

#### Scenario: Log permissions are private when supported
- **WHEN** diagnostic log directories or files are created on a platform that honors POSIX file modes
- **THEN** created directories use private permissions equivalent to `0700`
- **AND** created log files use private permissions equivalent to `0600`

#### Scenario: Logging failure does not fail review
- **WHEN** the diagnostic log cannot be created or written
- **THEN** the review still returns its normal verdict
- **AND** tool details include a diagnostic warning when possible

### Requirement: Reviewer diagnostics SHALL avoid raw content by default
The trio reviewer extension SHALL keep default diagnostic logs safe for local troubleshooting without storing raw prompts, full file contents, or full model responses.

#### Scenario: Default logs omit raw review content
- **WHEN** `TRIO_REVIEW_LOG_RAW` is not enabled
- **THEN** diagnostic logs do not include full review packs, full source or spec file contents, full system prompts, or full model responses

#### Scenario: Raw logging is explicit and bounded
- **WHEN** `TRIO_REVIEW_LOG_RAW=1` is set
- **THEN** diagnostic logs may include raw prompt and model response fields
- **AND** each raw string field is limited to 64 KiB measured as UTF-8 bytes while preserving valid string content
- **AND** truncated raw fields are marked with original and stored byte sizes
- **AND** documentation identifies raw logs as sensitive local debug output

### Requirement: Review tools SHALL expose diagnostic details
The trio review tools SHALL return timing and log metadata in tool details while preserving existing detail fields.

#### Scenario: Plan review details include diagnostics
- **WHEN** `trio_plan_review` returns
- **THEN** tool details include `durationMs`
- **AND** include `logPath` when a diagnostic log was written
- **AND** preserve existing `profiles`, `rawVerdict`, and `openspecValidationStatus` fields when applicable

#### Scenario: Code review details include diagnostics
- **WHEN** `trio_review` returns
- **THEN** tool details include `durationMs`
- **AND** include `logPath` when a diagnostic log was written
- **AND** preserve existing `profiles` fields when applicable

#### Scenario: Progress output identifies long-running phases
- **WHEN** the current Pi tool API supports progress output from review tools
- **THEN** major phases such as pack building, profile application, and model call are reported to the user
- **AND** if progress output is not feasible, verification notes document the checked limitation while final diagnostics remain available

