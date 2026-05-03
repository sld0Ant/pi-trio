#!/usr/bin/env bun

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const CHANGE_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const ARCHIVE_FOLDER_PATTERN = /^\d{4}-\d{2}-\d{2}-(.+)$/;
const TASK_ID_PATTERN = /^\d+(?:\.\d+)*$/;

type ParsedArgs = {
  positionals: string[];
  options: Map<string, string[]>;
};

type ValidationContext = {
  root?: string;
  activeChanges: Set<string>;
  archivedOriginalChanges: Set<string>;
  archiveFolderToOriginal: Map<string, string>;
  originalToArchiveFolder: Map<string, string>;
};

type StatusPhase = 'pre-review' | 'post-review' | 'archive' | 'commit';
type CheckState = 'pass' | 'fail' | 'warn' | 'not_checked' | 'skip';

type StatusCheck = {
  id: string;
  label: string;
  state: CheckState;
  severity: 'required' | 'warning' | 'info';
  message: string;
  details?: Record<string, unknown>;
};

type ResolvedChange = {
  changeId: string;
  state: 'active' | 'archived';
  path: string;
  archiveDuplicate?: string;
};

type TaskPhaseStatus = {
  state: 'pass' | 'fail' | 'warn' | 'not_checked';
  pending: Array<{ id: string; text: string }>;
  warnings: string[];
};

type TaskEntry = {
  index: number;
  id: string;
  complete: boolean;
  text: string;
  phase: TaskPhase;
};

type TaskPhase = 'implementation' | 'review' | 'post-review';

