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
  archiveFoldersByOriginal: Map<string, string[]>;
  malformedArchiveFolders: string[];
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

type IndexCard = {
  changeId: string;
  content: string;
};

type IndexSections = {
  beforeActive: string;
  activeBody: string;
  betweenActiveAndArchived: string;
  archivedBody: string;
  afterArchived: string;
};


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

    if (command === 'index') {
      handleIndexCommand(args);
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

function handleIndexCommand(args: string[]) {
  const [subcommand, ...subcommandArgs] = args;

  if (subcommand === 'add-active') {
    addActiveIndexCard(subcommandArgs);
    return;
  }

  if (subcommand === 'archive') {
    archiveIndexCard(subcommandArgs);
    return;
  }

  if (subcommand === 'validate') {
    validateIndexCommand(subcommandArgs);
    return;
  }

  throw new Error('index requires a subcommand: add-active, archive, or validate');
}

function addActiveIndexCard(args: string[]) {
  const parsed = parseArgs(args);
  const [changeId] = parsed.positionals;
  if (!changeId || parsed.positionals.length > 1) throw new Error('index add-active requires exactly one <change-id> argument');

  const context = loadValidationContext(process.cwd());
  validateActiveChange(changeId, context);
  const indexPath = requireIndexPath(context);
  const index = readFileSync(indexPath, 'utf8');
  const sections = parseIndexSections(index);
  const activeCards = parseCards(sections.activeBody);
  assertNoDuplicateCard(activeCards, changeId, 'Active Changes');

  const existingCard = activeCards.find(card => card.changeId === changeId);
  const generatedCard = buildActiveCard(changeId, context);
  const nextCard = existingCard ? mergeHumanFields(existingCard.content, generatedCard) : generatedCard;
  const nextActiveCards = upsertCard(activeCards, { changeId, content: nextCard });
  writeFileSync(indexPath, renderIndex(sections, nextActiveCards, parseCards(sections.archivedBody)), 'utf8');
  console.log(`updated active index card: ${changeId}`);
}

function archiveIndexCard(args: string[]) {
  const parsed = parseArgs(args);
  const [changeId] = parsed.positionals;
  if (!changeId || parsed.positionals.length > 1) throw new Error('index archive requires exactly one <change-id> argument');

  const context = loadValidationContext(process.cwd());
  validateChangeId(changeId, context);
  const archiveFolder = requireSingleArchiveFolder(changeId, context);
  const indexPath = requireIndexPath(context);
  const index = readFileSync(indexPath, 'utf8');
  const sections = parseIndexSections(index);
  const activeCards = parseCards(sections.activeBody);
  const archivedCards = parseCards(sections.archivedBody);
  assertNoDuplicateCard(activeCards, changeId, 'Active Changes');
  assertNoDuplicateCard(archivedCards, changeId, 'Archived Changes');

  const existingCard = activeCards.find(card => card.changeId === changeId) ?? archivedCards.find(card => card.changeId === changeId);
  const generatedCard = buildArchivedCard(changeId, archiveFolder, context);
  const nextCard = existingCard ? mergeHumanFields(existingCard.content, generatedCard) : generatedCard;
  const nextActiveCards = activeCards.filter(card => card.changeId !== changeId);
  const nextArchivedCards = upsertCard(archivedCards, { changeId, content: nextCard });
  writeFileSync(indexPath, renderIndex(sections, nextActiveCards, nextArchivedCards), 'utf8');
  console.log(`updated archived index card: ${changeId}`);
}

function validateIndexCommand(args: string[]) {
  try {
    const parsed = parseArgs(args);
    if (parsed.positionals.length > 0) throw new Error('index validate does not take positional arguments');

    const context = loadValidationContext(process.cwd());
    const indexPath = requireIndexPath(context);
    const index = readFileSync(indexPath, 'utf8');
    const sections = parseIndexSections(index);
    const checks = validateIndex(index, sections, context);
    for (const check of checks) {
      console.log(`[${check.state}] ${check.message}`);
    }
    process.exit(checks.some(check => check.state === 'fail') ? 1 : 0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}

function validateActiveChange(changeId: string, context: ValidationContext) {
  validateChangeId(changeId, context);
  if (!context.root || !existsSync(join(context.root, 'openspec', 'changes', changeId))) {
    throw new Error(`active change not found: ${changeId}`);
  }
}

function requireIndexPath(context: ValidationContext) {
  if (!context.root) throw new Error('openspec root not found');
  const indexPath = join(context.root, 'openspec', 'INDEX.md');
  if (!existsSync(indexPath)) throw new Error('openspec/INDEX.md not found');
  return indexPath;
}

function parseIndexSections(index: string): IndexSections {
  const activeMarker = /^## Active Changes$/m.exec(index);
  const archivedMarker = /^## Archived Changes$/m.exec(index);
  const activeIndex = activeMarker?.index ?? -1;
  const archivedIndex = archivedMarker?.index ?? -1;
  if (!activeMarker || !archivedMarker || archivedIndex < activeIndex) {
    throw new Error('openspec/INDEX.md must contain Active Changes before Archived Changes');
  }

  const activeBodyStart = activeIndex + activeMarker[0].length;
  const archivedBodyStart = archivedIndex + archivedMarker[0].length;
  return {
    beforeActive: index.slice(0, activeBodyStart),
    activeBody: index.slice(activeBodyStart, archivedIndex),
    betweenActiveAndArchived: index.slice(archivedIndex, archivedBodyStart),
    archivedBody: index.slice(archivedBodyStart),
    afterArchived: '',
  };
}

function parseCards(sectionBody: string): IndexCard[] {
  const cards: IndexCard[] = [];
  const lines = sectionBody.split(/\r?\n/);
  let currentChangeId: string | undefined;
  let currentLines: string[] = [];

  for (const line of lines) {
    const heading = line.match(/^### ([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)$/);
    if (heading) {
      if (currentChangeId) {
        cards.push({ changeId: currentChangeId, content: currentLines.join('\n').trim() + '\n' });
      }
      currentChangeId = heading[1];
      currentLines = [line];
      continue;
    }

    if (currentChangeId) {
      currentLines.push(line);
    }
  }

  if (currentChangeId) {
    cards.push({ changeId: currentChangeId, content: currentLines.join('\n').trim() + '\n' });
  }

  return cards;
}

function assertNoDuplicateCard(cards: IndexCard[], changeId: string, section: string) {
  if (cards.filter(card => card.changeId === changeId).length > 1) {
    throw new Error(`duplicate ${section} cards for ${changeId}`);
  }
}

function upsertCard(cards: IndexCard[], card: IndexCard): IndexCard[] {
  const nextCards = cards.filter(existing => existing.changeId !== card.changeId);
  nextCards.push(card);
  return nextCards.sort((a, b) => a.changeId.localeCompare(b.changeId));
}

function renderIndex(sections: IndexSections, activeCards: IndexCard[], archivedCards: IndexCard[]) {
  return `${sections.beforeActive}\n\n${activeCards.map(card => card.content.trim()).join('\n\n')}\n\n${sections.betweenActiveAndArchived}\n\n${sortArchivedCards(archivedCards).map(card => card.content.trim()).join('\n\n')}\n`;
}

function sortArchivedCards(cards: IndexCard[]) {
  return [...cards].sort((a, b) => archiveDateFromCard(b.content).localeCompare(archiveDateFromCard(a.content)) || a.changeId.localeCompare(b.changeId));
}

function archiveDateFromCard(content: string) {
  return content.match(/openspec\/changes\/archive\/(\d{4}-\d{2}-\d{2})-/)?.[1] ?? '';
}

function buildActiveCard(changeId: string, context: ValidationContext) {
  if (!context.root) throw new Error('openspec root not found');
  const changePath = join(context.root, 'openspec', 'changes', changeId);
  const capabilities = capabilitiesForChange(changePath);
  const sourceBoundary = sourceBoundaryForChange(changePath);
  return renderCard(changeId, {
    status: 'active',
    capabilities,
    summary: 'TODO(index): summarize change',
    sourceBoundary,
    relatedChanges: ['TODO(index): add related changes'],
    keyDecisions: ['TODO(index): add key decisions'],
    archivePath: 'pending',
    commit: 'pending',
  });
}

function buildArchivedCard(changeId: string, archiveFolder: string, context: ValidationContext) {
  if (!context.root) throw new Error('openspec root not found');
  const changePath = join(context.root, 'openspec', 'changes', 'archive', archiveFolder);
  const capabilities = capabilitiesForChange(changePath);
  const sourceBoundary = sourceBoundaryForChange(changePath);
  return renderCard(changeId, {
    status: 'archived',
    capabilities,
    summary: 'TODO(index): summarize archived change',
    sourceBoundary,
    relatedChanges: ['TODO(index): add related changes'],
    keyDecisions: ['TODO(index): add key decisions'],
    archivePath: `\`openspec/changes/archive/${archiveFolder}/\``,
    commit: 'pending',
  });
}

function renderCard(changeId: string, fields: { status: string; capabilities: string[]; summary: string; sourceBoundary: string[]; relatedChanges: string[]; keyDecisions: string[]; archivePath: string; commit: string }) {
  return [
    `### ${changeId}`,
    `- Status: ${fields.status}`,
    '- Capability:',
    ...listOrPending(fields.capabilities),
    `- Summary: ${fields.summary}`,
    fields.sourceBoundary.length > 0 ? '- Source boundary:' : '- Source boundary: pending',
    ...fields.sourceBoundary.map(value => `  - \`${value}\``),
    '- Related changes:',
    ...listOrPending(fields.relatedChanges),
    '- Key decisions:',
    ...listOrPending(fields.keyDecisions),
    `- Archive path: ${fields.archivePath}`,
    `- Commit: ${fields.commit}`,
    '',
  ].join('\n');
}

function listOrPending(values: string[]) {
  return values.length > 0 ? values.map(value => `  - ${value}`) : ['  - pending'];
}

function capabilitiesForChange(changePath: string) {
  const specsPath = join(changePath, 'specs');
  if (!existsSync(specsPath)) return [];
  return readdirSync(specsPath, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
}

function sourceBoundaryForChange(changePath: string) {
  const values = new Set<string>();
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
        const boundaryEntry = normalizeIndexBoundaryEntry(bullet[1]);
        if (boundaryEntry) values.add(boundaryEntry);
      }
    }
  }
  return [...values].sort();
}

function normalizeIndexBoundaryEntry(value: string): string | undefined {
  const normalized = value.trim().replace(/^\.\//, '');
  if (normalized === 'README/CHANGELOG documentation') return normalized;
  if (/\s/.test(normalized)) return undefined;
  return normalized;
}

function mergeHumanFields(existingCard: string, generatedCard: string) {
  let merged = generatedCard;
  for (const field of ['Summary', 'Related changes', 'Key decisions']) {
    const existingValue = extractField(existingCard, field);
    if (existingValue && !isTodoIndexField(existingValue)) {
      merged = replaceField(merged, field, existingValue);
    }
  }
  const unknownFields = extractUnknownFields(existingCard);
  return unknownFields.length > 0 ? `${merged.trim()}\n${unknownFields.join('\n')}\n` : merged;
}

function extractField(card: string, field: string): string | undefined {
  const lines = card.split(/\r?\n/);
  const start = lines.findIndex(line => line.startsWith(`- ${field}:`));
  if (start === -1) return undefined;
  const collected = [lines[start]];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith('- ') || line.startsWith('### ')) break;
    if (line.trim()) collected.push(line);
  }
  return collected.join('\n');
}

function replaceField(card: string, field: string, value: string) {
  const lines = card.split(/\r?\n/);
  const start = lines.findIndex(line => line.startsWith(`- ${field}:`));
  if (start === -1) return card;
  let end = start + 1;
  while (end < lines.length && !lines[end].startsWith('- ') && !lines[end].startsWith('### ')) end += 1;
  lines.splice(start, end - start, ...value.split(/\r?\n/));
  return lines.join('\n');
}

function extractUnknownFields(card: string): string[] {
  const knownFields = new Set(['Status', 'Capability', 'Summary', 'Source boundary', 'Related changes', 'Key decisions', 'Archive path', 'Commit']);
  const lines = card.split(/\r?\n/);
  const fields: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^- ([^:]+):/);
    if (!match || knownFields.has(match[1])) continue;

    const collected = [lines[index]];
    index += 1;
    while (index < lines.length && !lines[index].startsWith('- ') && !lines[index].startsWith('### ')) {
      if (lines[index].trim()) collected.push(lines[index]);
      index += 1;
    }
    index -= 1;
    fields.push(collected.join('\n'));
  }
  return fields;
}

