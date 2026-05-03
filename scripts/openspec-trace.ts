#!/usr/bin/env bun

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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

function parseArgs(args: string[]): ParsedArgs {
  const positionals: string[] = [];
  const options = new Map<string, string[]>();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg.startsWith('--')) {
      const optionName = arg.slice(2);
      const optionValue = args[index + 1];

      if (!optionName || !optionValue || optionValue.startsWith('--')) {
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
  openspec-trace tasks check <change-id> [--phase pre-review|post-review]`);
}

main();
