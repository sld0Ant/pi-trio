# Verification Notes

## Manual CLI checks

Ran from repository root.

### Generate a single-change commit message

```bash
bun scripts/openspec-trace.ts commit-msg add-openspec-trace-commit-cli --title "feat: add trace commit helper"
```

Result: command printed the title followed by `OpenSpec-Change: add-openspec-trace-commit-cli`.

### Validate expected trailer

```bash
printf 'feat: add trace commit helper\n\nOpenSpec-Change: add-openspec-trace-commit-cli\n' > /tmp/commit-msg-ok.txt
bun scripts/openspec-trace.ts check-commit-msg /tmp/commit-msg-ok.txt --change add-openspec-trace-commit-cli
```

Result: command exited successfully.

### Reject dated archive folder trailer

```bash
printf 'docs: bad\n\nOpenSpec-Change: 2026-05-03-repair-openspec-traceability-index\n' > /tmp/commit-msg-bad.txt
bun scripts/openspec-trace.ts check-commit-msg /tmp/commit-msg-bad.txt
```

Result: command failed with a message telling the user to use `repair-openspec-traceability-index` instead.

### Reject duplicate change ids

```bash
bun scripts/openspec-trace.ts commit-msg add-openspec-trace-commit-cli add-openspec-trace-commit-cli --title "feat: duplicate"
```

Result: command failed with a duplicate change id message.

### Validate archived original change ids

```bash
printf 'docs: archived original\n\nOpenSpec-Change: repair-openspec-traceability-index\n' > /tmp/commit-msg-archived-original.txt
bun scripts/openspec-trace.ts check-commit-msg /tmp/commit-msg-archived-original.txt --change repair-openspec-traceability-index
```

Result: command exited successfully.

### Reject malformed OpenSpec trailer keys

```bash
printf 'docs: malformed\n\nopenspec-change: add-openspec-trace-commit-cli\n' > /tmp/commit-msg-malformed.txt
bun scripts/openspec-trace.ts check-commit-msg /tmp/commit-msg-malformed.txt
```

Result: command failed with an invalid trailer syntax message.

### Allow non-OpenSpec commit messages without expected change

```bash
printf 'docs: no openspec\n' > /tmp/commit-msg-none.txt
bun scripts/openspec-trace.ts check-commit-msg /tmp/commit-msg-none.txt
```

Result: command exited successfully.
