## Context

`extensions/trio-reviewer/index.ts` loads reviewer profiles from built-in, global, and project directories. The current profile flow uses session-global state:

- `activeProfiles`: profiles selected for the session;
- `profilesResolved`: whether selection has been resolved;
- `restoreProfiles()`: restores persisted profile names from a session entry;
- `ensureProfiles()`: restores profiles, shows the picker, or enables all profiles when UI is unavailable;
- `buildPrompt()`: injects active profile contents into reviewer prompts.

Because `openspec` is a built-in profile, it appears in the picker and can be saved as a user-selected profile. That causes two UX problems:

1. Generic `/trio` reviews can accidentally apply OpenSpec-specific checklist guidance.
2. `/trio-os` requires the user to choose a profile that is already implied by `mode: "openspec"` or `specs_dir`.

## Goals / Non-Goals

### Goals

- Make `openspec` a managed profile applied by review context.
- Hide `openspec` from the picker in all workflows.
- Keep the picker available for supplemental user profiles in both generic and OpenSpec workflows.
- Automatically apply `openspec` only for OpenSpec review contexts.
- Prevent persisted old `openspec` selections from leaking into generic reviews.
- Keep tool details/progress accurate by reporting profiles applied to the current invocation.

### Non-Goals

- No changes to profile markdown content.
- No new interactive UI screens or configuration files.
- No changes to planner/executor skill behavior.
- No changes to OpenSpec pack content beyond profile selection behavior.
- No dependency or package metadata changes.

## Decisions

### `openspec` is a managed profile name

Introduce a small managed-profile concept in `index.ts`, initially containing only `openspec`.

Managed profiles are not user-selectable:

- picker input excludes them;
- persisted session profile restoration ignores them;
- no-UI default selection excludes them;
- saved `trio-reviewer-profiles` entries do not include them.

If restored profile names sanitize to empty, including the legacy case where the only saved profile is `openspec`, restoration is treated as unresolved. Interactive sessions show the picker for selectable profiles; non-interactive sessions use the no-UI selectable-profile default. This prevents old sessions or accidental picker choices from making generic reviews OpenSpec-biased.

### Invocation profiles are built per tool call

Keep `activeProfiles` as the session-level user-selected supplemental profiles only. Do not mutate it to include managed profiles for OpenSpec calls.

Build a per-invocation profile map before calling `buildPrompt()`:

- start with `activeProfiles`;
- de-duplicate by profile name;
- add `openspec` from all available profiles only when the current tool call is OpenSpec context;
- keep deterministic order by preserving user-selected profile order and appending managed `openspec` after supplemental profiles;
- pass that invocation map to `buildPrompt()`;
- report invocation profile names in progress text and returned details.

Every current consumer that applies or reports profiles must use invocation profiles rather than session `activeProfiles`: plan-review prompt construction, plan-review progress text, plan-review details, code-review prompt construction, code-review progress text, and code-review details.

This avoids profile bleed:

- `/trio-os` can apply `openspec`;
- a later generic `/trio` review in the same session does not inherit it.

### OpenSpec context detection uses existing tool parameters

The extension does not need to know whether the user typed `/trio` or `/trio-os`.

OpenSpec context is detected from existing tool parameters through a small helper instead of duplicated inline logic:

- `trio_plan_review`: `mode === "openspec"`;
- `trio_review`: `!!specs_dir`.

Generic review context is everything else.

### Picker behavior remains available

For both generic and OpenSpec contexts, `ensureProfiles()` can still show the picker when UI is available and profiles have not been resolved. The picker lists only selectable profiles. In OpenSpec contexts, the managed `openspec` profile is added after picker selection.

If no selectable profiles exist, the picker is skipped and only managed profiles are applied when context requires them.

### Backward compatibility

Existing calls remain valid:

- `trio_plan_review({ plan })` keeps generic behavior and does not apply `openspec`.
- `trio_plan_review({ mode: "openspec", change_dir, plan: "" })` applies `openspec` automatically.
- `trio_review({ specs_dir, ... })` applies `openspec` automatically.
- Old session entries containing `openspec` are sanitized on restore.

## Accepted Trade-offs

- Managed profiles are hardcoded in the extension for now. A configuration system can be added later if more managed profiles are needed.
- The first implementation can keep helper functions in `index.ts` to minimize file churn.
- Generic no-UI reviews continue to enable all selectable profiles by default, but not managed `openspec`.

## Verification

- Run `openspec validate manage-openspec-review-profile --strict`.
- Run `bun build extensions/trio-reviewer/index.ts --target=node --outdir /tmp/pi-trio-build`.
- Run `git diff --check`.
- Manually inspect runtime paths for:
  - picker profile list excludes `openspec`;
  - restored user profiles exclude `openspec`;
  - legacy persisted `["openspec"]` sanitizes to unresolved selection;
  - generic plan review does not include managed `openspec`;
  - OpenSpec plan review includes managed `openspec`;
  - direct generic plan review does not include managed `openspec`;
  - code review with `specs_dir` includes managed `openspec`;
  - code review without `specs_dir` does not include managed `openspec`;
  - no-UI generic uses selectable profiles only;
  - no-UI OpenSpec uses selectable profiles plus managed `openspec`.

## Source Boundary

Allowed implementation files before review:

- `extensions/trio-reviewer/index.ts`
- `README.md`
- `CHANGELOG.md`

Allowed OpenSpec files before review:

- `openspec/changes/manage-openspec-review-profile/**`

Allowed post-review archive outputs after implementation review passes:

- `openspec/specs/trio-workflow-process-contract/spec.md`
- `openspec/changes/archive/**/manage-openspec-review-profile/**`
- removal or movement of `openspec/changes/manage-openspec-review-profile/**` by the archive workflow

If implementation requires other files before review, stop and amend this OpenSpec change before editing them.
