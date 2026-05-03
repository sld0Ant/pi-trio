## 1. Pre-implementation validation

- [ ] 1.1 Validate this OpenSpec change strictly.

## 2. Review-pack command

- [ ] 2.1 Add `review-pack <change-id>` command.
- [ ] 2.2 Add optional JSON output.
- [ ] 2.3 Resolve absolute paths for files and specs directory.

## 3. File discovery

- [ ] 3.1 Discover changed implementation files from git diff/status.
- [ ] 3.2 Exclude directories, missing files, caches, and unrelated generated files.
- [ ] 3.3 Exclude OpenSpec planning artifacts unless they are relevant verification artifacts or implementation-modified docs.

## 4. Handoff summary

- [ ] 4.1 Include plan file path.
- [ ] 4.2 Include specs directory.
- [ ] 4.3 Include validation summary placeholders or discovered results.
- [ ] 4.4 Include pending post-review task summary.

## 5. Documentation and validation

- [ ] 5.1 Document usage.
- [ ] 5.2 Add focused tests or manual verification notes.
- [ ] 5.3 Run package validation and OpenSpec validation.

## 6. Post-review operations

- [ ] 6.1 Archive after review passes.
- [ ] 6.2 Commit with `OpenSpec-Change: add-openspec-trace-review-pack-cli`.
