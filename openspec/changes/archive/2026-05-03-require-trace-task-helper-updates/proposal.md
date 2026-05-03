## Why

We added `openspec-trace` task helpers so agents can update OpenSpec checklist state factually, but the trio-os executor contract still only says to update checkboxes after the fact. It does not require using the helper when available, so agents can keep editing `tasks.md` manually and miss the intended dogfooding/safety path.

We also discussed whether review tools should automatically mark review tasks after an approving implementation-review verdict such as `PASS`. Automatic mutation from the reviewer would blur the reviewer role and can change files after the reviewed pack was produced. The safer process is: reviewers stay read-only, may suggest exact follow-up commands, and executors perform mutations explicitly through the task helper.

## What Changes

- Require trio-os executors to use `openspec-trace run` or `openspec-trace tasks mark` for task checkbox updates when the helper is available and safe to use.
- Document narrow exceptions for manual task checkbox edits.
- Keep reviewer tools read-only; they may suggest exact task-helper commands after PASS, but must not mutate `tasks.md`.
- Update executor/trio-os/reviewer guidance and baseline workflow spec accordingly.

## Related Changes

- `add-openspec-trace-task-runner-cli`
- `implement-trio-workflow-process-contract`
- `add-openspec-trace-review-pack-cli`

## Capabilities

### Modified Capabilities

- `trio-workflow-process-contract`: clarify mandatory helper-backed task updates and reviewer read-only behavior.

## Impact

- Source guidance updates in `skills/executor/SKILL.md`, `prompts/trio-os.md`, and `extensions/trio-reviewer/reviewer-prompt.md`.
- Documentation updates in `README.md` and `CHANGELOG.md`.
- No runtime write automation is added to `trio_review`.

## Rollback

Rollback is to remove the helper-mandate guidance and return to factual-but-manual task checkbox updates. Existing `openspec-trace` task helper behavior remains unchanged.
