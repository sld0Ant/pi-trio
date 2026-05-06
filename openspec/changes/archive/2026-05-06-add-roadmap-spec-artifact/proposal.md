# Proposal: Add roadmap-spec artifact guidance

## Why

Pi-trio currently has strong per-change OpenSpec artifacts and a compact traceability index, but it does not define a product-level roadmap artifact above individual capability specs. As the number of baseline specs and archived changes grows, agents need a stable top-level planning layer that explains strategic themes, sequencing, dependencies, and accepted deferrals without duplicating detailed requirements.

The requested outcome is a "roadmap spec" that sits above normal specs: it should guide future OpenSpec proposals and help reviewers detect scope drift while leaving baseline specs as the source of truth for current behavior.

## What

- Define a new `openspec-roadmap-spec` capability describing a top-level roadmap artifact.
- Specify where roadmap artifacts live, what sections they contain, and how they relate to baseline specs, active changes, archived changes, and `openspec/INDEX.md`.
- Update pi-trio workflow guidance so `/trio-os` consults roadmap context before creating capability-level specs when a roadmap exists and is relevant.
- Document that roadmap specs are planning/navigation artifacts, not replacements for baseline specs or change delta specs.

## Non-Goals

- Do not implement a separate runtime tool or CLI command for roadmap management in this slice.
- Do not migrate existing baseline specs into a roadmap.
- Do not make roadmap artifacts mandatory for every repository.
- Do not treat roadmap items as implemented behavior until corresponding baseline specs and code exist.

## Related Changes

- `add-openspec-traceability-index` introduced `openspec/INDEX.md` as a compact navigation layer.
- `prompt-for-openspec-index-bootstrap` defined user-controlled setup for optional top-level OpenSpec navigation artifacts.
- `implement-trio-workflow-process-contract` established that OpenSpec artifacts are implementation contracts and tasks remain factual.

## Source Boundary

Implementation is expected to touch only roadmap-spec workflow documentation and OpenSpec artifacts:

- `openspec/changes/add-roadmap-spec-artifact/**`
- `openspec/specs/openspec-roadmap-spec/spec.md` after archive
- `prompts/trio-os.md`
- `skills/openspec/SKILL.md`
- `README.md`
- `CHANGELOG.md`
- `openspec/INDEX.md` after archive/index maintenance

Changes to `extensions/trio-reviewer/index.ts`, `scripts/openspec-trace.ts`, or reviewer sub-agent behavior are out of scope unless a later amendment explicitly adds tool support.
