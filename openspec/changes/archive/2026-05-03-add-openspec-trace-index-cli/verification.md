# Verification Notes

## Plan review

- `openspec validate add-openspec-trace-index-cli --strict` passed before implementation.
- Initial `trio_plan_review` returned `BLOCKED` for underspecified compactness thresholds, placeholder ownership rules, and validation output/exit behavior.
- The OpenSpec design/spec/tasks were amended to define the index contract, `TODO(index):` placeholder contract, compactness thresholds, idempotency, archive behavior, validation states, and exit codes.
- Critical-only `trio_plan_review` returned `APPROVED`.

## Manual CLI checks

Ran against a temporary OpenSpec fixture using the repository script path.

### Active card generation

```bash
bun scripts/openspec-trace.ts index add-active change-one
```

Result: created a compact active card with capability `cap-one`, path-like source-boundary entries, `TODO(index):` placeholders, `Archive path: pending`, and `Commit: pending`.

### Source-boundary parsing

Result: path-like bullets such as `scripts/openspec-trace.ts`, `README.md`, `CHANGELOG.md`, and `src/foo.ts` were captured. Prose bullet `prose with spaces should be skipped` was not captured.

### Idempotency

Running `index add-active change-one` twice produced no file change on the second run.

### Human field preservation

After replacing the generated summary placeholder with `Human summary`, rerunning `index add-active change-one` preserved `Human summary`.

### Duplicate card rejection

Adding a duplicate `### change-one` active card caused `index add-active change-one` to fail without updating the index. `index validate` also reports duplicate cards as failed checks and exits `1`.

### Validation usage errors

Passing an unexpected positional argument to `index validate` exits `2`.

### Archive folder exact match

A directory named `2026-05-03-foo-change` does not satisfy `index archive change`; archive lookup requires an exact `<date>-<change-id>` folder.

### Human notes preservation

Existing unknown human-owned fields such as `Notes:` are preserved when archiving or regenerating a card.

### Pending source boundary warning

Cards with `- Source boundary: pending` are reported as warnings by `index validate`.

### Archive directory coverage

Two archive directories for the same original change id cause `index validate` to fail. Malformed archive directory names also fail validation. Stray non-directory files under `openspec/changes/` are ignored by active change discovery.

### Compactness line threshold

A card with exactly 80 visible lines and the normal trailing newline does not fail the 80-line compactness threshold.

### Full design and index contract checks

Cards containing markdown `##` design headings fail compactness validation. `index validate` also fails indexes missing the `## Baseline Specs` section or cards missing an exact required field label such as `- Commit:`. Active and archived section parsing uses line-anchored headings.

### Empty archive path rejection

Archived cards with an empty `- Archive path:` field fail validation.

### Archive card update

```bash
bun scripts/openspec-trace.ts index archive old-change
```

Result: created/updated an archived card with `Archive path: \`openspec/changes/archive/2026-05-03-old-change/\`` and `Commit: pending`.

### Compactness validation

Adding a copied task checkbox to a card caused `index validate` to fail with `card contains task checkboxes`.

## Project validation

```bash
bun build scripts/openspec-trace.ts --target=bun --outdir /tmp/pi-trace-build
openspec validate add-openspec-trace-index-cli --strict
bun install --frozen-lockfile
git diff --check
bun scripts/openspec-trace.ts index validate
```

Result: all commands passed for the project tree.
