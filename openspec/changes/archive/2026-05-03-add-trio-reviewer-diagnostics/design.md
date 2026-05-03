## Context

`extensions/trio-reviewer/index.ts` registers `trio_plan_review` and `trio_review`, builds prompts/review packs, applies invocation profiles, runs OpenSpec validation for OpenSpec plan reviews, and calls a clean sub-agent through `runSubAgent()`.

Current user-visible behavior is opaque during long reviews. The tool response may include `details.profiles`, `rawVerdict`, and OpenSpec validation status, but not timing or a log path. There is no durable local trace of phase durations.

## Prior Decisions Used

- From `improve-trio-os-review-convergence`: OpenSpec plan review pack building and strict validation are part of `trio_plan_review` and must remain best-effort and bounded.
- From `manage-openspec-review-profile`: actual invocation profiles should be reported in details and should not bleed between invocations.
- From `implement-trio-workflow-process-contract`: review packs must include enough evidence for review, but post-review workflow gates remain separate.

## Goals

- Make long review calls observable with phase timing.
- Provide progress messages while review tools run.
- Write safe structured diagnostic logs by default.
- Return log metadata in tool details.
- Preserve existing review behavior and verdict parsing.

## Non-Goals

- No change to reviewer prompt semantics or strictness.
- No change to model selection or provider behavior.
- No new dependency or persistent configuration file.
- No full prompt/file/response logging by default.
- No tracing service, telemetry upload, or network egress.
- No performance optimization in this slice beyond identifying timing bottlenecks.

## Diagnostic Log Location

Default log directory:

```text
/tmp/pi-trio-review-logs
```

Environment override:

```bash
TRIO_REVIEW_LOG_DIR=/path/to/logs
```

The extension should create the directory if possible. Created log directories should use mode `0700` where the platform honors POSIX modes, and created log files should use mode `0600`. If log directory creation, permission setting, or writing fails, the review still proceeds and returns a log-write warning in details.

## Diagnostic Log Shape

Each review invocation writes one JSON file named with timestamp, tool name, and a random suffix to avoid collisions across concurrent reviews, for example:

```text
2026-05-03T17-22-10-123Z-trio_review-8f3a.json
```

Default log fields:

```json
{
  "tool": "trio_review",
  "startedAt": "2026-05-03T17:22:10.123Z",
  "finishedAt": "2026-05-03T17:23:44.123Z",
  "durationMs": 94000,
  "mode": "generic",
  "reviewDepth": "critical_and_important",
  "profiles": ["openspec"],
  "managedProfiles": ["openspec"],
  "input": {
    "filesCount": 4,
    "specsDir": "...",
    "changeDir": "..."
  },
  "phases": [
    { "name": "build_pack", "durationMs": 120 },
    { "name": "read_files", "durationMs": 8 },
    { "name": "openspec_validate", "durationMs": 530 },
    { "name": "model_call", "durationMs": 92000 }
  ],
  "pack": {
    "chars": 42000,
    "estimatedTokens": 10500
  },
  "result": {
    "rawVerdict": "APPROVED",
    "verdict": "PASS",
    "openspecValidationStatus": "pass"
  },
  "warnings": []
}
```

Exact phase names may differ when implementation reality requires, but the log must distinguish at least pack/input preparation, profile prompt preparation, model call, and total duration. Writes should be collision-safe: generate a unique path before writing and use an atomic temp-file-then-rename write where practical. If atomic rename fails, fall back to direct write and record a diagnostic warning rather than failing the review.

## Raw Debug Capture

Default logs must not include:

- full review pack;
- full source/spec file contents;
- full system prompt;
- full model response;
- secrets or environment dumps.

Optional raw capture can be enabled only with:

```bash
TRIO_REVIEW_LOG_RAW=1
```

When enabled, the log may include bounded raw fields:

- `raw.userPrompt`;
- `raw.systemPrompt`;
- `raw.modelResponse`.

Each raw string field is limited to 64 KiB measured as UTF-8 bytes while preserving valid string content. Truncated fields use companion metadata under `rawTruncation`, for example:

```json
{
  "rawTruncation": {
    "userPrompt": { "truncated": true, "originalBytes": 120000, "storedBytes": 65536 }
  }
}
```

If raw logging would exceed implementation safety limits, byte-safe truncation is preferred over failing the review.

## Progress Output

During review tool execution, the extension should emit human-readable progress text when the Pi tool API supports it or when current progress facilities already exist. Progress should include major stages such as:

```text
[trio_review] building review pack...
[trio_review] applying profiles: openspec
[trio_review] calling reviewer model...
[trio_review] reviewer finished in 94.0s
```

The implementation must inspect the current Pi tool API call path for progress support. If progress output is not feasible with the current SDK call path, it should still provide diagnostics through final details and log files, and document the checked limitation in verification notes.

## Tool Details

`trio_plan_review` and `trio_review` details should include:

- `durationMs`;
- `logPath` when a log was written;
- `diagnosticWarnings` when logging failed or raw fields were truncated;
- actual invocation `profiles` as before;
- existing fields such as `rawVerdict` and `openspecValidationStatus` where applicable.

Existing fields must remain backward compatible.

## Security and Privacy

- Logs are local only.
- No diagnostics should be sent over the network except the existing sub-agent/model request that already happens for review.
- Default logs contain metadata and timing only, not raw code or prompts.
- Raw logging is opt-in through an environment variable and should be treated as sensitive local debug output.

## Verification

- Run `openspec validate add-trio-reviewer-diagnostics --strict`.
- Run `bun build extensions/trio-reviewer/index.ts --target=node --outdir /tmp/pi-trio-build`.
- Run `git diff --check`.
- Manually verify or add focused checks for:
  - `trio_review` details include `durationMs`, `logPath`, and `profiles`;
  - `trio_plan_review` details include `durationMs`, `logPath`, and existing raw verdict/OpenSpec validation fields;
  - default log omits raw prompts/file contents/model responses;
  - `TRIO_REVIEW_LOG_RAW=1` includes bounded raw debug fields;
  - logging failure does not fail the review;
  - OpenSpec profile reporting remains correct.

## Source Boundary

Allowed implementation files before review:

- `extensions/trio-reviewer/index.ts`
- `README.md`
- `CHANGELOG.md`

Allowed OpenSpec files before review:

- `openspec/changes/add-trio-reviewer-diagnostics/**`

Allowed post-review archive/index outputs after implementation review passes:

- `openspec/INDEX.md`
- `openspec/specs/trio-reviewer-diagnostics/spec.md`
- `openspec/changes/archive/**/add-trio-reviewer-diagnostics/**`
- removal or movement of `openspec/changes/add-trio-reviewer-diagnostics/**` by archive workflow

If implementation requires other files before review, stop and amend this OpenSpec change before editing them.
