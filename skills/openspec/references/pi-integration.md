# OpenSpec Integration with Pi

## How OpenSpec integrates with Pi

OpenSpec on initialization (`openspec init --tools pi`) generates two types of files:

### Skills (`.pi/skills/openspec-*/SKILL.md`)

Each OPSX command is generated as a separate skill:

```
.pi/skills/
├── openspec-propose/SKILL.md
├── openspec-explore/SKILL.md
├── openspec-apply-change/SKILL.md
└── openspec-archive-change/SKILL.md
```

Pi auto-discovers these skills and exposes them to the agent. When a task matches, the agent loads the full SKILL.md and follows the instructions.

### Prompt Templates (`.pi/prompts/opsx-*.md`)

Prompt templates give quick access to commands via `/`:

```
.pi/prompts/
├── opsx-propose.md
├── opsx-explore.md
├── opsx-apply.md
└── opsx-archive.md
```

The user types `/opsx-propose add-dark-mode` — the template expands into a prompt, arguments are passed according to the format defined by OpenSpec.

## How skills and prompts interact

```
User: /opsx-propose add-dark-mode
         │
         ▼
Pi loads prompt template opsx-propose.md
         │
         ▼
Agent sees instructions + calls openspec CLI
         │
         ▼
openspec status / openspec instructions (JSON) → structured data
         │
         ▼
Agent creates artifacts from templates and dependency graph
```

## Managing profiles

By default OpenSpec installs the **core profile** (4 commands: propose, explore, apply, archive).

For the expanded set:

```bash
openspec config profile
# Select desired workflows
openspec update
# Regenerates skills and prompts in .pi/
```

## Updating after OpenSpec upgrade

```bash
bun add -g @fission-ai/openspec@latest
cd your-project
openspec update
```

`openspec update` regenerates all files in `.pi/skills/` and `.pi/prompts/` with up-to-date instructions.

## Project configuration

The `openspec/config.yaml` file affects artifact generation:

```yaml
schema: spec-driven

context: |
  Tech stack: TypeScript, React, Node.js
  Testing: Vitest

rules:
  proposal:
    - Include a rollback plan
  specs:
    - Use Given/When/Then format for scenarios
  design:
    - Include diagrams for complex flows
```

- **context** — injected into all artifacts
- **rules** — injected only into the corresponding artifact

## Compatibility with other Pi skills

### OpenSpec + Trio Workflow

OpenSpec and trio (Planner → Executor → Reviewer) are complementary approaches:

| Aspect | OpenSpec | Trio |
|--------|----------|------|
| Persistence | Specs live in the repository | Plan lives in chat context |
| Focus | Spec-driven development, requirements alignment | General-purpose plan → build → review |
| Iteration | Delta specs, archiving, multi-change | Review loop until PASS verdict |

They combine well:
- OpenSpec for planning and specifications
- Trio for independent code review of the implementation

### OpenSpec + Other skills

OpenSpec doesn't conflict with other skills. Auto-generated skills (`openspec-*`) are loaded on demand and don't affect the rest.

## Supported delivery modes

OpenSpec lets you choose what to generate:

| Mode | What's created |
|------|---------------|
| **Skills only** | Only `.pi/skills/openspec-*/SKILL.md` |
| **Commands only** | Only `.pi/prompts/opsx-*.md` |
| **Both** (default) | Both skills and prompt templates |

Configure: `openspec config profile` → select delivery mode.

## Disabling telemetry

OpenSpec collects anonymous usage stats (only command names and version).

```bash
export OPENSPEC_TELEMETRY=0
# or
export DO_NOT_TRACK=1
```
