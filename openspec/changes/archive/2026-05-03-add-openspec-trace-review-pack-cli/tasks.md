## 1. Pre-implementation validation

- [x] 1.1 Validate this OpenSpec change strictly.

## 2. Review-pack command

- [x] 2.1 Add `review-pack <change-id>` command.
- [x] 2.2 Add optional JSON output.
- [x] 2.3 Resolve absolute paths for files and specs directory.

## 3. File discovery

- [x] 3.1 Discover changed implementation files from git diff/status.
- [x] 3.2 Exclude directories, missing files, caches, and unrelated generated files.
- [x] 3.3 Exclude OpenSpec planning artifacts unless they are relevant verification artifacts or implementation-modified docs.

## 4. Handoff summary

- [x] 4.1 Include plan file path.
- [x] 4.2 Include specs directory.
- [x] 4.3 Include validation summary placeholders or discovered results.
- [x] 4.4 Include pending post-review task summary.

## 5. Documentation and validation

- [x] 5.1 Document usage.
- [x] 5.2 Add focused tests or manual verification notes.
- [x] 5.3 Run package validation and OpenSpec validation.

## 6. Post-review operations

- [x] 6.1 Archive after review passes.
- [x] 6.2 Commit with `OpenSpec-Change: add-openspec-trace-review-pack-cli`.