function isTodoIndexField(value: string) {
  const lines = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return true;
  const scalar = lines[0].replace(/^- [^:]+:\s*/, '');
  if (scalar) return scalar.startsWith('TODO(index):');
  const bullets = lines.slice(1).filter(line => line.startsWith('-'));
  return bullets.length > 0 && bullets.every(line => line.replace(/^[-*]\s+/, '').startsWith('TODO(index):'));
}

function requireSingleArchiveFolder(changeId: string, context: ValidationContext) {
  if (!context.root) throw new Error('openspec root not found');
  const archivePath = join(context.root, 'openspec', 'changes', 'archive');
  const archiveFolderPattern = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${escapeRegExp(changeId)}$`);
  const matches = existsSync(archivePath)
    ? readdirSync(archivePath, { withFileTypes: true }).filter(entry => entry.isDirectory() && archiveFolderPattern.test(entry.name)).map(entry => entry.name)
    : [];
  if (matches.length === 0) throw new Error(`archive directory not found for ${changeId}`);
  if (matches.length > 1) throw new Error(`multiple archive directories found for ${changeId}: ${matches.join(', ')}`);
  return matches[0];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateIndex(index: string, sections: IndexSections, context: ValidationContext) {
  const checks: Array<{ state: 'pass' | 'fail' | 'warn' | 'info'; message: string }> = [];
  const activeCards = parseCards(sections.activeBody);
  const archivedCards = parseCards(sections.archivedBody);
  const activeIds = new Set(activeCards.map(card => card.changeId));
  const archivedIds = new Set(archivedCards.map(card => card.changeId));

  checks.push(...indexContractChecks(index, activeCards, archivedCards));
  for (const folder of context.malformedArchiveFolders) {
    checks.push({ state: 'fail', message: `malformed archive directory: ${folder}` });
  }

  for (const changeId of duplicateCardIds(activeCards)) {
    checks.push({ state: 'fail', message: `duplicate active card: ${changeId}` });
  }
  for (const changeId of duplicateCardIds(archivedCards)) {
    checks.push({ state: 'fail', message: `duplicate archived card: ${changeId}` });
  }

  for (const changeId of context.activeChanges) {
    checks.push(activeIds.has(changeId) ? { state: 'pass', message: `active card exists: ${changeId}` } : { state: 'fail', message: `missing active card: ${changeId}` });
  }
  for (const changeId of context.archivedOriginalChanges) {
    const archiveFolders = context.archiveFoldersByOriginal.get(changeId) ?? [];
    if (archiveFolders.length > 1) {
      checks.push({ state: 'fail', message: `multiple archive directories for ${changeId}: ${archiveFolders.join(', ')}` });
    }
    checks.push(archivedIds.has(changeId) ? { state: 'pass', message: `archived card exists: ${changeId}` } : { state: 'fail', message: `missing archived card: ${changeId}` });
  }

  for (const card of activeCards) {
    if (!context.activeChanges.has(card.changeId)) checks.push({ state: 'fail', message: `stale active card: ${card.changeId}` });
    checks.push(...compactnessChecks(card));
  }
  for (const card of archivedCards) {
    if (!context.archivedOriginalChanges.has(card.changeId)) checks.push({ state: 'fail', message: `stale archived card: ${card.changeId}` });
    const archivePath = card.content.match(/^- Archive path:\s*`?([^`\n]*)`?$/m)?.[1]?.trim();
    if (!archivePath) checks.push({ state: 'fail', message: `archive path missing: ${card.changeId}` });
    if (archivePath && archivePath !== 'pending' && context.root && !existsSync(join(context.root, archivePath))) checks.push({ state: 'fail', message: `archive path missing: ${card.changeId}` });
    const expectedArchiveFolder = context.originalToArchiveFolder.get(card.changeId);
    if (archivePath && expectedArchiveFolder && archivePath !== `openspec/changes/archive/${expectedArchiveFolder}/`) {
      checks.push({ state: 'fail', message: `archive path mismatch: ${card.changeId}` });
    }
    if (card.content.includes('- Commit: pending')) checks.push({ state: 'info', message: `commit pending: ${card.changeId}` });
    checks.push(...compactnessChecks(card));
  }

  for (const changeId of activeIds) {
    if (archivedIds.has(changeId)) {
      const state = context.activeChanges.has(changeId) && context.archivedOriginalChanges.has(changeId) ? 'warn' : 'fail';
      checks.push({ state, message: `card appears in active and archived sections: ${changeId}` });
    }
  }
  return checks.length > 0 ? checks : [{ state: 'pass' as const, message: 'index valid' }];
}

