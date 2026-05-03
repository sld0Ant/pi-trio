## 1. Pre-implementation validation

- [ ] 1.1 Validate this OpenSpec change strictly.

## 2. Index commands

- [ ] 2.1 Add `index add-active <change-id>` command.
- [ ] 2.2 Add `index archive <change-id>` command.
- [ ] 2.3 Add `index validate` command.

## 3. Index mutation behavior

- [ ] 3.1 Generate active cards from available artifacts.
- [ ] 3.2 Preserve existing human-edited fields when updating cards.
- [ ] 3.3 Move/update active cards to archived cards after archive.
- [ ] 3.4 Record archive path and `Commit: pending` when exact hash is unavailable.

## 4. Index validation behavior

- [ ] 4.1 Check active cards against present active changes.
- [ ] 4.2 Check archived cards against present archive directories.
- [ ] 4.3 Check compactness and reject obvious full artifact dumps.

## 5. Documentation and validation

- [ ] 5.1 Document usage.
- [ ] 5.2 Add focused tests or manual verification notes.
- [ ] 5.3 Run package validation and OpenSpec validation.

## 6. Post-review operations

- [ ] 6.1 Archive after review passes.
- [ ] 6.2 Commit with `OpenSpec-Change: add-openspec-trace-index-cli`.
