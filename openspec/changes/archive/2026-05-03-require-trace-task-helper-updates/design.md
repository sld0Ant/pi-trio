## Context

The task helper capability exists and is documented, but process guidance does not yet say that agents should use it. Current instructions say checkboxes are factual and should be marked after completion. That leaves an ambiguity: an executor can satisfy the factual rule while manually editing `tasks.md`, bypassing the helper that was introduced to avoid accidental or premature checkbox updates.

The reviewer side has a related temptation: after `trio_review` returns PASS, the tool could automatically mark the review task complete. That would be convenient, but it would make the independent reviewer mutate the repository after reviewing it, weakening the read-only reviewer role and creating after-review diffs that were not part of the reviewed evidence.

## Goals

- Make helper-backed task checkbox updates the default and required path in pi-trio repositories where the helper is available.
- Preserve explicit, factual mutation: the executor runs `openspec-trace run` or `openspec-trace tasks mark` after the action happened.
- Keep `trio_review` read-only.
- Allow reviewers to suggest exact task-helper commands when a PASS makes a review task eligible to mark.
- Record exceptions when manual checkbox edits are unavoidable.

## Non-Goals

- No runtime mutation by `trio_review`.
- No fuzzy inference of task ids from review results.
- No new CLI command in this slice.
- No changes to task helper matching semantics.

## Prior Decisions Used

- `add-openspec-trace-task-runner-cli` established exact task ids, command-backed factual updates, explicit `tasks mark`, and no automatic post-review task inference.
- `implement-trio-workflow-process-contract` established factual task status and that post-review operations remain pending until actions happen.
- `add-openspec-trace-review-pack-cli` kept review handoff generation read-only and made pending post-review tasks visible.

## Source Boundary

Allowed implementation files before review:

- `skills/executor/SKILL.md`
- `prompts/trio-os.md`
- `extensions/trio-reviewer/reviewer-prompt.md`
- `README.md`
- `CHANGELOG.md`

Allowed OpenSpec files before review:

- `openspec/changes/require-trace-task-helper-updates/**`

Allowed post-review archive/index outputs after implementation review passes:

- `openspec/specs/trio-workflow-process-contract/spec.md`
- `openspec/INDEX.md`
- `openspec/changes/archive/**/require-trace-task-helper-updates/**`
- removal or movement of `openspec/changes/require-trace-task-helper-updates/**` by archive workflow

If implementation requires other source files before review, stop and amend this OpenSpec change before editing them.

## Implementation Approach

### Executor guidance

Add a subsection under factual task status:

- when the repository provides `scripts/openspec-trace.ts`, use:
  - `bun scripts/openspec-trace.ts run <change-id> --task <task-id> -- <command...>` for command-backed tasks;
  - `bun scripts/openspec-trace.ts tasks mark <change-id> --task <task-id>` for explicit factual updates after non-command actions;
- manual checkbox edits are allowed only when the helper is unavailable, broken, or currently being modified in a way that prevents safe use;
- exception reason must be recorded in verification or review handoff.

### trio-os prompt

Update Phase 2 and post-review guidance to reference helper-backed task updates when available. Keep the existing factual and post-review timing rules.

### Reviewer prompt

Clarify that implementation reviewers remain read-only and must not expect `trio_review` to mutate tasks. After an approving implementation-review verdict such as `PASS`, reviewers may suggest exact task-helper commands for tasks that became eligible, but should not require automatic mutation.

### Documentation

Document the process rule in README and changelog in a compact way.

## Validation

- `openspec validate require-trace-task-helper-updates --strict`
- `bun build extensions/trio-reviewer/index.ts --target=node --outdir /tmp/pi-trio-reviewer-build`
- `git diff --check`

## Accepted Trade-offs

- This relies on instruction compliance rather than hard enforcement.
- Reviewers can suggest commands only when task ids are explicit; no task id inference is introduced.
- Manual edits remain possible with documented exceptions so agents are not blocked if the helper itself is broken.
