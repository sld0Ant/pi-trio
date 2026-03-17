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
2. **Plan Review** — independent sub-agent reviews tasks.md
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
