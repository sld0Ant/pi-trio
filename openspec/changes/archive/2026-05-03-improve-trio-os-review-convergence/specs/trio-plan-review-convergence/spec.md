## ADDED Requirements

### Requirement: Support review depth for plan reviews
The plan-review tool SHALL allow callers to specify how aggressively the independent reviewer searches for issues.

#### Scenario: Critical-only review suppresses non-blocking feedback
- **WHEN** `trio_plan_review` is called with `review_depth: "critical_only"`
- **THEN** the review request tells the reviewer to report only Critical implementation blockers
- **AND** non-blocking Important/Suggestion items do not force a blocking verdict

#### Scenario: Default review includes important issues
- **WHEN** `trio_plan_review` is called without `review_depth`
- **THEN** the effective review depth is `critical_and_important`
- **AND** the reviewer may report Critical and Important findings

#### Scenario: Exhaustive review remains available
- **WHEN** `trio_plan_review` is called with `review_depth: "exhaustive"`
- **THEN** the review request permits a full adversarial plan review

### Requirement: Return approvable non-blocking verdicts
The plan reviewer SHALL distinguish blocked plans from approvable plans with notes.

#### Scenario: Critical findings block implementation
- **WHEN** the reviewer finds one or more Critical findings or required review context is missing or invalid
- **THEN** the textual verdict is `BLOCKED`
- **AND** the tool details map the result to `NEEDS WORK` for backward compatibility

#### Scenario: No critical findings are approvable with notes
- **WHEN** the reviewer finds no Critical findings but has Important or Suggestion findings
- **THEN** the textual verdict is `APPROVABLE_WITH_NOTES`
- **AND** the tool details map the result to `PASS`

#### Scenario: Clean review is approved
- **WHEN** the reviewer finds no Critical or Important findings
- **THEN** the textual verdict is `APPROVED`
- **AND** the tool details map the result to `PASS`

#### Scenario: Legacy verdicts remain supported
- **WHEN** a reviewer response contains legacy `PASS` or `NEEDS WORK`
- **THEN** verdict parsing continues to map `PASS` to `PASS`
- **AND** `NEEDS WORK` maps to `NEEDS WORK`

#### Scenario: Unknown verdicts are not approvable
- **WHEN** a reviewer response does not contain a known verdict
- **THEN** tool details include `rawVerdict: "UNKNOWN"`
- **AND** the compatibility verdict maps to `NEEDS WORK`

### Requirement: Build OpenSpec review packs
The plan-review tool SHALL be able to review an OpenSpec change from its artifact directory instead of requiring the caller to manually concatenate files.

#### Scenario: OpenSpec mode reads change artifacts
- **WHEN** `trio_plan_review` is called with `plan: ""`, `mode: "openspec"`, and `change_dir`
- **THEN** the tool verifies the canonical `change_dir` is exactly one directory level below the repository `openspec/changes` root
- **AND** the review prompt includes `proposal.md`, `design.md`, `tasks.md`, and regular markdown delta specs under `specs/`
- **AND** symlinks or files escaping the allowed OpenSpec roots are skipped or reported
- **AND** missing optional artifacts are represented in the pack instead of crashing the tool

#### Scenario: Baseline specs are included when discoverable
- **WHEN** OpenSpec mode has `include_baseline_specs` enabled or omitted
- **THEN** relevant baseline specs under `openspec/specs/<capability>/spec.md` are included when they can be discovered from delta spec directories under `specs/<capability>/`
- **AND** missing baseline specs are reported as unavailable rather than failing the tool

#### Scenario: OpenSpec validation result is included
- **WHEN** the OpenSpec CLI is available
- **THEN** the review pack includes the command and output for `openspec validate <change> --strict`, where `<change>` is the verified canonical one-level child directory name under `openspec/changes/`
- **AND** validation runs without a shell from the repository root with bounded runtime and bounded captured output
- **AND** failed validation output is included in the pack

#### Scenario: Missing OpenSpec CLI does not crash review
- **WHEN** the OpenSpec CLI is not available
- **THEN** the review pack marks validation as not run
- **AND** the review still proceeds with available artifacts

#### Scenario: Direct plan review remains backward compatible
- **WHEN** `trio_plan_review` is called with only `plan`
- **THEN** the tool reviews the provided plan text as before
- **AND** no OpenSpec file reading is required

### Requirement: Include review scope and stop condition in OpenSpec reviews
OpenSpec review packs SHALL tell the reviewer what to review, what not to review, and when planning may stop.

#### Scenario: Review scope is explicit
- **WHEN** an OpenSpec review pack is built
- **THEN** it includes a review scope focused on blockers, contradictions, source-boundary conflicts, OpenSpec traceability, and unsafe undefined behavior inside the stated scope
- **AND** it excludes future slices, unrelated architecture alternatives, docs-site work unless in scope, and exhaustive hardening outside accepted trade-offs

#### Scenario: Stop condition is explicit
- **WHEN** an OpenSpec review pack is built
- **THEN** it states that strict OpenSpec validation plus no Critical findings makes the plan approvable

#### Scenario: Caller-provided scope can be included
- **WHEN** `review_scope` or `stop_condition` parameters are provided
- **THEN** the review pack includes those caller-provided values

### Requirement: Make trio-os use OpenSpec review packs
The trio-os workflow prompt SHALL instruct agents to review OpenSpec changes as artifact packs and stop review when Critical findings are gone.

#### Scenario: Initial trio-os plan review uses full pack
- **WHEN** `/trio-os` reaches plan review after proposal/design/spec/tasks creation
- **THEN** it instructs the agent to call `trio_plan_review` with `plan: ""`, `mode: "openspec"`, the change directory, and `review_depth: "critical_and_important"`
- **AND** it does not instruct the agent to review `tasks.md` alone

#### Scenario: Confirmation review is critical-only
- **WHEN** Critical findings have been fixed after an initial OpenSpec plan review
- **THEN** `/trio-os` instructs the agent to use `review_depth: "critical_only"` for confirmation review

#### Scenario: Critical-free review stops planning
- **WHEN** strict OpenSpec validation passes
- **AND** confirmation review raw verdict is `APPROVABLE_WITH_NOTES`, `APPROVED`, or legacy `PASS`
- **THEN** `/trio-os` instructs the agent to stop plan review
- **AND** present artifacts to the user for implementation approval

#### Scenario: Unknown or blocked verdict continues planning
- **WHEN** confirmation review raw verdict is `BLOCKED`, `NEEDS WORK`, or `UNKNOWN`
- **THEN** `/trio-os` does not treat the plan as approved
- **AND** it continues fixing or asks the user for guidance

### Requirement: Keep OpenSpec profile compatible with verification gates
The OpenSpec reviewer profile SHALL allow clearly separated verification gates without treating them as incomplete implementation tasks.

#### Scenario: Verification gates are not implementation checklist tasks
- **WHEN** tasks or plan packs clearly separate verification gates from implementation tasks
- **THEN** the reviewer does not require each verification gate to map to a concrete code change
- **AND** implementation checklist items still require traceability to specs and design

#### Scenario: Accepted trade-offs are respected
- **WHEN** a plan pack states accepted trade-offs and non-goals
- **THEN** the reviewer does not relitigate them as Critical unless they contradict requirements or source boundary
