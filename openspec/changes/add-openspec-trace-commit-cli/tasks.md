## 1. Pre-implementation validation

- [ ] 1.1 Validate this OpenSpec change strictly.

## 2. Commit message generation

- [ ] 2.1 Add `commit-msg <change-id> --title` command.
- [ ] 2.2 Support multiple change ids.
- [ ] 2.3 Output a commit message with one `OpenSpec-Change:` trailer per change.

## 3. Commit message validation

- [ ] 3.1 Add `check-commit-msg <file>` command.
- [ ] 3.2 Validate trailer key and value format.
- [ ] 3.3 Reject dated archive folder names when original change id can be inferred.
- [ ] 3.4 Support optional expected `--change <change-id>` validation.

## 4. Documentation and validation

- [ ] 4.1 Document usage.
- [ ] 4.2 Add focused tests or manual verification notes.
- [ ] 4.3 Run package validation and OpenSpec validation.

## 5. Post-review operations

- [ ] 5.1 Archive after review passes.
- [ ] 5.2 Commit with `OpenSpec-Change: add-openspec-trace-commit-cli`.
