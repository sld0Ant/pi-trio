# Quick start: from installation to first change

## 1. Install OpenSpec

```bash
bun add -g @fission-ai/openspec@latest
openspec --version
```

## 2. Initialize in a project

```bash
cd your-project
openspec init --tools pi
```

This creates:

```
openspec/
├── specs/
├── changes/
└── config.yaml

.pi/
├── skills/openspec-*/SKILL.md
└── prompts/opsx-*.md
```

## 3. (Optional) Configure

Edit `openspec/config.yaml`:

```yaml
schema: spec-driven

context: |
  Tech stack: TypeScript, React, Node.js
  Testing: Vitest
```

## 4. Propose a change

In Pi, type:

```
/opsx:propose add-user-notifications
```

OpenSpec creates:

```
openspec/changes/add-user-notifications/
├── proposal.md     # Why: notifications are needed for…
├── specs/          # What: requirements and scenarios
│   └── notifications/
│       └── spec.md
├── design.md       # How: WebSocket vs polling, architecture
└── tasks.md        # Steps: implementation checklist
```

## 5. Review and adjust artifacts

Read the generated files. If something needs tweaking — edit directly. Artifacts can be changed at any time.

```bash
openspec show add-user-notifications
openspec validate add-user-notifications
```

## 6. Implement

```
/opsx:apply
```

The agent walks through tasks.md, implements each task, and marks completed ones `[x]`.

## 7. Check status

```bash
openspec status --change add-user-notifications
```

Shows which artifacts are ready, which are blocked, how many tasks are done.

## 8. Archive

```
/opsx:archive
```

What happens:
1. Delta specs are merged into `openspec/specs/`
2. The change directory moves to `openspec/changes/archive/2026-02-27-add-user-notifications/`
3. Specifications are updated — the source of truth reflects the new behavior

## 9. Next change

The cycle repeats:

```
/opsx:propose next-feature
```

Each change builds on the updated specifications.

## Summary: minimal workflow

```
openspec init --tools pi        # Once
/opsx:propose <name>            # Create a change
/opsx:apply                     # Implement
/opsx:archive                   # Finish
```
