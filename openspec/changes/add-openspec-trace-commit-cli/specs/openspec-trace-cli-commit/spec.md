## ADDED Requirements

### Requirement: Trace commit helper SHALL generate OpenSpec trailer messages
The traceability CLI SHALL generate commit message skeletons with OpenSpec change trailers.

#### Scenario: Single change message is generated
- **WHEN** `commit-msg <change-id> --title <title>` is run
- **THEN** output includes the provided title
- **AND** includes `OpenSpec-Change: <change-id>` as a trailer

#### Scenario: Multiple change message is generated
- **WHEN** multiple change ids are provided
- **THEN** output includes one `OpenSpec-Change:` trailer for each change id
- **AND** trailers preserve caller-provided order
- **AND** duplicate change ids are rejected

### Requirement: Trace commit helper SHALL validate OpenSpec trailers
The traceability CLI SHALL validate commit messages for OpenSpec change trailers.

#### Scenario: Expected trailer is present
- **WHEN** `check-commit-msg <file> --change <change-id>` is run
- **THEN** the command passes only if the message includes `OpenSpec-Change: <change-id>`
- **AND** the trailer value is lowercase kebab-case using `a-z`, `0-9`, and `-`

#### Scenario: Dated archive folder is rejected
- **WHEN** a trailer uses a dated archive folder name instead of the original active change id
- **THEN** the command reports a failed validation when the original id can be inferred

#### Scenario: Non-OpenSpec commit can be checked without expected change
- **WHEN** `check-commit-msg <file>` is run without an expected change id
- **THEN** the command validates trailer syntax if trailers are present
- **AND** does not require a trailer by default
