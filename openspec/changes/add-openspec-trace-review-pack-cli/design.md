## Context

`trio_review` receives explicit `plan`, `files`, and `specs_dir` inputs. Agents currently assemble those by hand. Missing files or omitted validation context can make reviews unreliable.

## Goals

- Generate review-pack metadata from repository state.
- Include modified source and documentation files relevant to implementation.
- Include OpenSpec specs directory for the change.
- Summarize completed validations and pending post-review tasks when available.
- Produce JSON suitable for copy/paste into tool calls.

## Non-Goals

- No direct `trio_review` invocation.
- No file mutation.
- No automatic source-boundary amendment.

## Command Namespace

All trace automation commands should live under one local CLI namespace. The implementation may expose it as `openspec-trace` or as a script wrapper such as `bun scripts/openspec-trace.ts`, but command semantics are documented as `openspec-trace <command> [...args]`.

## Proposed Command Shape

```bash
openspec-trace review-pack <change-id> [--json] [--staged|--unstaged|--all]
```

## File Discovery

The command should use git diff/status to identify modified files. Default discovery should include staged, unstaged, and untracked files under the repository, excluding deleted files. Flags may narrow discovery to staged or unstaged files.

Renamed files should use the new path. Deleted files should be reported separately and excluded from `files` because `trio_review` requires readable file paths. Directories, missing files, package caches, and unrelated generated files are excluded.

OpenSpec planning artifacts are excluded from reviewed implementation files by default. They become relevant when they are documentation/verification artifacts intentionally modified during implementation, or when the active change itself is documentation/spec workflow work and the artifact is part of the implementation source boundary.

## Output

JSON output should include:

- plan file path;
- absolute file paths for `files`;
- absolute `specs_dir`;
- validation summary placeholders or discovered validation notes;
- pending post-review tasks.

## Command Responsibility

`review-pack` owns review handoff payload generation only. It can include status/index/task summaries produced by shared helpers, but it does not mutate the index, edit tasks, or invoke `trio_review`.

## Accepted Trade-offs

- Validation command results can be provided manually or detected from known trace status output in a later enhancement.
- Source-boundary filtering can be advisory in the first implementation.