function main() {
  const [command, ...args] = Bun.argv.slice(2);

  try {
    if (command === 'commit-msg') {
      printCommitMessage(args);
      return;
    }

    if (command === 'check-commit-msg') {
      checkCommitMessage(args);
      return;
    }

    if (command === 'run') {
      runTaskCommand(args);
      return;
    }

    if (command === 'tasks') {
      handleTasksCommand(args);
      return;
    }

    if (command === 'status') {
      showStatus(args);
      return;
    }

    printUsage();
    process.exit(command ? 1 : 0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function printCommitMessage(args: string[]) {
  const parsed = parseArgs(args);
  const title = singleOption(parsed, 'title');

  if (!title) {
    throw new Error('commit-msg requires --title <title>');
  }

  validateChangeIds(parsed.positionals, loadValidationContext(process.cwd()));

  console.log(title);
  console.log('');
  for (const changeId of parsed.positionals) {
    console.log(`OpenSpec-Change: ${changeId}`);
  }
}

function checkCommitMessage(args: string[]) {
  const parsed = parseArgs(args);
  const [filePath] = parsed.positionals;

  if (!filePath || parsed.positionals.length > 1) {
    throw new Error('check-commit-msg requires exactly one <file> argument');
  }

  const context = loadValidationContext(process.cwd());
  const expectedChanges = parsed.options.get('change') ?? [];
  if (expectedChanges.length > 0) {
    validateChangeIds(expectedChanges, context);
  }

  const messagePath = resolve(filePath);
  if (!existsSync(messagePath)) {
    throw new Error(`commit message file not found: ${filePath}`);
  }

  const message = readFileSync(messagePath, 'utf8');
  const trailers = parseOpenSpecTrailers(message, context);

  for (const expectedChange of expectedChanges) {
    if (!trailers.includes(expectedChange)) {
      throw new Error(`missing expected OpenSpec-Change trailer: ${expectedChange}`);
    }
  }
}

function runTaskCommand(args: string[]) {
  const separatorIndex = args.indexOf('--');
  if (separatorIndex === -1) {
    throw new Error('run requires -- before the command');
  }

  const parsed = parseArgs(args.slice(0, separatorIndex));
  const command = args.slice(separatorIndex + 1);
  const [changeId] = parsed.positionals;
  const taskId = singleOption(parsed, 'task');

  if (!changeId || parsed.positionals.length > 1) {
    throw new Error('run requires exactly one <change-id> argument');
  }

  if (!taskId) {
    throw new Error('run requires --task <task-id>');
  }

  if (command.length === 0) {
    throw new Error('run requires a command after --');
  }

  const context = loadValidationContext(process.cwd());
  validateChangeId(changeId, context);
  const taskFile = loadTaskFile(changeId, context);
  const task = findTask(taskFile.content, taskId);

  if (task.complete) {
    console.log(`already complete: ${task.id} ${task.text}`);
    return;
  }

  const result = Bun.spawnSync(command, {
    cwd: context.root ?? process.cwd(),
    env: process.env,
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const exitCode = result.exitCode ?? 1;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }

  writeFileSync(taskFile.path, markTaskComplete(taskFile.content, task), 'utf8');
  console.log(`marked complete: ${task.id} ${task.text}`);
}

function handleTasksCommand(args: string[]) {
  const [subcommand, ...subcommandArgs] = args;

  if (subcommand === 'mark') {
    markTask(subcommandArgs);
    return;
  }

  if (subcommand === 'check') {
    checkTasks(subcommandArgs);
    return;
  }

  throw new Error('tasks requires a subcommand: mark or check');
}

function markTask(args: string[]) {
  const parsed = parseArgs(args);
  const [changeId] = parsed.positionals;
  const taskId = singleOption(parsed, 'task');

  if (!changeId || parsed.positionals.length > 1) {
    throw new Error('tasks mark requires exactly one <change-id> argument');
  }

  if (!taskId) {
    throw new Error('tasks mark requires --task <task-id>');
  }

  const context = loadValidationContext(process.cwd());
  validateChangeId(changeId, context);
  const taskFile = loadTaskFile(changeId, context);
  const task = findTask(taskFile.content, taskId);

  if (task.complete) {
    console.log(`already complete: ${task.id} ${task.text}`);
    return;
  }

  writeFileSync(taskFile.path, markTaskComplete(taskFile.content, task), 'utf8');
  console.log(`marked complete: ${task.id} ${task.text}`);
}

function checkTasks(args: string[]) {
  const parsed = parseArgs(args);
  const [changeId] = parsed.positionals;
  const phase = singleOption(parsed, 'phase') ?? 'pre-review';

  if (!changeId || parsed.positionals.length > 1) {
    throw new Error('tasks check requires exactly one <change-id> argument');
  }

  if (phase !== 'pre-review' && phase !== 'post-review') {
    throw new Error(`invalid phase: ${phase}`);
  }

  const context = loadValidationContext(process.cwd());
  validateChangeId(changeId, context);
  const taskFile = loadTaskFile(changeId, context);
  const tasks = parseTasks(taskFile.content);
  const requiredTasks = tasks.filter(task => isRequiredForPhase(task, phase));
  const pendingTasks = requiredTasks.filter(task => !task.complete);

  if (pendingTasks.length === 0) {
    console.log(`ready: ${phase}`);
    return;
  }

  console.log(`not ready: ${phase}`);
  for (const task of pendingTasks) {
    console.log(`pending: ${task.id} ${task.text}`);
  }

  process.exit(1);
}

function showStatus(args: string[]) {
  const jsonOutput = args.includes('--json');
  let parsed: ParsedArgs;
  let changeId = '';
  let phase: StatusPhase = 'pre-review';
  const checks: StatusCheck[] = [];

  try {
    parsed = parseArgs(args);
    [changeId] = parsed.positionals;
    phase = (singleOption(parsed, 'phase') ?? 'pre-review') as StatusPhase;
    assertAllowedOptions(parsed, ['phase', 'json']);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emitStatusUsageError(jsonOutput, changeId, phase, message);
  }

  if (!changeId || parsed.positionals.length > 1) {
    emitStatusUsageError(jsonOutput, changeId, phase, 'status requires exactly one <change-id> argument');
  }

  if (!['pre-review', 'post-review', 'archive', 'commit'].includes(phase)) {
    emitStatusUsageError(jsonOutput, changeId, phase, `invalid phase: ${phase}`);
  }

  const context = loadValidationContext(process.cwd());
  if (!context.root) {
    emitStatusUsageError(jsonOutput, changeId, phase, 'openspec root not found');
  }

  if (!CHANGE_ID_PATTERN.test(changeId)) {
    emitStatusUsageError(jsonOutput, changeId, phase, `invalid OpenSpec change id: ${changeId}`);
  }

  const archivedOriginal = inferArchiveOriginalChangeId(changeId, context);
  if (archivedOriginal || context.archiveFolderToOriginal.has(changeId)) {
    emitStatusUsageError(jsonOutput, changeId, phase, `dated archive folder names are not valid change ids: use ${archivedOriginal ?? context.archiveFolderToOriginal.get(changeId)} instead of ${changeId}`);
  }

  const resolved = resolveChangeForStatus(changeId, context, checks);

  if (resolved) {
    if (resolved.state === 'archived' && (phase === 'pre-review' || phase === 'post-review')) {
      checks.push(statusCheck('phase_validity', 'Phase validity', 'fail', 'required', `phase ${phase} is not valid for archived changes`));
    }
    checks.push(...artifactChecks(resolved));
    checks.push(validationCheck(resolved, phase, context));
    checks.push(sourceBoundaryCheck(resolved, phase, context));
    checks.push(taskReadinessCheck(resolved, phase));
    checks.push(archiveStateCheck(resolved, phase));
    checks.push(commitReadinessCheck(changeId, phase));
  }

  const exitState = checks.some(check => check.state === 'fail') ? 'fail' : 'pass';
  const payload = {
    version: 1,
    changeId,
    phase,
    resolvedState: resolved?.state ?? 'missing',
    exitState,
    checks,
  };

  if (jsonOutput) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    printHumanStatus(payload);
  }

  process.exit(exitState === 'pass' ? 0 : 1);
}

function emitStatusUsageError(jsonOutput: boolean, changeId: string, phase: StatusPhase, message: string): never {
  const payload = {
    version: 1,
    changeId,
    phase,
    resolvedState: 'error',
    exitState: 'fail',
    checks: [statusCheck('usage', 'Usage', 'fail', 'required', message)],
  };
  if (jsonOutput) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.error(message);
  }
  process.exit(2);
}

function resolveChangeForStatus(changeId: string, context: ValidationContext, checks: StatusCheck[]): ResolvedChange | undefined {
  if (!context.root) return undefined;

  const activePath = join(context.root, 'openspec', 'changes', changeId);
  const archiveFolder = context.originalToArchiveFolder.get(changeId);
  const archivedPath = archiveFolder ? join(context.root, 'openspec', 'changes', 'archive', archiveFolder) : undefined;
  const hasActive = existsSync(activePath);
  const hasArchived = !!archivedPath && existsSync(archivedPath);

  if (!hasActive && !hasArchived) {
    checks.push(statusCheck('change_exists', 'Change exists', 'fail', 'required', `change not found: ${changeId}`));
    return undefined;
  }

  if (hasActive) {
    checks.push(statusCheck('change_exists', 'Change exists', 'pass', 'required', `active change found: openspec/changes/${changeId}`));
    if (hasArchived) {
      checks.push(statusCheck('archive_duplicate', 'Archive duplicate', 'warn', 'warning', `archived duplicate also exists: ${archiveFolder}`));
    }
    return { changeId, state: 'active', path: activePath, archiveDuplicate: hasArchived ? archiveFolder : undefined };
  }

  checks.push(statusCheck('change_exists', 'Change exists', 'pass', 'required', `archived change found: openspec/changes/archive/${archiveFolder}`));
  return { changeId, state: 'archived', path: archivedPath as string };
}

function artifactChecks(change: ResolvedChange): StatusCheck[] {
  const required = ['proposal.md', 'tasks.md'];
  const checks = required.map(file => {
    const exists = existsSync(join(change.path, file));
    return statusCheck(`artifact_${file.replace('.', '_')}`, file, exists ? 'pass' : 'fail', 'required', exists ? `${file} found` : `${file} missing`);
  });

  const designExists = existsSync(join(change.path, 'design.md'));
  checks.push(statusCheck('artifact_design_md', 'design.md', designExists ? 'pass' : change.state === 'active' ? 'warn' : 'fail', change.state === 'active' ? 'warning' : 'required', designExists ? 'design.md found' : 'design.md missing'));

  const specsDir = join(change.path, 'specs');
  const specFiles = existsSync(specsDir) ? [...new Bun.Glob('**/spec.md').scanSync({ cwd: specsDir })] : [];
  checks.push(statusCheck('artifact_specs', 'specs', specFiles.length > 0 ? 'pass' : 'fail', 'required', specFiles.length > 0 ? `${specFiles.length} spec file(s) found` : 'no specs/**/spec.md files found', { files: specFiles }));
  return checks;
}

function validationCheck(change: ResolvedChange, phase: StatusPhase, context: ValidationContext): StatusCheck {
  if (!context.root) return statusCheck('validation', 'OpenSpec validation', 'fail', 'required', 'openspec root not found');

  if (change.state === 'active') {
    const result = Bun.spawnSync(['openspec', 'validate', change.changeId, '--strict'], { cwd: context.root, stdout: 'pipe', stderr: 'pipe' });
    const passed = result.exitCode === 0;
    return statusCheck('validation_active', 'Active strict validation', passed ? 'pass' : phase === 'commit' ? 'warn' : 'fail', phase === 'commit' ? 'warning' : 'required', passed ? 'openspec validate passed' : 'openspec validate failed', commandDetails(result));
  }

  const result = Bun.spawnSync(['openspec', 'validate', '--specs', '--strict'], { cwd: context.root, stdout: 'pipe', stderr: 'pipe' });
  const passed = result.exitCode === 0;
  return statusCheck('validation_baseline', 'Baseline strict validation', passed ? 'pass' : 'warn', 'warning', passed ? 'openspec baseline validation passed' : 'openspec baseline validation failed', commandDetails(result));
}

function sourceBoundaryCheck(change: ResolvedChange, phase: StatusPhase, context: ValidationContext): StatusCheck {
  if (change.state === 'archived') {
    return statusCheck('source_boundary', 'Source boundary', 'not_checked', 'info', 'archived changes are not checked for working-tree drift');
  }
  if (!context.root) return statusCheck('source_boundary', 'Source boundary', 'not_checked', 'info', 'openspec root not found');

  const discovery = discoverChangedFiles(context.root);
  if (!discovery.available) {
    return statusCheck('source_boundary', 'Source boundary', 'not_checked', 'info', 'git changed-file discovery unavailable', { warnings: discovery.warnings });
  }
  if (!discovery.complete) {
    return statusCheck('source_boundary', 'Source boundary', 'not_checked', 'info', 'git changed-file discovery incomplete', { warnings: discovery.warnings, files: discovery.files });
  }

  const changedFiles = discovery.files.filter(path => !path.startsWith(`openspec/changes/${change.changeId}/`));
  const boundary = parseSourceBoundary(change.path);
  if (boundary.length === 0) {
    return statusCheck('source_boundary', 'Source boundary', 'warn', 'warning', 'source boundary missing or not parseable', { changedFiles });
  }

  const outside = changedFiles.filter(path => !boundary.some(prefix => path === prefix || path.startsWith(`${prefix.replace(/\/$/, '')}/`)));
  if (outside.length === 0) {
    return statusCheck('source_boundary', 'Source boundary', 'pass', 'required', 'changed files are inside parseable source boundary', { changedFiles, boundary });
  }

  const state = phase === 'pre-review' || phase === 'post-review' ? 'fail' : 'warn';
  return statusCheck('source_boundary', 'Source boundary', state, state === 'fail' ? 'required' : 'warning', 'changed files outside source boundary', { changedFiles, boundary, outside });
}

function taskReadinessCheck(change: ResolvedChange, phase: StatusPhase): StatusCheck {
  if (phase === 'archive' || phase === 'commit') {
    return statusCheck('task_readiness', 'Task readiness', 'warn', 'warning', `task readiness is informational for ${phase}`);
  }

  try {
    const taskFile = loadTaskFile(change.changeId, loadValidationContext(process.cwd()));
    const readiness = taskPhaseStatus(taskFile.content, phase);
    return statusCheck('task_readiness', 'Task readiness', readiness.state, readiness.state === 'fail' ? 'required' : 'warning', readiness.state === 'pass' ? `tasks ready for ${phase}` : `tasks not ready for ${phase}`, { pending: readiness.pending, warnings: readiness.warnings });
  } catch (error) {
    return statusCheck('task_readiness', 'Task readiness', 'not_checked', 'warning', error instanceof Error ? error.message : String(error));
  }
}

function archiveStateCheck(change: ResolvedChange, phase: StatusPhase): StatusCheck {
  if (phase === 'commit') {
    return statusCheck('archive_state', 'Archive state', 'warn', 'warning', change.state === 'archived' ? 'already archived' : 'active change is not archived yet');
  }
  if (phase !== 'archive') return statusCheck('archive_state', 'Archive state', 'skip', 'info', `not required for ${phase}`);
  if (change.state === 'archived') return statusCheck('archive_state', 'Archive state', 'pass', 'required', 'already archived');
  return statusCheck('archive_state', 'Archive state', 'pass', 'required', 'ready to archive when review gates pass');
}

function commitReadinessCheck(changeId: string, phase: StatusPhase): StatusCheck {
  if (phase !== 'commit') return statusCheck('commit_readiness', 'Commit readiness', 'skip', 'info', `not required for ${phase}`);
  const archiveOriginal = originalChangeIdFromArchiveFolder(changeId);
  if (archiveOriginal) return statusCheck('commit_readiness', 'Commit readiness', 'fail', 'required', `use original change id ${archiveOriginal}, not dated archive folder`);
  return statusCheck('commit_readiness', 'Commit readiness', CHANGE_ID_PATTERN.test(changeId) ? 'pass' : 'fail', 'required', CHANGE_ID_PATTERN.test(changeId) ? `commit trailer ready: OpenSpec-Change: ${changeId}` : 'change id is not lowercase kebab-case');
}

function statusCheck(id: string, label: string, state: CheckState, severity: 'required' | 'warning' | 'info', message: string, details: Record<string, unknown> = {}): StatusCheck {
  return { id, label, state, severity, message, details };
}

function commandDetails(result: ReturnType<typeof Bun.spawnSync>): Record<string, unknown> {
  return {
    exitCode: result.exitCode,
    stdout: new TextDecoder().decode(result.stdout).trim(),
    stderr: new TextDecoder().decode(result.stderr).trim(),
  };
}

function discoverChangedFiles(root: string): { available: boolean; complete: boolean; files: string[]; warnings: string[] } {
  const commands = [
    ['git', 'diff', '--name-only', '--cached'],
    ['git', 'diff', '--name-only'],
    ['git', 'ls-files', '--others', '--exclude-standard'],
  ];
  const files = new Set<string>();
  const warnings: string[] = [];
  for (const command of commands) {
    const result = Bun.spawnSync(command, { cwd: root, stdout: 'pipe', stderr: 'pipe' });
    if (result.exitCode !== 0) {
      warnings.push(`${command.join(' ')} failed with exit ${result.exitCode}`);
      continue;
    }
    for (const file of new TextDecoder().decode(result.stdout).split(/\r?\n/).filter(Boolean)) {
      files.add(file);
    }
  }
  return { available: warnings.length < commands.length, complete: warnings.length === 0, files: [...files].sort(), warnings };
}

function parseSourceBoundary(changePath: string): string[] {
  const boundary = new Set<string>();
  for (const file of ['proposal.md', 'design.md']) {
    const path = join(changePath, file);
    if (!existsSync(path)) continue;
    const lines = readFileSync(path, 'utf8').split(/\r?\n/);
    let inBoundary = false;
    for (const line of lines) {
      const heading = line.match(/^#{1,6}\s+(.+)$/);
      if (heading) {
        const normalized = heading[1].toLowerCase();
        inBoundary = normalized.includes('source boundary') || normalized.includes('allowed implementation');
        continue;
      }
      if (!inBoundary) continue;
      const bullet = line.match(/^[-*]\s+`?([^`\s][^`]*)`?\s*$/);
      if (bullet) {
        for (const entry of normalizeBoundaryEntry(bullet[1])) {
          boundary.add(entry);
        }
      }
      if (line.trim() === '') continue;
    }
  }
  return [...boundary].sort();
}

function normalizeBoundaryEntry(value: string): string[] {
  const normalized = value.trim().replace(/^\.\//, '');
  if (normalized === 'README/CHANGELOG documentation') {
    return ['README.md', 'CHANGELOG.md'];
  }
  return [normalized];
}

function taskPhaseStatus(content: string, phase: StatusPhase): TaskPhaseStatus {
  if (phase !== 'pre-review' && phase !== 'post-review') {
    return { state: 'warn', pending: [], warnings: [`task phase ${phase} is not checked`] };
  }

  const tasks = parseTasks(content);
  const required = tasks.filter(task => isRequiredForPhase(task, phase));
  const pending = required.filter(task => !task.complete).map(task => ({ id: task.id, text: task.text }));
  return { state: pending.length > 0 ? 'fail' : 'pass', pending, warnings: [] };
}

function printHumanStatus(payload: { changeId: string; phase: StatusPhase; resolvedState: string; exitState: string; checks: StatusCheck[] }) {
  console.log(`OpenSpec status: ${payload.changeId}`);
  console.log(`phase: ${payload.phase}`);
  console.log(`state: ${payload.resolvedState}`);
  console.log(`exit: ${payload.exitState}`);
  for (const check of payload.checks) {
    console.log(`[${check.state}] ${check.label}: ${check.message}`);
  }
}

function assertAllowedOptions(parsed: ParsedArgs, allowedOptions: string[]): void {
  const allowed = new Set(allowedOptions);
  for (const optionName of parsed.options.keys()) {
    if (!allowed.has(optionName)) {
      throw new Error(`unknown option --${optionName}`);
    }
  }
}

function parseArgs(args: string[]): ParsedArgs {
  const positionals: string[] = [];
  const options = new Map<string, string[]>();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg.startsWith('--')) {
      const optionName = arg.slice(2);
      const optionValue = args[index + 1];

      if (!optionName) {
        throw new Error('empty option name');
      }

      if (optionName === 'json') {
        options.set(optionName, ['true']);
        continue;
      }

      if (!optionValue || optionValue.startsWith('--')) {
        throw new Error(`option --${optionName} requires a value`);
      }

      options.set(optionName, [...(options.get(optionName) ?? []), optionValue]);
      index += 1;
    } else {
      positionals.push(arg);
    }
  }

  return { positionals, options };
}

function singleOption(parsed: ParsedArgs, name: string) {
  const values = parsed.options.get(name) ?? [];

  if (values.length > 1) {
    throw new Error(`option --${name} can only be provided once`);
  }

  return values[0];
}

function validateChangeIds(changeIds: string[], context: ValidationContext) {
  if (changeIds.length === 0) {
    throw new Error('at least one change id is required');
  }

  const seen = new Set<string>();
  for (const changeId of changeIds) {
    validateChangeId(changeId, context);

    if (seen.has(changeId)) {
      throw new Error(`duplicate OpenSpec change id: ${changeId}`);
    }

    seen.add(changeId);
  }
}

function validateChangeId(changeId: string, context: ValidationContext) {
  const originalChangeId = context.archiveFolderToOriginal.get(changeId) ?? inferArchiveOriginalChangeId(changeId, context);
  if (originalChangeId) {
    throw new Error(`dated archive folder names are not valid change ids: use ${originalChangeId} instead of ${changeId}`);
  }

  if (!CHANGE_ID_PATTERN.test(changeId)) {
    throw new Error(`invalid OpenSpec change id: ${changeId}`);
  }

  if (
    (context.activeChanges.size > 0 || context.archivedOriginalChanges.size > 0) &&
    !context.activeChanges.has(changeId) &&
    !context.archivedOriginalChanges.has(changeId)
  ) {
    throw new Error(`unknown OpenSpec change id: ${changeId}`);
  }
}

function parseOpenSpecTrailers(message: string, context: ValidationContext) {
  const trailers: string[] = [];
  const seen = new Set<string>();
  const lines = message.split(/\r?\n/);

  for (const line of lines) {
    const likelyOpenSpecTrailer = /^openspec[-\s]?change\s*:/i.test(line) || /^OpenSpec-Change\b/.test(line);
    if (!likelyOpenSpecTrailer) {
      continue;
    }

    const match = line.match(/^OpenSpec-Change: (.+)$/);
    if (!match) {
      throw new Error(`invalid OpenSpec trailer syntax: ${line}`);
    }

    const changeId = match[1];
    validateChangeId(changeId, context);

    if (seen.has(changeId)) {
      throw new Error(`duplicate OpenSpec-Change trailer: ${changeId}`);
    }

    seen.add(changeId);
    trailers.push(changeId);
  }

  return trailers;
}

function loadTaskFile(changeId: string, context: ValidationContext) {
  if (!context.root) {
    throw new Error('openspec root not found');
  }

  const activeTaskPath = join(context.root, 'openspec', 'changes', changeId, 'tasks.md');
  if (existsSync(activeTaskPath)) {
    return { path: activeTaskPath, content: readFileSync(activeTaskPath, 'utf8') };
  }

  const archiveFolder = context.originalToArchiveFolder.get(changeId);
  if (archiveFolder) {
    const archivedTaskPath = join(context.root, 'openspec', 'changes', 'archive', archiveFolder, 'tasks.md');
    if (existsSync(archivedTaskPath)) {
      return { path: archivedTaskPath, content: readFileSync(archivedTaskPath, 'utf8') };
    }
  }

  throw new Error(`tasks.md not found for change: ${changeId}`);
}

function findTask(content: string, taskId: string) {
  if (!TASK_ID_PATTERN.test(taskId)) {
    throw new Error(`invalid task id: ${taskId}`);
  }

  const matches = parseTasks(content).filter(task => task.id === taskId);
  if (matches.length === 0) {
    throw new Error(`task not found: ${taskId}`);
  }

  if (matches.length > 1) {
    throw new Error(`ambiguous task id: ${taskId}`);
  }

  return matches[0];
}

function parseTasks(content: string) {
  const tasks: TaskEntry[] = [];
  const lines = content.split(/\r?\n/);
  let phase: TaskPhase = 'implementation';

  lines.forEach((line, index) => {
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      phase = classifyHeading(heading[1], phase);
    }

    const task = line.match(/^- \[([ x])] (\d+(?:\.\d+)*)\s+(.+)$/);
    if (!task) {
      return;
    }

    tasks.push({
      index,
      id: task[2],
      complete: task[1] === 'x',
      text: task[3],
      phase,
    });
  });

  return tasks;
}

function classifyHeading(heading: string, currentPhase: TaskPhase): TaskPhase {
  const normalizedHeading = heading.toLowerCase();

  if (normalizedHeading.includes('post-review')) {
    return 'post-review';
  }

  if (
    normalizedHeading.includes('review handoff') ||
    normalizedHeading.includes('code review') ||
    normalizedHeading.includes('review')
  ) {
    return 'review';
  }

  return currentPhase;
}

function isRequiredForPhase(task: TaskEntry, phase: string) {
  if (phase === 'pre-review') {
    return task.phase === 'implementation';
  }

  return task.phase === 'implementation' || task.phase === 'review';
}

function markTaskComplete(content: string, task: TaskEntry) {
  const lines = content.split(/\r?\n/);
  lines[task.index] = lines[task.index].replace('- [ ]', '- [x]');
  return lines.join('\n');
}

function loadValidationContext(startDir: string): ValidationContext {
  const root = findOpenSpecRoot(startDir);
  const activeChanges = new Set<string>();
  const archivedOriginalChanges = new Set<string>();
  const archiveFolderToOriginal = new Map<string, string>();
  const originalToArchiveFolder = new Map<string, string>();

  if (!root) {
    return { activeChanges, archivedOriginalChanges, archiveFolderToOriginal, originalToArchiveFolder };
  }

  const changesDir = join(root, 'openspec', 'changes');
  for (const entry of new Bun.Glob('*').scanSync({ cwd: changesDir, onlyFiles: false })) {
    const entryPath = join(changesDir, entry);
    if (entry === 'archive' || !existsSync(entryPath)) {
      continue;
    }

    activeChanges.add(entry);
  }

  const archiveDir = join(changesDir, 'archive');
  if (!existsSync(archiveDir)) {
    return { root, activeChanges, archivedOriginalChanges, archiveFolderToOriginal, originalToArchiveFolder };
  }

  for (const entry of new Bun.Glob('*').scanSync({ cwd: archiveDir, onlyFiles: false })) {
    const originalChangeId = originalChangeIdFromArchiveFolder(entry);
    if (!originalChangeId) {
      continue;
    }

    archivedOriginalChanges.add(originalChangeId);
    archiveFolderToOriginal.set(entry, originalChangeId);
    originalToArchiveFolder.set(originalChangeId, entry);
  }

  return { root, activeChanges, archivedOriginalChanges, archiveFolderToOriginal, originalToArchiveFolder };
}

function inferArchiveOriginalChangeId(changeId: string, context: ValidationContext) {
  const originalChangeId = originalChangeIdFromArchiveFolder(changeId);
  if (!originalChangeId) {
    return undefined;
  }

  if (context.activeChanges.size === 0 && context.archivedOriginalChanges.size === 0) {
    return originalChangeId;
  }

  return context.activeChanges.has(originalChangeId) || context.archivedOriginalChanges.has(originalChangeId) ? originalChangeId : undefined;
}

function originalChangeIdFromArchiveFolder(folderName: string) {
  const match = folderName.match(ARCHIVE_FOLDER_PATTERN);
  if (!match) {
    return undefined;
  }

  const originalChangeId = match[1];
  return CHANGE_ID_PATTERN.test(originalChangeId) ? originalChangeId : undefined;
}

function findOpenSpecRoot(startDir: string) {
  let currentDir = resolve(startDir);

  while (true) {
    if (existsSync(join(currentDir, 'openspec', 'changes'))) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

function printUsage() {
  console.log(`Usage:
  openspec-trace commit-msg <change-id> [<change-id>...] --title <title>
  openspec-trace check-commit-msg <file> [--change <change-id>]
  openspec-trace run <change-id> --task <task-id> -- <command...>
  openspec-trace tasks mark <change-id> --task <task-id>
  openspec-trace tasks check <change-id> [--phase pre-review|post-review]
  openspec-trace status <change-id> [--phase pre-review|post-review|archive|commit] [--json]`);
}

main();
