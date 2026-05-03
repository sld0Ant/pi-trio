## Context

`add-openspec-traceability-index` introduced `openspec/INDEX.md` as optional traceability infrastructure. The trio-os prompt now reads the index when it exists. It does not yet specify what an agent should do when:

- `openspec/` exists;
- `openspec/INDEX.md` does not exist;
- the user's task is not explicitly about creating traceability infrastructure.

The desired behavior is to keep user control and prevent accidental scope expansion.

## Prior Decisions Used

- The traceability index is a compact navigation aid, not a replacement for baseline specs.
- The planner should load prior context progressively and avoid full history dumps.
- Post-review workflow tasks remain pending until their actions happen.
- Creating or updating traceability infrastructure is scopeful work and should be explicit.

## Goals / Non-Goals

### Goals

- Ask the user before creating `openspec/INDEX.md` when an OpenSpec project lacks one.
- Let the user continue without an index for the current task.
- Let the user skip repeated prompts for the current session.
- Recommend a separate bootstrap OpenSpec change when the user chooses index creation.
- Add a dedicated prompt-template workflow for explicit traceability index bootstrap.
- Keep normal OpenSpec planning available when the index is absent.

### Non-Goals

- No automatic index creation in this slice.
- No new runtime extension or TUI behavior.
- No persistent configuration for suppressing future prompts.
- No implementation of automatic index generation.
- No changes to OpenSpec CLI behavior.

## Decisions

### Missing-index state triggers a user choice

When trio-os planning starts, check for this state:

```text
openspec/ exists
openspec/INDEX.md missing
```

If true, ask the user how to proceed before creating the proposal for the requested task. If the user does not choose an option, gives an ambiguous answer, or the environment cannot ask interactively, continue without the index for the current task and state that the traceability index was unavailable/not selected. Do not create the index by default.

The prompt should offer three choices:

1. `Create traceability index first`
   - Stop the current feature planning flow.
   - Start a separate OpenSpec change for index bootstrap, such as `bootstrap-openspec-traceability-index`.
   - Do not absorb index creation into the original requested change unless the user explicitly expands scope or the original request is already about traceability/index setup.
   - Return to the original task after the bootstrap workflow completes.
2. `Continue without index for this task`
   - Continue the current OpenSpec planning flow using available baseline specs and active changes.
   - Do not create `openspec/INDEX.md`.
3. `Skip index prompt for this session`
   - Continue without the index.
   - Do not ask again in the current session.
   - Do not persist this choice to repository config.

### Dedicated make-index workflow

Add a prompt template dedicated to traceability index bootstrap. In Pi prompt-template naming this should be implemented as `prompts/trio-os-make-index.md`, exposed canonically as `/trio-os-make-index`. Documentation may mention that this is the pi-trio equivalent for users asking for `/trio-os:make_index` style behavior, but it must not imply a runtime alias unless one is implemented later.

The make-index workflow should:

- state `/trio-os-make-index` as the canonical prompt invocation;
- work only on traceability index bootstrap/setup;
- check whether `openspec/INDEX.md` already exists;
- create a new index when missing or update/repair the existing index when present;
- create or update `openspec/INDEX.md` through a normal OpenSpec change;
- read existing OpenSpec specs, active changes, and archived changes compactly;
- avoid implementing unrelated feature work;
- use the same plan review, implementation review, archive, and commit trailer rules as `/trio-os`;
- not bypass plan review, implementation review, archive, or commit-trailer gates.

### Do not create index implicitly

The workflow must not create `openspec/INDEX.md` as a side effect of unrelated feature planning. Index creation is allowed only when:

- the user chooses the create-index option;
- the user invokes the dedicated make-index workflow;
- the user request itself is about traceability/index setup;
- an approved OpenSpec source boundary includes index creation.

### Continue mode is a valid fallback

Continuing without the index is valid. In that case, the planner should use normal OpenSpec discovery and any directly relevant specs or active changes available from the repository. It may mention in the proposal/design that no traceability index was present if that fact affects planning context, but it should not force index creation.

### Session skip is local only

The skip-for-session choice is a conversation/workflow convenience. It suppresses repeated missing-index prompts only in the current conversational/session context. It should not add repository config, commit state, or user settings in this instruction-only slice.

## Accepted Trade-offs

- The prompt relies on the agent asking the user rather than an extension-level picker. A future runtime command could automate the selection UX.
- Documentation should describe this as agent workflow guidance, not an automated extension/runtime feature.
- Session skip is instruction-level behavior and may not survive agent restarts.
- The bootstrap workflow name is a recommendation, not a required fixed change id.
- The user-facing shorthand `/trio-os:make_index` may be documented as intent, while the Pi prompt file should use the existing hyphenated prompt-template style. Documentation must call `/trio-os-make-index` canonical unless a runtime alias is implemented later.

## Verification

- Run `openspec validate prompt-for-openspec-index-bootstrap --strict`.
- Run `git diff --check`.
- Confirm docs/prompt changes stay within source boundary.
- Confirm wording does not require creating `openspec/INDEX.md` automatically.

## Source Boundary

Allowed implementation files before review:

- `prompts/trio-os.md`
- `prompts/trio-os-make-index.md`
- `README.md`
- `CHANGELOG.md`
- `openspec/INDEX.md`

Allowed OpenSpec files before review:

- `openspec/changes/prompt-for-openspec-index-bootstrap/**`

Allowed post-review archive outputs after implementation review passes:

- `openspec/specs/openspec-traceability/spec.md`
- `openspec/specs/trio-workflow-process-contract/spec.md`
- `openspec/changes/archive/**/prompt-for-openspec-index-bootstrap/**`
- removal or movement of `openspec/changes/prompt-for-openspec-index-bootstrap/**` by the archive workflow

If implementation requires other files before review, stop and amend this OpenSpec change before editing them.
