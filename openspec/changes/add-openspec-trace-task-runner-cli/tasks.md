## 1. Pre-implementation validation

- [ ] 1.1 Validate this OpenSpec change strictly.

## 2. Command-backed task updates

- [ ] 2.1 Add `run <change-id> --task <task-id> -- <command...>` command.
- [ ] 2.2 Mark the task complete only when the command succeeds.
- [ ] 2.3 Leave task unchanged when the command fails.
- [ ] 2.4 Fail without mutation for missing or ambiguous task ids.

## 3. Task helper commands

- [ ] 3.1 Add `tasks mark <change-id> --task <task-id>` command for explicit factual updates.
- [ ] 3.2 Add `tasks check <change-id> --phase <phase>` command.
- [ ] 3.3 Prevent accidental automatic completion of post-review tasks unless explicitly targeted.

## 4. Documentation and validation

- [ ] 4.1 Document usage.
- [ ] 4.2 Add focused tests or manual verification notes.
- [ ] 4.3 Run package validation and OpenSpec validation.

## 5. Post-review operations

- [ ] 5.1 Archive after review passes.
- [ ] 5.2 Commit with `OpenSpec-Change: add-openspec-trace-task-runner-cli`.
