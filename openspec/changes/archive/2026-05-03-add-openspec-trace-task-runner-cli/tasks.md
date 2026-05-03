## 1. Pre-implementation validation

- [x] 1.1 Validate this OpenSpec change strictly.

## 2. Command-backed task updates

- [x] 2.1 Add `run <change-id> --task <task-id> -- <command...>` command.
- [x] 2.2 Mark the task complete only when the command succeeds.
- [x] 2.3 Leave task unchanged when the command fails.
- [x] 2.4 Fail without mutation for missing or ambiguous task ids.

## 3. Task helper commands

- [x] 3.1 Add `tasks mark <change-id> --task <task-id>` command for explicit factual updates.
- [x] 3.2 Add `tasks check <change-id> --phase <phase>` command.
- [x] 3.3 Prevent accidental automatic completion of post-review tasks unless explicitly targeted.

## 4. Documentation and validation

- [x] 4.1 Document usage.
- [x] 4.2 Add focused tests or manual verification notes.
- [x] 4.3 Run package validation and OpenSpec validation.

## 5. Post-review operations

- [x] 5.1 Archive after review passes.
- [x] 5.2 Commit with `OpenSpec-Change: add-openspec-trace-task-runner-cli`.
