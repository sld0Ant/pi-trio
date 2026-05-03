# pi-trio

Trio workflow for [Pi](https://github.com/badlogic/pi-mono): **Planner → Executor → independent Reviewer sub-agent**.

The Reviewer runs as a separate LLM session with clean context — it sees only the plan, source files, and optionally OpenSpec specs. No chat history, no confirmation bias.

## Install

```bash
pi install git:github.com/sld0Ant/pi-trio
```

Everything is installed in one step — trio skills, prompts, the reviewer extension, and OpenSpec skill. No npm publishing required.

For `/trio-os`, the OpenSpec CLI is also needed. Install it with your preferred package manager. For example, Bun users can run:

```bash
bun add -g @fission-ai/openspec@latest
```

## Commands

### `/trio <task>`

Standard trio workflow:

1. **Planner** — analyzes requirements, asks clarifying questions, produces a plan
2. **Plan Review** — independent sub-agent reviews the plan
3. **User approval** — you confirm or request changes
4. **Executor** — implements strictly according to the plan
5. **Code Review** — independent sub-agent reviews the code
6. Fix loop until review passes

### `/trio-os <task>`

Trio integrated with OpenSpec (spec-driven development):

1. **OpenSpec Propose** — creates proposal, design, specs, tasks
2. **Plan Review** — independent sub-agent reviews the full OpenSpec artifact pack
3. **User approval**
4. **Executor** — implements according to tasks.md
5. **Code Review** — sub-agent reviews code against both plan and OpenSpec specs
6. Fix loop, then auto-archive the OpenSpec change

#### Trio-OS process contract

For OpenSpec-driven work, `tasks.md` is the implementation checklist and task status is factual: tasks are checked only after the action happened. Executors must stop and amend OpenSpec before editing outside an approved source boundary, and review handoffs should include all relevant modified source, docs, specs, verification artifacts, validation results, pending checks, and known limitations.

Implementation review understands workflow gates: archive, baseline sync, commit, push, deploy, and release steps may remain pending until review passes. Reviewers distinguish required implementation failures from post-review tasks and calibrate findings as Critical, Important, or Suggestions within the approved scope.

#### OpenSpec traceability

Repositories may maintain `openspec/INDEX.md` as a compact navigation aid for active and archived changes. `/trio-os` reads the index before proposing new changes, then loads only relevant baseline specs or archived proposal/design files. Index cards should summarize status, capabilities, source boundaries, related changes, key decisions, archive paths, and commits without copying full specs or tasks.

Commits implementing OpenSpec work should include a trailer using the original active change id:

```text
OpenSpec-Change: <change-id>
```

If one commit intentionally covers multiple OpenSpec changes, include one trailer per change or split the commit.

The local trace helper can generate and validate commit messages:

```bash
bun scripts/openspec-trace.ts commit-msg add-openspec-trace-commit-cli --title "feat: add trace commit helper"
bun scripts/openspec-trace.ts check-commit-msg .git/COMMIT_EDITMSG --change add-openspec-trace-commit-cli
```

It emits one `OpenSpec-Change:` trailer per change id, rejects duplicate trailers, validates lowercase kebab-case ids, and rejects dated archive folder names when the original change id can be inferred.

The helper can also update OpenSpec task checkboxes factually:

```bash
bun scripts/openspec-trace.ts run add-example-change --task 3.1 -- openspec validate add-example-change --strict
bun scripts/openspec-trace.ts tasks mark add-example-change --task 4.1
bun scripts/openspec-trace.ts tasks check add-example-change --phase pre-review
```

`run` executes the command as argv without shell interpolation, marks the exact task only after exit status `0`, leaves failed tasks unchanged, and reports missing or ambiguous task ids without mutation. `tasks check` is read-only and reports `pre-review` or `post-review` readiness from heading-based task phases.

The helper can report read-only OpenSpec workflow status:

```bash
bun scripts/openspec-trace.ts status add-example-change --phase pre-review
bun scripts/openspec-trace.ts status add-example-change --phase commit --json
```

`status` checks change/artifact presence, strict OpenSpec validation, working-tree source-boundary drift, task readiness, archive state, and commit-trailer readiness. It uses exit `0` for pass, `1` for failed gates, and `2` for invalid usage or repository errors. JSON output uses a stable v1 shape with `changeId`, `phase`, `resolvedState`, `exitState`, and `checks`.

The helper can maintain the traceability index:

```bash
bun scripts/openspec-trace.ts index add-active add-example-change
bun scripts/openspec-trace.ts index archive add-example-change
bun scripts/openspec-trace.ts index validate
```

`index add-active` creates or updates compact active cards, `index archive` moves or creates archived cards after `openspec archive`, and `index validate` checks active/archive card consistency plus deterministic compactness rules. Generated placeholders use the `TODO(index):` prefix; human-authored summary, related changes, and key decisions are preserved when possible.

The helper can prepare `trio_review` handoff metadata without invoking the review tool:

```bash
bun scripts/openspec-trace.ts review-pack add-example-change
bun scripts/openspec-trace.ts review-pack add-example-change --json
bun scripts/openspec-trace.ts review-pack add-example-change --staged
```

`review-pack` emits the plan path, absolute reviewed file paths, specs directory, deleted files, validation summary, and pending post-review tasks. Default file discovery includes staged, unstaged, and untracked files; `--staged` or `--unstaged` can narrow the scan.

If an OpenSpec project is missing `openspec/INDEX.md`, `/trio-os` asks whether to create the index first, continue without it for the current task, or skip the prompt for the current session. The canonical dedicated prompt-template command for index bootstrap or repair is `/trio-os-make-index`; users asking for `/trio-os:make_index` mean this workflow, but no runtime alias is provided by default.

## What's inside

| Resource | Path | Description |
|----------|------|-------------|
| Extension | `extensions/trio-reviewer/` | Registers `trio_plan_review` and `trio_review` tools (SDK sub-agents) |
| Skill | `skills/planner/` | Universal planner |
| Skill | `skills/executor/` | Universal executor with deviation policy |
| Skill | `skills/openspec/` | OpenSpec (spec-driven development) |
| Prompt | `prompts/trio.md` | `/trio` command |
| Prompt | `prompts/trio-os.md` | `/trio-os` command |
| Prompt | `prompts/openspec.md` | `/openspec` command |

## Standalone review tools

The reviewer tools can be called directly outside of the `/trio` workflow:

- **`trio_plan_review`** — pass any plan text to get an independent review
- **`trio_review`** — pass a plan + file paths to get an independent code review

Just ask the agent: "review this plan with trio_plan_review" or "run trio_review on these files".

### Plan review depth

`trio_plan_review` supports review depth controls:

| Depth | Use when |
|-------|----------|
| `critical_only` | Confirmation pass after blockers were fixed |
| `critical_and_important` | Default planning review |
| `exhaustive` | You explicitly want adversarial review |

Plan review verdicts are:

| Verdict | Meaning |
|---------|---------|
| `BLOCKED` | Critical findings exist or required context is missing |
| `APPROVABLE_WITH_NOTES` | No Critical findings, but notes remain |
| `APPROVED` | No Critical or Important findings |

For backward compatibility, `APPROVABLE_WITH_NOTES`, `APPROVED`, and legacy `PASS` map to tool detail verdict `PASS`; `BLOCKED`, legacy `NEEDS WORK`, and `UNKNOWN` map to `NEEDS WORK`.

### OpenSpec review packs

For OpenSpec changes, review the full artifact pack instead of `tasks.md` alone:

```json
{
  "plan": "",
  "mode": "openspec",
  "change_dir": "openspec/changes/my-change",
  "review_depth": "critical_and_important"
}
```

The pack includes proposal, design, tasks, delta specs, relevant baseline specs when discoverable, review scope, stop condition, and `openspec validate <change> --strict` output. In OpenSpec mode, tool details also include `openspecValidationStatus` (`pass`, `fail`, or `not_run`) for callers that need a structured stop-condition signal.

A confirmation review can use:

```json
{
  "plan": "",
  "mode": "openspec",
  "change_dir": "openspec/changes/my-change",
  "review_depth": "critical_only"
}
```

Stop planning when strict OpenSpec validation passes and the raw verdict is `APPROVABLE_WITH_NOTES`, `APPROVED`, or legacy `PASS`.

## Reviewer diagnostics

`trio_plan_review` and `trio_review` write local timing diagnostics for each invocation. Tool details include `durationMs`, `logPath` when the log was written, `diagnosticWarnings`, and the applied `profiles`.

Default log directory:

```bash
/tmp/pi-trio-review-logs
```

Override it with:

```bash
TRIO_REVIEW_LOG_DIR=/path/to/private/logs
```

Logs are JSON metadata by default: tool name, start/end time, phase durations, profile names, input counts, pack size, and verdict metadata. They do not include full prompts, full file contents, review packs, or model responses by default.

Created log directories/files use private permissions where supported (`0700` directories, `0600` files). If logging fails, reviews still return normally and include a diagnostic warning.

For local debugging only, raw capture can be enabled:

```bash
TRIO_REVIEW_LOG_RAW=1
```

Raw logs may contain prompt and model-response content and should be treated as sensitive. Raw fields are limited to 64 KiB each and include truncation metadata when shortened.

## Reviewer profiles

The reviewer uses profiles — checklists injected into the sub-agent's system prompt. On the first review call in a session, an interactive picker lets you toggle which profiles to apply.

Built-in selectable profiles: `nuxt`, `vue-spa`, `vue-lib`, `vue-testing`, `monorepo`, `docs`.

The `openspec` profile is managed by the reviewer extension. It is hidden from the picker, is not applied to generic `/trio` reviews, and is applied automatically for OpenSpec review contexts (`trio_plan_review` with `mode: "openspec"` or `trio_review` with `specs_dir`).

### Custom profiles

Drop a `.md` file into one of these directories:

| Location | Scope |
|----------|-------|
| `.pi/trio-profiles/*.md` | Project-level (this repo only) |
| `~/.pi/agent/trio-profiles/*.md` | Global (all projects) |

The filename becomes the profile name. The content is a checklist the reviewer follows.

Example `.pi/trio-profiles/fastapi.md`:

```markdown
You are reviewing a FastAPI application. Focus on async correctness, dependency injection, and Pydantic models.

## Endpoints
- [ ] All endpoints use async def (not sync def)
- [ ] Response models defined with Pydantic
- [ ] Path parameters validated with Path(), query with Query()
- [ ] Error responses use HTTPException with proper status codes

## Dependencies
- [ ] Database sessions use Depends() with proper cleanup
- [ ] Auth dependencies are reusable, not duplicated per endpoint
```

Project profiles override built-in ones with the same name. Global profiles override built-in ones too.

## Architecture

```
Main agent (Planner + Executor)
    │
    ├── trio_plan_review tool
    │     └── Sub-agent session (SDK)
    │         System prompt: plan-reviewer-prompt.md
    │         Tools: none
    │         Context: plan text only
    │
    └── trio_review tool
          └── Sub-agent session (SDK)
              System prompt: reviewer-prompt.md
              Tools: none
              Context: plan + file contents + specs
```

The sub-agent inherits the current model from the main session.
