---
name: openspec
description: Setup, configure, and use OpenSpec (spec-driven development) in Pi. Use when the user wants to work with OpenSpec, plan changes through specifications, or run /opsx:propose, /opsx:apply, /opsx:archive commands.
---

# OpenSpec for Pi

OpenSpec is a spec-driven development (SDD) framework. It aligns requirements before writing code: human and AI agree on specifications, then implement, then archive.

## Requirements

- **Node.js ≥ 20.19.0** (`node --version`)
- **bun** (preferred) or npm
- **Platforms**: Linux, macOS, WSL

## Installation

```bash
bash scripts/install.sh
```

(Run from the skill directory)

The script:
1. Checks Node.js version
2. Installs `@fission-ai/openspec` globally
3. Runs `openspec init --tools pi` in the current project

### Manual installation

```bash
bun add -g @fission-ai/openspec@latest
cd your-project
openspec init --tools pi
```

## How it works

After `openspec init --tools pi`, the project gets:

```
openspec/
├── specs/              # Source of truth: how the system works now
├── changes/            # Proposed changes (one directory per change)
└── config.yaml         # Project configuration (optional)

.pi/
├── skills/openspec-*/SKILL.md    # Auto-generated OpenSpec skills
└── prompts/opsx-*.md             # Auto-generated prompt templates
```

OpenSpec generates skills and prompts for Pi automatically. This skill is a **meta-guide** for effective usage.

## Core commands (core profile)

> **Syntax:** OpenSpec docs use colon syntax (`/opsx:propose`). Pi prompt templates use hyphens (`/opsx-propose`). Both are equivalent — Pi recognizes its own format automatically.

| Command | Pi prompt | Purpose |
|---------|-----------|---------|
| `/opsx:propose <name>` | `/opsx-propose` | Create a change + all planning artifacts |
| `/opsx:explore` | `/opsx-explore` | Explore an idea before committing to a change |
| `/opsx:apply` | `/opsx-apply` | Implement tasks from tasks.md |
| `/opsx:archive` | `/opsx-archive` | Archive a completed change, merge specs |

### Expanded commands (expanded profile)

Enable: `openspec config profile` → select workflows → `openspec update`

| Command | Pi prompt | Purpose |
|---------|-----------|---------|
| `/opsx:new` | `/opsx-new` | Create a change scaffold |
| `/opsx:continue` | `/opsx-continue` | Create the next artifact by dependency order |
| `/opsx:ff` | `/opsx-ff` | Create all planning artifacts at once |
| `/opsx:verify` | `/opsx-verify` | Verify implementation against artifacts |
| `/opsx:sync` | `/opsx-sync` | Merge delta specs into main specs |
| `/opsx:bulk-archive` | `/opsx-bulk-archive` | Archive multiple changes |
| `/opsx:onboard` | `/opsx-onboard` | Interactive workflow tutorial |

## Quick start

```
You: /opsx:propose add-dark-mode
AI:  Created openspec/changes/add-dark-mode/
     ✓ proposal.md  — why and what we're changing
     ✓ specs/        — requirements and scenarios
     ✓ design.md     — technical approach
     ✓ tasks.md      — implementation checklist

You: /opsx:apply
AI:  Implementing tasks...
     ✓ 1.1 Created ThemeContext
     ✓ 1.2 Added CSS variables
     All tasks complete!

You: /opsx:archive
AI:  ✓ Specs merged into openspec/specs/
     ✓ Change moved to archive/
```

## Project configuration

Copy a config template into your project:

```bash
cp templates/config-minimal.yaml your-project/openspec/config.yaml
```

Or the full version with examples:

```bash
cp templates/config-full.yaml your-project/openspec/config.yaml
```

(Paths are relative to the skill directory)

## Updating after upgrade

```bash
bun add -g @fission-ai/openspec@latest
cd your-project
openspec update
```

## Troubleshooting

### Commands not recognized

```bash
openspec update    # Regenerate skills and prompts
```

Make sure `.pi/skills/` exists and contains `openspec-*` files.

### "Node.js version too old"

OpenSpec requires Node.js ≥ 20.19.0. Upgrade:

```bash
# nvm
nvm install 20
nvm use 20

# Or directly from https://nodejs.org
```

### Artifacts generated incorrectly

- Add project context to `openspec/config.yaml`
- Use `/opsx:continue` instead of `/opsx:ff` for more control
- Add `rules` for specific artifacts

### Change not found

```bash
openspec list              # List active changes
openspec show <name>       # Details for a specific change
```

## References

- [Cheatsheet](references/cheatsheet.md) — Key commands and concepts
- [Pi integration](references/pi-integration.md) — How Pi and OpenSpec work together
- [Quick start](examples/quick-start.md) — Step-by-step guide
- [Pi workflow example](examples/pi-workflow.md) — Real development scenario
