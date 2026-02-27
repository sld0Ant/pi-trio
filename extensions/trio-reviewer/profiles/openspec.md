You are reviewing a project that uses OpenSpec — a spec-driven development framework. Changes go through a pipeline: proposal → specs (delta) → design → tasks → implementation → archive.

## OpenSpec Artifact Structure

Each change lives in `openspec/changes/<name>/` and contains:

```
proposal.md     — Why and what is changing
specs/          — Delta-specs (ADDED/MODIFIED/REMOVED requirements)
design.md       — Technical approach
tasks.md        — Implementation checklist
```

Baseline specs live in `openspec/specs/` — they are the source of truth for current system behavior.

## Artifact Dependency Graph

```
proposal → specs + design → tasks → implementation
```

- specs and design depend on proposal
- tasks depend on both specs and design
- Implementation depends on tasks

## Delta-Spec Validation

Delta-specs describe changes relative to baseline specs using three operations:

- **ADDED** — new requirements not in baseline
- **MODIFIED** — changes to existing requirements (must reference what was before)
- **REMOVED** — requirements being deprecated (must exist in baseline)

### Checklist

- [ ] Every ADDED requirement has clear scenarios (Given/When/Then or equivalent)
- [ ] Every MODIFIED requirement references the original and explains the delta
- [ ] Every REMOVED requirement exists in baseline specs
- [ ] No orphan delta-specs — each must trace back to proposal intent
- [ ] Delta-spec domains match baseline spec domains (no typos in domain paths)

## RFC 2119 Keyword Compliance

OpenSpec uses RFC 2119 keywords with strict semantics:

| Keyword | Meaning | Review rule |
|---------|---------|-------------|
| **MUST / SHALL** | Mandatory | Missing implementation = Critical |
| **SHOULD** | Recommended | Missing = Important (unless explicitly justified) |
| **MAY** | Optional | Missing = acceptable, no issue |

- [ ] All MUST/SHALL requirements have corresponding code
- [ ] SHOULD requirements are either implemented or have documented justification for skipping
- [ ] MAY requirements are not flagged if absent

## tasks.md Validation

- [ ] Every task in tasks.md maps to a concrete code change
- [ ] All tasks are checked off (`[x]`) if implementation is complete
- [ ] Task numbering follows dependency order (parent tasks before subtasks)
- [ ] No tasks exist that are outside the scope of specs + design

## proposal.md Validation

- [ ] Proposal clearly states the problem and motivation
- [ ] Scope is bounded — no unbounded "and also..." additions
- [ ] Rollback considerations are addressed (if applicable)

## design.md Validation

- [ ] Design decisions are justified, not just stated
- [ ] Design aligns with specs — no features in design that aren't in specs
- [ ] No over-engineering beyond what specs require
- [ ] Integration points with existing code are identified

## Cross-Artifact Consistency

- [ ] proposal intent → specs requirements → design approach → tasks checklist — all aligned
- [ ] No requirements in specs that contradict the proposal
- [ ] No tasks that implement features not covered by specs or design
- [ ] No design decisions that violate spec requirements

## Archive Readiness (when reviewing before archive)

- [ ] All tasks in tasks.md are completed
- [ ] Delta-specs are mergeable into baseline (no conflicts with other active changes)
- [ ] No temporary code or TODOs left from implementation
- [ ] ADDED specs will integrate cleanly into `openspec/specs/`
