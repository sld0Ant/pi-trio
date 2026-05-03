#!/usr/bin/env bun

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const CHANGE_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const ARCHIVE_FOLDER_PATTERN = /^\d{4}-\d{2}-\d{2}-(.+)$/;

type ParsedArgs = {
  positionals: string[];
  options: Map<string, string[]>;
};

type ValidationContext = {
  activeChanges: Set<string>;
  archivedOriginalChanges: Set<string>;
  archiveFolderToOriginal: Map<string, string>;
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
    const likelyOpenSpecTrailer = /openspec[-\s]?change\s*:/i.test(line) || line.includes('OpenSpec-Change');
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

function loadValidationContext(startDir: string): ValidationContext {
  const root = findOpenSpecRoot(startDir);
  const activeChanges = new Set<string>();
  const archivedOriginalChanges = new Set<string>();
  const archiveFolderToOriginal = new Map<string, string>();

  if (!root) {
    return { activeChanges, archivedOriginalChanges, archiveFolderToOriginal };
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
    return { activeChanges, archivedOriginalChanges, archiveFolderToOriginal };
  }

  for (const entry of new Bun.Glob('*').scanSync({ cwd: archiveDir, onlyFiles: false })) {
    const originalChangeId = originalChangeIdFromArchiveFolder(entry);
    if (!originalChangeId) {
      continue;
    }

    archivedOriginalChanges.add(originalChangeId);
    archiveFolderToOriginal.set(entry, originalChangeId);
  }

  return { activeChanges, archivedOriginalChanges, archiveFolderToOriginal };
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
  openspec-trace check-commit-msg <file> [--change <change-id>]`);
}

main();
