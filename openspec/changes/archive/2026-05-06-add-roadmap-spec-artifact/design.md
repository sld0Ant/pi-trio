# Design: Roadmap spec as an upper planning layer

## Overview

Add a documented OpenSpec artifact pattern for a roadmap spec: a repository-level planning document that sits above baseline specs and change delta specs. The roadmap spec describes direction, sequencing, dependencies, non-goals, and candidate capability slices. It helps agents choose relevant context before proposing new changes.

The roadmap spec does not define current implemented behavior. Baseline specs under `openspec/specs/` remain the source of truth for current behavior, and active changes under `openspec/changes/` remain the implementation contract after approval.

## Artifact Model

A repository may maintain one or more roadmap specs under `openspec/roadmaps/`:

```text
openspec/
├── roadmaps/
│   └── <roadmap-id>.md
├── specs/
│   └── <capability>/spec.md
└── changes/
    └── <change-id>/
```

Roadmap files are intentionally prose-first and compact. A roadmap can reference capability specs and changes, but it must not copy full requirements, full task lists, or full designs.

## Required Roadmap Sections

Each roadmap spec must include:

- Purpose: the strategic outcome or product area.
- Scope: included and excluded areas.
- Current State: relevant baseline capabilities and constraints.
- Target Direction: desired end state at a high level.
- Milestones: ordered slices with dependencies and acceptance signals.
- Candidate Changes: potential OpenSpec change ids or descriptions.
- Deferred / Non-Goals: known out-of-scope items.
- Traceability: links to baseline specs, active changes, archived changes, and index cards when available.

## Workflow Integration

When `/trio-os` starts planning and `openspec/roadmaps/` exists, the agent should:

1. Read `openspec/INDEX.md` first when present.
2. Identify relevant roadmap specs by user request, capability names, source boundaries, or explicit index links.
3. Read only the relevant roadmap specs.
4. Use the roadmap to choose the next bounded OpenSpec change, not to bypass proposal/design/spec/tasks artifacts.
5. Record roadmap context compactly in new proposal/design artifacts when it influenced scope or sequencing.

If no roadmap exists, `/trio-os` continues normally. Missing roadmap artifacts are not blockers.

## Relationship to Existing Index

`openspec/INDEX.md` remains the compact navigation index for baseline specs and changes. Roadmaps provide strategic sequencing and dependency context. The index may include compact links to roadmap files, but the roadmap content should not be duplicated in the index.

## Prior Decisions Used

- The traceability index is optional and compact; roadmap specs should follow the same compact-navigation principle.
- OpenSpec implementation tasks are factual and must not be checked before actions happen.
- Roadmap workflow guidance should distinguish workflow/navigation artifacts from mandatory implemented behavior without requiring reviewer tool changes in this slice.

## Validation Strategy

- `openspec validate add-roadmap-spec-artifact --strict` verifies the delta spec structure.
- Documentation review checks that roadmap guidance does not contradict baseline specs as source of truth.
- Implementation review checks that `/trio-os` guidance reads roadmap context selectively and does not require roadmap setup for all repositories.

## Trade-offs

- The first slice defines the artifact contract and workflow guidance only. CLI helpers or reviewer sub-agent behavior changes for roadmap handling are deferred.
- Roadmaps are optional to avoid blocking small repositories or repositories that prefer only baseline specs plus index cards.
