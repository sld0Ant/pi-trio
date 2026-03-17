# Changelog

## Unreleased

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
