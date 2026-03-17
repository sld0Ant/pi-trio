# OpenSpec Cheatsheet

## Directory structure

```
openspec/
├── specs/                  # Source of truth — current system behavior
│   └── <domain>/
│       └── spec.md
├── changes/                # Active changes
│   ├── <name>/
│   │   ├── proposal.md     # Why and what we're changing
│   │   ├── specs/          # Delta specs (ADDED/MODIFIED/REMOVED)
│   │   │   └── <domain>/
│   │   │       └── spec.md
│   │   ├── design.md       # Technical approach
│   │   └── tasks.md        # Implementation checklist
│   └── archive/            # Completed changes
└── config.yaml             # Project configuration
```

## OPSX commands (slash commands in Pi)

### Core Profile (default)

```
/opsx:propose <name>        Create a change + planning artifacts
/opsx:explore               Explore an idea before committing to a change
/opsx:apply [name]          Implement tasks from tasks.md
/opsx:archive [name]        Archive a change, merge specs
```

### Expanded Profile

```
/opsx:new <name>            Create a change scaffold (no artifacts)
/opsx:continue [name]       Create the next artifact by dependency order
/opsx:ff [name]             Fast-forward: create all planning artifacts at once
/opsx:verify [name]         Verify implementation against artifacts
/opsx:sync [name]           Merge delta specs into main specs
/opsx:bulk-archive          Archive multiple changes
/opsx:onboard               Interactive workflow tutorial
```

## CLI commands (terminal)

### Management

```bash
openspec init [--tools pi]           Initialize in a project
openspec update                      Regenerate generated files
openspec list [--specs|--changes]    List specs or changes
openspec show <name>                 Details for a change/spec
openspec view                        Interactive dashboard
openspec validate [--all]            Validate specs and changes
openspec archive <name>              Archive a change
```

### Schemas

```bash
openspec schemas                     List available schemas
openspec schema init <name>          Create a custom schema
openspec schema fork <from> <to>     Fork a schema for customization
openspec schema validate <name>      Validate a schema
openspec schema which <name>         Where a schema comes from
```

### Workflow commands

```bash
openspec status --change <name>      Artifact status for a change
openspec instructions <artifact>     Instructions for creating an artifact
openspec templates                   Template paths
```

### Settings

```bash
openspec config list                 All current settings
openspec config profile              Switch workflow profile
openspec config set <key> <value>    Set a parameter
```

## Artifact dependency graph (spec-driven)

```
              proposal
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
     specs              design
       │                   │
       └─────────┬─────────┘
                 ▼
              tasks
                 │
                 ▼
            implement
```

- `proposal` — root, no dependencies
- `specs` and `design` — depend on proposal, can be created in parallel
- `tasks` — depends on both specs AND design
- Implementation (`apply`) — requires tasks

## Delta specs

Describe changes relative to current specifications:

```markdown
# Delta for Auth

## ADDED Requirements

### Requirement: Two-Factor Authentication
The system MUST support TOTP-based two-factor authentication.

#### Scenario: 2FA login
- GIVEN a user with 2FA enabled
- WHEN the user submits valid credentials
- THEN an OTP challenge is presented

## MODIFIED Requirements

### Requirement: Session Timeout
The system SHALL expire sessions after 15 minutes.
(Previously: 30 minutes)

## REMOVED Requirements

### Requirement: Remember Me
(Deprecated in favor of 2FA)
```

On archive:
- **ADDED** → merged into the main spec
- **MODIFIED** → replaces the existing requirement
- **REMOVED** → deleted from the main spec

## RFC 2119 keywords

| Keyword | Strength |
|---------|----------|
| **MUST / SHALL** | Mandatory requirement |
| **SHOULD** | Recommended, exceptions allowed |
| **MAY** | Optional |

## Common workflows

### Quick feature

```
/opsx:propose → /opsx:apply → /opsx:archive
```

### Exploration + feature (expanded)

```
/opsx:explore → /opsx:new → /opsx:continue (repeat) → /opsx:apply → /opsx:verify → /opsx:archive
```

### Parallel work

```
/opsx:apply change-a    # Work on A
                         # Context switch
/opsx:new change-b      # Create B
/opsx:ff change-b       # Artifacts for B
/opsx:apply change-b    # Implement B
/opsx:archive change-b  # Finish B
/opsx:apply change-a    # Return to A
```

## When to update a change vs create a new one

**Update** if:
- Same intent, refined implementation
- Scope is narrowing (MVP first, rest later)
- Codebase turned out different than expected

**Create new** if:
- Intent fundamentally changed
- Scope grew into different work
- The original change can be completed independently

Quick test: >50% overlap with old → update. <50% → new change.

## Useful links

- [OpenSpec GitHub](https://github.com/Fission-AI/OpenSpec)
- [OpenSpec documentation](https://github.com/Fission-AI/OpenSpec/tree/main/docs)
- [OpenSpec Discord](https://discord.gg/YctCnvvshC)
