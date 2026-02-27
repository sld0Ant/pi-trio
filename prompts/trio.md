---
description: "Trio workflow: Planner → Executor → independent Reviewer sub-agent"
---
Work in **trio** mode for this task: $@

## Workflow

**Phase 1 — Plan** (load skill `planner`):
Read the planner skill and follow its workflow. Understand the task, ask clarifying questions, produce a plan. Then call `trio_plan_review` for independent plan review. Fix if needed. Present the final plan to the user for approval.

**Phase 2 — Execute** (load skill `executor`):
After plan approval, read the executor skill. Implement strictly according to the plan. Track all created/modified files.

**Phase 3 — Code Review**:
After implementation, call the `trio_review` tool:
- `plan`: the full approved plan text
- `files`: absolute paths of all created/modified files
- `specs_dir`: omit (no OpenSpec in this workflow)

If verdict is NEEDS WORK — fix the issues and call `trio_review` again.
If verdict is PASS — report the final result to the user.
