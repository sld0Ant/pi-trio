# pi-trio

Trio workflow for [Pi](https://github.com/badlogic/pi-mono): **Planner → Executor → independent Reviewer sub-agent**.

The Reviewer runs as a separate LLM session with clean context — it sees only the plan, source files, and optionally OpenSpec specs. No chat history, no confirmation bias.

## Install

```bash
pi install git:github.com/sld0Ant/pi-trio
```

Everything is installed in one step — trio skills, prompts, the reviewer extension, and OpenSpec skill. No npm publishing required.

For `/trio-os`, the OpenSpec CLI is also needed:

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

## Reviewer profiles

The reviewer uses profiles — checklists injected into the sub-agent's system prompt. On the first review call in a session, an interactive picker lets you toggle which profiles to apply.

Built-in profiles: `nuxt`, `vue-spa`, `vue-lib`, `vue-testing`, `monorepo`, `docs`, `openspec`.

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