function duplicateCardIds(cards: IndexCard[]): string[] {
  const counts = new Map<string, number>();
  for (const card of cards) counts.set(card.changeId, (counts.get(card.changeId) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([changeId]) => changeId);
}

function indexContractChecks(index: string, activeCards: IndexCard[], archivedCards: IndexCard[]) {
  const checks: Array<{ state: 'pass' | 'fail' | 'warn' | 'info'; message: string }> = [];
  if (!index.startsWith('# OpenSpec Index\n')) checks.push({ state: 'fail', message: 'missing # OpenSpec Index heading' });
  if (!/^## Baseline Specs$/m.test(index)) checks.push({ state: 'fail', message: 'missing Baseline Specs section' });

  for (const card of [...activeCards, ...archivedCards]) {
    for (const label of ['Status', 'Capability', 'Summary', 'Source boundary', 'Related changes', 'Key decisions', 'Archive path', 'Commit']) {
      if (!new RegExp(`^- ${escapeRegExp(label)}:`, 'm').test(card.content)) {
        checks.push({ state: 'fail', message: `missing ${label} field: ${card.changeId}` });
      }
    }
  }

  return checks;
}

function compactnessChecks(card: IndexCard) {
  const checks: Array<{ state: 'pass' | 'fail' | 'warn' | 'info'; message: string }> = [];
  const lines = card.content.trimEnd().split(/\r?\n/);
  if (lines.length > 80) checks.push({ state: 'fail', message: `card too long: ${card.changeId}` });
  if (card.content.length > 6000) checks.push({ state: 'fail', message: `card too large: ${card.changeId}` });
  if (/## (ADDED|MODIFIED|REMOVED) Requirements/.test(card.content)) checks.push({ state: 'fail', message: `card contains delta spec headings: ${card.changeId}` });
  if (/^##\s+/m.test(card.content)) checks.push({ state: 'fail', message: `card contains design headings: ${card.changeId}` });
  if (/^- \[[ x]\]/m.test(card.content)) checks.push({ state: 'fail', message: `card contains task checkboxes: ${card.changeId}` });
  if (card.content.includes('TODO(index):')) checks.push({ state: 'warn', message: `card contains TODO placeholders: ${card.changeId}` });
  if (card.content.includes('- Source boundary: pending')) checks.push({ state: 'warn', message: `source boundary pending: ${card.changeId}` });
  if (checks.length === 0) checks.push({ state: 'pass', message: `card compact: ${card.changeId}` });
  return checks;
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
  const archiveFoldersByOriginal = new Map<string, string[]>();
  const malformedArchiveFolders: string[] = [];

  if (!root) {
    return { activeChanges, archivedOriginalChanges, archiveFolderToOriginal, originalToArchiveFolder, archiveFoldersByOriginal, malformedArchiveFolders };
  }

  const changesDir = join(root, 'openspec', 'changes');
  for (const entry of readdirSync(changesDir, { withFileTypes: true })) {
    if (entry.name === 'archive' || !entry.isDirectory()) {
      continue;
    }

    activeChanges.add(entry.name);
  }

  const archiveDir = join(changesDir, 'archive');
  if (!existsSync(archiveDir)) {
    return { root, activeChanges, archivedOriginalChanges, archiveFolderToOriginal, originalToArchiveFolder, archiveFoldersByOriginal, malformedArchiveFolders };
  }

  for (const entry of readdirSync(archiveDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const originalChangeId = originalChangeIdFromArchiveFolder(entry.name);
    if (!originalChangeId) {
      malformedArchiveFolders.push(entry.name);
      continue;
    }

    archivedOriginalChanges.add(originalChangeId);
    archiveFolderToOriginal.set(entry.name, originalChangeId);
    originalToArchiveFolder.set(originalChangeId, originalToArchiveFolder.get(originalChangeId) ?? entry.name);
    archiveFoldersByOriginal.set(originalChangeId, [...(archiveFoldersByOriginal.get(originalChangeId) ?? []), entry.name]);
  }

  return { root, activeChanges, archivedOriginalChanges, archiveFolderToOriginal, originalToArchiveFolder, archiveFoldersByOriginal, malformedArchiveFolders };
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
  openspec-trace index add-active <change-id>
  openspec-trace index archive <change-id>
  openspec-trace index validate
  openspec-trace status <change-id> [--phase pre-review|post-review|archive|commit] [--json]`);
}

main();
