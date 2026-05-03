## 1. Pre-implementation validation

- [x] 1.1 Validate this OpenSpec change strictly.

## 2. Index commands

- [x] 2.1 Add `index add-active <change-id>` command.
- [x] 2.2 Add `index archive <change-id>` command.
- [x] 2.3 Add `index validate` command.

## 3. Index mutation behavior

- [x] 3.1 Generate active cards from available artifacts using the exact index card contract.
- [x] 3.2 Preserve existing human-edited fields and refresh only generated-owned fields or `TODO(index):` placeholders.
- [x] 3.3 Make active-card updates idempotent and fail without mutation on duplicate cards.
- [x] 3.4 Move/update active cards to archived cards only after exactly one archive directory exists.
- [x] 3.5 Record archive path and `Commit: pending` when exact hash is unavailable.

## 4. Index validation behavior

- [x] 4.1 Check active cards against present active changes and fail missing/duplicate/stale cards.
- [x] 4.2 Check archived cards against present archive directories and fail missing/duplicate/stale cards.
- [x] 4.3 Check compactness with 80-line and 6000-character card thresholds.
- [x] 4.4 Reject obvious full artifact dumps via OpenSpec delta headings and task checkbox lists.
- [x] 4.5 Report `TODO(index):` placeholders as warnings and `Commit: pending` as informational.
- [x] 4.6 Implement deterministic validation exit codes: `0` pass, `1` failed checks, `2` usage/missing-index/malformed-index errors.

## 5. Documentation and validation

- [x] 5.1 Document usage.
- [x] 5.2 Add focused tests or manual verification notes.
- [x] 5.3 Run package validation and OpenSpec validation.

## 6. Post-review operations

- [x] 6.1 Archive after review passes.
- [x] 6.2 Commit with `OpenSpec-Change: add-openspec-trace-index-cli`.
