## MODIFIED Requirements

### Requirement: Executor SHALL preserve the approved trio-os process contract
The executor skill SHALL instruct agents to treat approved OpenSpec artifacts as the implementation contract for trio-os work.

#### Scenario: Task checkboxes are factual
- **WHEN** the executor updates task checkboxes
- **THEN** the executor skill instructs it to mark a task complete only after the action happened
- **AND** not mark currently-running review tasks complete before the review result is known
- **AND** not mark post-review archive, baseline validation, commit, push, or deploy tasks complete before those actions happen

#### Scenario: Available task helper is used for checkbox updates
- **GIVEN** the repository provides `scripts/openspec-trace.ts`
- **AND** the helper can be run safely for the current change
- **WHEN** the executor marks an OpenSpec task checkbox complete
- **THEN** it uses `bun scripts/openspec-trace.ts run <change-id> --task <task-id> -- <command...>` for command-backed tasks
- **AND** uses `bun scripts/openspec-trace.ts tasks mark <change-id> --task <task-id>` for explicit factual updates after non-command actions
- **AND** does not manually edit task checkboxes

#### Scenario: Manual checkbox edit exception is documented
- **GIVEN** the task helper is unavailable, broken, or currently being modified in a way that prevents safe use
- **WHEN** the executor must update task checkboxes manually
- **THEN** the executor records the exception reason in the verification notes or review handoff
- **AND** preserves factual checkbox timing rules

### Requirement: Implementation reviewer SHALL understand trio-os workflow gates
The implementation reviewer prompt SHALL distinguish implementation correctness from workflow tasks that are necessarily pending during review.

#### Scenario: Reviewer remains read-only for task updates
- **WHEN** implementation review completes
- **THEN** the reviewer does not mutate `tasks.md`
- **AND** does not require `trio_review` to automatically mark review tasks complete
- **AND** may suggest exact `openspec-trace tasks mark` commands when an approving implementation-review verdict such as `PASS` makes a specific review task eligible to mark
