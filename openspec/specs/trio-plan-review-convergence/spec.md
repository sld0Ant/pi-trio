# trio-plan-review-convergence Specification

## Purpose
Defines OpenSpec-aware plan review convergence for trio-os workflows, including review-depth controls, approvable verdict semantics, OpenSpec review-pack construction, strict validation evidence, baseline spec context, and managed OpenSpec reviewer-profile behavior.

## Requirements
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

### Requirement: Plan review tool SHALL support OpenSpec review packs
The plan-review tool SHALL build a deterministic OpenSpec review pack when requested.

#### Scenario: OpenSpec mode builds pack from change directory
- **WHEN** `trio_plan_review` is called with `mode: "openspec"` and a valid `change_dir`
- **THEN** the tool resolves the change directory under `openspec/changes/`
- **AND** includes `proposal.md`, `design.md`, `tasks.md`, and markdown delta specs under `specs/` in deterministic order
- **AND** missing core artifacts are represented in the pack instead of crashing the tool

#### Scenario: OpenSpec validation is included
- **WHEN** OpenSpec mode builds a review pack
- **THEN** the tool runs `openspec validate <change> --strict` when the CLI is available
- **AND** captures bounded stdout, stderr, exit state, timeout, or not-run state in the pack

#### Scenario: Baseline specs are included when relevant
- **WHEN** delta spec capability directories exist under the change `specs/` directory
- **THEN** corresponding baseline specs from `openspec/specs/<capability>/spec.md` are included when present
- **AND** missing baseline specs are reported rather than crashing the tool

#### Scenario: Review settings are visible
- **WHEN** the OpenSpec review pack is built
- **THEN** it includes review depth, mode, review scope, stop condition, non-goals, and approvable stop truth table

### Requirement: Plan review tool SHALL remain backward compatible for generic calls
Existing direct plan-review usage SHALL continue to work without OpenSpec mode.

#### Scenario: Generic plan review uses supplied plan
- **WHEN** `trio_plan_review` is called with only a `plan` string
- **THEN** the tool reviews that plan without requiring OpenSpec artifacts
- **AND** does not apply OpenSpec review-pack behavior

#### Scenario: Invalid review options are rejected
- **WHEN** callers provide invalid review depth or mode values
- **THEN** tool schema validation rejects those values

### Requirement: trio-os prompt SHALL use OpenSpec plan review convergence
The trio-os workflow SHALL call OpenSpec-aware plan review and stop when the approved stop condition is met.

#### Scenario: Initial plan review uses OpenSpec mode
- **WHEN** trio-os completes OpenSpec proposal artifacts
- **THEN** it calls `trio_plan_review` with `plan: ""`, `mode: "openspec"`, `change_dir`, and `review_depth: "critical_and_important"`
- **AND** it does not pass `tasks.md` alone as the review plan

#### Scenario: Confirmation review can be critical-only
- **WHEN** Critical issues from plan review are fixed
- **THEN** trio-os may call `trio_plan_review` with `review_depth: "critical_only"` for confirmation

#### Scenario: Stop condition recognizes approvable verdicts
- **WHEN** strict OpenSpec validation passes
- **AND** the raw plan-review verdict is `APPROVABLE_WITH_NOTES`, `APPROVED`, or legacy `PASS`
- **THEN** trio-os stops plan review and presents artifacts for implementation approval

#### Scenario: Blocking verdicts continue planning
- **WHEN** validation fails or raw verdict is `BLOCKED`, `NEEDS WORK`, or `UNKNOWN`
- **THEN** trio-os continues fixing or asks the user for guidance

### Requirement: OpenSpec reviewer profile SHALL support plan-review convergence
The managed OpenSpec reviewer profile SHALL align with review depth and stop conditions.

#### Scenario: Profile respects review depth
- **WHEN** an OpenSpec plan review pack includes a review depth
- **THEN** the OpenSpec reviewer profile applies that depth to its findings

#### Scenario: Trade-offs and non-goals are respected
- **WHEN** accepted trade-offs or explicitly scoped non-goals are present
- **THEN** the reviewer does not classify them as Critical unless they contradict requirements or source boundary

#### Scenario: Verification gates are not implementation tasks
- **WHEN** OpenSpec artifacts clearly separate verification gates from implementation checklist tasks
- **THEN** the reviewer does not treat those gates as implementation tasks solely because they are listed separately
