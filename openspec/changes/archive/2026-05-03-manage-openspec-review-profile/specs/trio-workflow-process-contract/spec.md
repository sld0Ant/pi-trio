## ADDED Requirements

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
