## Context

The approved audit package from the Chatwoot workflow captured process lessons that apply to pi-trio itself:

- executors must not silently expand source boundaries;
- task checkboxes and verification notes must represent completed facts only;
- review packs must include all relevant modified source, spec, docs, and verification artifacts;
- reviewers must not treat post-review archive/commit/push tasks as Critical before review approval;
- reviewer severity should distinguish blockers from useful but non-blocking improvements;
- trio-os task layouts should separate implementation, validation, review handoff, and post-review operations.

The previous `improve-trio-os-review-convergence` change made plan review OpenSpec-aware and convergent. This change focuses on execution and implementation review behavior.

## Goals / Non-Goals

### Goals

- Encode the executor process contract in `skills/executor/SKILL.md`.
- Encode implementation-review workflow-gate and severity guidance in `extensions/trio-reviewer/reviewer-prompt.md`.
- Update `prompts/trio-os.md` so generated and approved tasks are expected to separate workflow phases.
- Keep the contract language- and platform-neutral.
- Keep implementation small and instruction-only.

### Non-Goals

- No changes to `trio_plan_review` or `trio_review` runtime code.
- No new CLI tools, dependencies, or package metadata.
- No changes to planner, OpenSpec, or profile selection behavior.
- No project-specific commands or language-specific validation requirements.
- No automatic review-pack file discovery in this slice.

## Decisions

### Executor receives explicit stop-and-amend rules

`skills/executor/SKILL.md` will add a trio-os/OpenSpec section that treats `tasks.md`, specs, proposal, and design as the approved source of truth. If implementation requires files or behavior outside the approved boundary, the executor must stop before editing that scope, explain why, amend OpenSpec artifacts, run strict validation, and obtain critical-only plan review approval before continuing.

Ambiguity handling will be stricter than generic deviation logging: if a task is ambiguous, impossible, or conflicts with implementation reality, the executor asks for clarification or amends the OpenSpec change instead of silently reinterpreting it.

### Task status and verification notes are factual

The executor skill will explicitly state that checkboxes are marked complete only after the action has happened. Currently-running review tasks and post-review archive/baseline/commit/push/deploy tasks remain pending until their respective results are known. Verification artifacts may record completed commands and observed results, not predicted future outcomes.

### Review handoff includes complete evidence

The executor skill will require review handoff to include all created/modified source, spec, documentation, and verification artifacts relevant to implementation. It should avoid passing directories, unrelated paths, or non-existent paths. Handoff text should summarize validation commands, results, skipped/pending checks, and environmental limitations.

This is an instruction-level change only. Automated discovery can be added later if needed.

### Reviewer prompt understands workflow gates

`extensions/trio-reviewer/reviewer-prompt.md` will keep strict implementation/spec compliance, but remove the instruction to always find something. It will add rules:

- post-review tasks are not Critical solely because they are pending before review approval;
- the current review invocation can satisfy a review task and is not recursively blocking by itself;
- Critical findings are limited to behavioral breakage in approved scope, security/secret/egress risk, source-boundary violations, direct MUST/SHALL violations, missing required implementation, or incomplete review packs that prevent verification;
- Important findings cover meaningful robustness, docs, rollback, or focused validation gaps that do not immediately violate core behavior;
- Suggestions cover polish or optional improvements;
- incomplete review packs should be reported as review-pack issues instead of inferred implementation failures.

The reviewer still returns `PASS | NEEDS WORK` for implementation review. `NEEDS WORK` remains appropriate when Critical findings exist.

### trio-os prompt separates task phases

`prompts/trio-os.md` will instruct planning to structure `tasks.md` into implementation, focused validation, review handoff, and post-review operations when applicable. During Phase 2 and Phase 3 it will explicitly note that post-review operations remain pending until `trio_review` passes.

## Accepted Trade-offs

- Instruction changes cannot guarantee perfect agent behavior; they make the expected process explicit and reviewable.
- The MVP does not implement automatic changed-file discovery for `trio_review`.
- The implementation reviewer remains binary (`PASS | NEEDS WORK`) in this slice to avoid changing tool semantics.

## Verification

- Run `openspec validate implement-trio-workflow-process-contract --strict`.
- Run repository-appropriate syntax/build smoke if available without introducing new setup; for this package, `bun build extensions/trio-reviewer/index.ts --target=node --outdir /tmp/pi-trio-build` validates that unchanged extension runtime still bundles.
- Inspect diff/source boundary before review.

## Source Boundary

Allowed implementation files before review:

- `skills/executor/SKILL.md`
- `extensions/trio-reviewer/reviewer-prompt.md`
- `prompts/trio-os.md`
- `README.md`
- `CHANGELOG.md`

Allowed OpenSpec files before review:

- `openspec/changes/implement-trio-workflow-process-contract/**`

Allowed post-review archive outputs after implementation review passes:

- `openspec/specs/trio-workflow-process-contract/spec.md`
- `openspec/changes/archive/**/implement-trio-workflow-process-contract/**`
- removal or movement of `openspec/changes/implement-trio-workflow-process-contract/**` by the archive workflow

If implementation requires other source files before review, stop and amend this OpenSpec change before editing them.
