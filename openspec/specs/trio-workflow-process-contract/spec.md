# trio-workflow-process-contract Specification

## Purpose
TBD - created by archiving change implement-trio-workflow-process-contract. Update Purpose after archive.
## Requirements
### Requirement: Executor SHALL preserve the approved trio-os process contract
The executor skill SHALL instruct agents to treat approved OpenSpec artifacts as the implementation contract for trio-os work.

#### Scenario: Source-boundary expansion stops implementation
- **GIVEN** approved OpenSpec artifacts define a source boundary
- **WHEN** implementation requires files, modules, systems, or behaviors outside that boundary
- **THEN** the executor is instructed to stop before editing that out-of-bound scope
- **AND** explain the deviation reason
- **AND** amend OpenSpec artifacts before continuing
- **AND** run strict OpenSpec validation
- **AND** obtain critical-only plan-review approval for the amendment

#### Scenario: Ambiguous or conflicting tasks are not silently reinterpreted
- **GIVEN** `tasks.md` is the approved implementation checklist
- **WHEN** a task is ambiguous, impossible, or conflicts with implementation reality
- **THEN** the executor is instructed to ask for clarification or amend OpenSpec
- **AND** not silently change the intended behavior

#### Scenario: Task checkboxes are factual
- **WHEN** the executor updates task checkboxes
- **THEN** the executor skill instructs it to mark a task complete only after the action happened
- **AND** not mark currently-running review tasks complete before the review result is known
- **AND** not mark post-review archive, baseline validation, commit, push, or deploy tasks complete before those actions happen

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

#### Scenario: Post-review tasks do not block review by default
- **GIVEN** a plan includes archive, baseline sync, commit, push, or deploy steps that must occur after implementation review
- **WHEN** implementation review is running before those steps
- **THEN** the reviewer prompt instructs the reviewer not to classify unchecked post-review tasks as Critical solely because they are pending
- **AND** allow requesting clearer pending-task documentation when needed

#### Scenario: Current review task is not recursively blocking
- **GIVEN** a plan includes a task to run implementation review
- **WHEN** the current review invocation is satisfying that task
- **THEN** the reviewer prompt instructs the reviewer not to treat that checkbox as a Critical failure solely because the result was not known before invocation

#### Scenario: Severity levels are calibrated
- **WHEN** the reviewer reports findings
- **THEN** Critical findings are limited to behavioral breakage in approved scope, security or secret or egress risk, source-boundary violations, direct MUST or SHALL violations, missing required implementation, or incomplete review packs that prevent verification
- **AND** Important findings cover meaningful robustness, documentation, rollback, or focused validation gaps that do not immediately violate core behavior
- **AND** Suggestions cover polish, optional coverage, naming, comments, or ergonomics

#### Scenario: Incomplete review packs are classified explicitly
- **WHEN** reviewed evidence is missing or insufficient
- **THEN** the reviewer prompt instructs the reviewer to report a review-pack completeness issue
- **AND** not infer unrelated implementation defects from missing context

#### Scenario: Reviewer avoids unbounded validation expansion
- **WHEN** validation evidence exists for the approved scope
- **THEN** the reviewer prompt instructs the reviewer not to require exhaustive tests outside the approved risk boundary unless a concrete untested risk violates the OpenSpec contract

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

