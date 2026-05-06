# Changelog

## Unreleased

### Added

- Plan review depth controls: `critical_only`, `critical_and_important`, and `exhaustive`
- OpenSpec review packs for `trio_plan_review` via `mode: "openspec"` and `change_dir`
- Approvable plan-review verdicts: `BLOCKED`, `APPROVABLE_WITH_NOTES`, and `APPROVED`
- OpenSpec traceability index and `OpenSpec-Change` commit trailer workflow
- `/trio-os-make-index` prompt workflow for explicit OpenSpec traceability index bootstrap or repair
- `openspec-trace` commit message helper for generating and validating `OpenSpec-Change` trailers
- Local reviewer diagnostics with timing logs, profile details, safe default metadata, and opt-in raw capture
- `openspec-trace` task helper for command-backed factual checkbox updates and phase readiness checks
- `openspec-trace status` read-only gate summary for OpenSpec change artifacts, validation, source-boundary drift, task readiness, archive state, and commit readiness
- `openspec-trace index` helper for active/archive traceability cards and compactness validation
- `openspec-trace review-pack` helper for `trio_review` handoff metadata
- Optional roadmap specs in `openspec/roadmaps/*.md` as an upper-level planning layer above capability specs

### Changed

- `/trio-os` reviews full OpenSpec artifact packs instead of `tasks.md` alone and stops planning when strict validation passes with no Critical findings
- `/trio-os` now asks before bootstrapping a missing `openspec/INDEX.md` and can continue without the index when requested
- `/trio-os` now loads relevant roadmap specs selectively when `openspec/roadmaps/` exists
- Executor/reviewer instructions now document trio-os source-boundary amendments, helper-backed factual task status, complete review handoffs, workflow-gate handling, and severity calibration
- The built-in `openspec` reviewer profile is now managed by review context: hidden from the picker, excluded from generic reviews, and applied automatically for OpenSpec reviews

### Fixed

- Get `authStorage` from `modelRegistry.authStorage` instead of non-existent `ctx.authStorage` — pi's `ExtensionContext` never exposed `authStorage` directly, causing "no auth storage or model registry available" error on every review call

## 2026-03-15

### Fixed

- Pass `authStorage` and `modelRegistry` to sub-agent for custom provider support (#1)

## 2026-02-27

### Added

- Trio workflow with independent reviewer sub-agent (`trio_plan_review`, `trio_review` tools)
- Bundled pi-openspec with runtime check for openspec CLI
- Reviewer profiles: multi-select UI at session start (nuxt, vue-spa, vue-lib, vue-testing, monorepo, docs, openspec)

### Changed

- Lazy profile select — show picker on first review call instead of session start

### Fixed

- Profile picker UX — tab to confirm, esc to skip, show active profiles in progress
- Reset profile state on new session so picker shows again
