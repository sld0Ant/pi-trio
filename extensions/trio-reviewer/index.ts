import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
	createAgentSession,
	DefaultResourceLoader,
	SessionManager,
	AuthStorage,
	ModelRegistry,
	getSettingsListTheme,
	getAgentDir,
} from "@mariozechner/pi-coding-agent";

import { Type } from "@sinclair/typebox";
import { Container, type SettingItem, SettingsList, Text, matchesKey } from "@mariozechner/pi-tui";
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { join, dirname, basename, resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import type { Model } from "@mariozechner/pi-ai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CODE_REVIEWER_PROMPT = join(__dirname, "reviewer-prompt.md");
const PLAN_REVIEWER_PROMPT = join(__dirname, "plan-reviewer-prompt.md");
const BUILTIN_PROFILES_DIR = join(__dirname, "profiles");
const GLOBAL_PROFILES_DIR = join(process.env.HOME ?? "~", ".pi", "agent", "trio-profiles");
const PROJECT_PROFILES_DIR = join(process.cwd(), ".pi", "trio-profiles");
const MAX_PACK_FILE_SIZE = 128 * 1024;
const MAX_RAW_LOG_FIELD_SIZE = 64 * 1024;
const DEFAULT_DIAGNOSTIC_LOG_DIR = "/tmp/pi-trio-review-logs";
const MANAGED_PROFILE_NAMES = new Set(["openspec"]);

type DiagnosticPhase = {
	name: string;
	durationMs: number;
};

type DiagnosticLog = {
	tool: "trio_plan_review" | "trio_review";
	startedAt: string;
	finishedAt?: string;
	durationMs?: number;
	mode?: string;
	reviewDepth?: string;
	profiles: string[];
	managedProfiles: string[];
	input: Record<string, unknown>;
	phases: DiagnosticPhase[];
	pack?: {
		chars: number;
		estimatedTokens: number;
	};
	result?: Record<string, unknown>;
	warnings: string[];
	raw?: Record<string, string>;
	rawTruncation?: Record<string, { truncated: boolean; originalBytes: number; storedBytes: number }>;
};

type DiagnosticWriteResult = {
	durationMs: number;
	logPath?: string;
	warnings: string[];
};

function loadProfilesFromDir(dir: string, profiles: Map<string, string>): void {
	if (!existsSync(dir)) return;
	try {
		const entries = readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.isFile() && entry.name.endsWith(".md")) {
				const name = basename(entry.name, ".md");
				profiles.set(name, readFileSync(join(dir, entry.name), "utf-8"));
			}
		}
	} catch {
		// dir unreadable — skip
	}
}

function loadProfiles(): Map<string, string> {
	const profiles = new Map<string, string>();
	loadProfilesFromDir(BUILTIN_PROFILES_DIR, profiles);
	loadProfilesFromDir(GLOBAL_PROFILES_DIR, profiles);
	loadProfilesFromDir(PROJECT_PROFILES_DIR, profiles);
	return profiles;
}

function selectableProfiles(profiles: Map<string, string>): Map<string, string> {
	return new Map([...profiles].filter(([name]) => !MANAGED_PROFILE_NAMES.has(name)));
}

function buildInvocationProfiles(userProfiles: Map<string, string>, options: { includeOpenSpec: boolean }): Map<string, string> {
	const invocationProfiles = new Map(userProfiles);
	if (!options.includeOpenSpec) return invocationProfiles;

	const openSpecProfile = loadProfiles().get("openspec");
	if (openSpecProfile) invocationProfiles.set("openspec", openSpecProfile);
	return invocationProfiles;
}

function isOpenSpecPlanReview(mode: ReviewMode): boolean {
	return mode === "openspec";
}

function isOpenSpecCodeReview(specsDir?: string): boolean {
	return !!specsDir;
}

function startDiagnosticLog(params: {
	tool: "trio_plan_review" | "trio_review";
	mode?: string;
	reviewDepth?: string;
	input: Record<string, unknown>;
}): DiagnosticLog {
	return {
		tool: params.tool,
		startedAt: new Date().toISOString(),
		mode: params.mode,
		reviewDepth: params.reviewDepth,
		profiles: [],
		managedProfiles: [],
		input: params.input,
		phases: [],
		warnings: [],
	};
}

async function timePhase<T>(diagnostics: DiagnosticLog, name: string, fn: () => Promise<T> | T): Promise<T> {
	const startedAt = Date.now();
	try {
		return await fn();
	} finally {
		diagnostics.phases.push({ name, durationMs: Date.now() - startedAt });
	}
}

function setDiagnosticProfiles(diagnostics: DiagnosticLog, profileNames: string[]): void {
	diagnostics.profiles = profileNames;
	diagnostics.managedProfiles = profileNames.filter((name) => MANAGED_PROFILE_NAMES.has(name));
}

function setDiagnosticPack(diagnostics: DiagnosticLog, text: string): void {
	diagnostics.pack = { chars: text.length, estimatedTokens: Math.ceil(text.length / 4) };
}

function truncateRawField(value: string): { stored: string; metadata: { truncated: boolean; originalBytes: number; storedBytes: number } } {
	const encoder = new TextEncoder();
	const originalBytes = encoder.encode(value).byteLength;
	if (originalBytes <= MAX_RAW_LOG_FIELD_SIZE) {
		return { stored: value, metadata: { truncated: false, originalBytes, storedBytes: originalBytes } };
	}

	let stored = "";
	let storedBytes = 0;
	for (const character of value) {
		const characterBytes = encoder.encode(character).byteLength;
		if (storedBytes + characterBytes > MAX_RAW_LOG_FIELD_SIZE) break;
		stored += character;
		storedBytes += characterBytes;
	}
	return { stored, metadata: { truncated: true, originalBytes, storedBytes } };
}

function setDiagnosticRaw(diagnostics: DiagnosticLog, fields: Record<string, string>): void {
	if (process.env.TRIO_REVIEW_LOG_RAW !== "1") return;

	diagnostics.raw = {};
	diagnostics.rawTruncation = {};
	for (const [name, value] of Object.entries(fields)) {
		const truncated = truncateRawField(value);
		diagnostics.raw[name] = truncated.stored;
		diagnostics.rawTruncation[name] = truncated.metadata;
		if (truncated.metadata.truncated) diagnostics.warnings.push(`raw field truncated: ${name}`);
	}
}

function diagnosticLogDir(): string {
	return process.env.TRIO_REVIEW_LOG_DIR || DEFAULT_DIAGNOSTIC_LOG_DIR;
}

function diagnosticLogPath(tool: string): string {
	const timestamp = new Date().toISOString().replaceAll(":", "-");
	return join(diagnosticLogDir(), `${timestamp}-${tool}-${randomUUID().slice(0, 8)}.json`);
}

function writeDiagnosticLog(diagnostics: DiagnosticLog): DiagnosticWriteResult {
	diagnostics.finishedAt = new Date().toISOString();
	diagnostics.durationMs = Date.parse(diagnostics.finishedAt) - Date.parse(diagnostics.startedAt);

	try {
		const logDir = diagnosticLogDir();
		mkdirSync(logDir, { recursive: true, mode: 0o700 });
		try {
			chmodSync(logDir, 0o700);
		} catch (error) {
			diagnostics.warnings.push(`could not set log directory permissions: ${error instanceof Error ? error.message : String(error)}`);
		}

		const logPath = diagnosticLogPath(diagnostics.tool);
		const tempPath = `${logPath}.tmp-${process.pid}-${randomUUID().slice(0, 8)}`;
		const content = `${JSON.stringify(diagnostics, null, 2)}\n`;
		writeFileSync(tempPath, content, { mode: 0o600, flag: "wx" });
		try {
			chmodSync(tempPath, 0o600);
		} catch (error) {
			diagnostics.warnings.push(`could not set log file permissions: ${error instanceof Error ? error.message : String(error)}`);
			writeFileSync(tempPath, content, { mode: 0o600 });
		}
		try {
			renameSync(tempPath, logPath);
		} catch (error) {
			diagnostics.warnings.push(`atomic log rename failed: ${error instanceof Error ? error.message : String(error)}`);
			writeFileSync(logPath, `${JSON.stringify(diagnostics, null, 2)}\n`, { mode: 0o600, flag: "wx" });
			try {
				rmSync(tempPath, { force: true });
			} catch (cleanupError) {
				diagnostics.warnings.push(`temporary log cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
			}
		}
		return { durationMs: diagnostics.durationMs, logPath, warnings: diagnostics.warnings };
	} catch (error) {
		const warning = `diagnostic log write failed: ${error instanceof Error ? error.message : String(error)}`;
		return { durationMs: diagnostics.durationMs, warnings: [...diagnostics.warnings, warning] };
	}
}

async function runSubAgent(
	model: Model,
	systemPrompt: string,
	userPrompt: string,
	authStorage: AuthStorage,
	modelRegistry: ModelRegistry,
	cwd: string,
): Promise<string> {
	const loader = new DefaultResourceLoader({
		cwd,
		agentDir: getAgentDir(),
		noExtensions: true,
		noSkills: true,
		noPromptTemplates: true,
		noThemes: true,
		systemPromptOverride: () => systemPrompt,
		appendSystemPromptOverride: () => [],
	});
	await loader.reload();

	const { session } = await createAgentSession({
		model,
		thinkingLevel: "off",
		tools: [],
		sessionManager: SessionManager.inMemory(),
		resourceLoader: loader,
		authStorage,
		modelRegistry,
	});

	session.setAutoCompactionEnabled(false);

	let result = "";
	session.subscribe((event) => {
		if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
			result += event.assistantMessageEvent.delta;
		}
	});

	try {
		await session.prompt(userPrompt);
		return result;
	} finally {
		session.dispose();
	}
}

function readSpecs(specsDir: string): string {
	try {
		const specsRoot = realpathSync(specsDir);
		if (!statSync(specsRoot).isDirectory()) return "[ERROR: Specs path is not a directory]";
		const specFiles = markdownFilesUnder(specsRoot).map((path) => safeMarkdownSection(path, specsRoot));
		const skippedLinks = skippedMarkdownSymlinksUnder(specsRoot).map((path) => `## File: ${path}\n[ERROR: Symlink skipped]`);
		return [...specFiles, ...skippedLinks].join("\n\n") || "[NO SPECS FOUND]";
	} catch {
		return "[ERROR: Could not read specs directory]";
	}
}

function buildPrompt(basePromptPath: string, profileContents: Map<string, string>): string {
	let prompt = readFileSync(basePromptPath, "utf-8");
	if (profileContents.size > 0) {
		for (const [name, content] of profileContents) {
			prompt += `\n\n## Profile: ${name}\n\n${content}`;
		}
	}
	return prompt;
}

type ReviewDepth = "critical_only" | "critical_and_important" | "exhaustive";
type ReviewMode = "generic" | "openspec";

function parseRawVerdict(text: string): string {
	const verdictLine = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.find((line) => line.startsWith("## Verdict:"));
	const match = verdictLine?.match(/^## Verdict:\s*(BLOCKED|APPROVABLE_WITH_NOTES|APPROVED|PASS|NEEDS WORK)(?:\b|\s|—|-|:|$)/);
	return match?.[1] ?? "UNKNOWN";
}

function parseVerdict(text: string): string {
	const rawVerdict = parseRawVerdict(text);
	return rawVerdict === "APPROVABLE_WITH_NOTES" || rawVerdict === "APPROVED" || rawVerdict === "PASS" ? "PASS" : "NEEDS WORK";
}

function isInside(child: string, parent: string): boolean {
	const rel = relative(parent, child);
	return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function fenced(content: string): string {
	return `\`\`\`text\n${content.replaceAll("```", "``\\`")}\n\`\`\``;
}

function safeReadFile(path: string): string {
	try {
		const stat = statSync(path);
		if (!stat.isFile()) return "[ERROR: Not a regular file]";
		if (stat.size > MAX_PACK_FILE_SIZE) return `[ERROR: File too large (${stat.size} bytes)]`;
		return readFileSync(path, "utf-8");
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return `[ERROR: ${message}]`;
	}
}

function markdownFilesUnder(root: string): string[] {
	if (!existsSync(root)) return [];
	const files: string[] = [];
	try {
		const entries = readdirSync(root, { withFileTypes: true, recursive: true });
		for (const entry of entries) {
			if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
			const path = join(entry.parentPath ?? entry.path, entry.name);
			files.push(path);
		}
	} catch {
		return [];
	}
	return files.sort((a, b) => relative(root, a).localeCompare(relative(root, b)));
}

function safeMarkdownSection(path: string, allowedRoot: string): string {
	try {
		const linkStat = lstatSync(path);
		if (linkStat.isSymbolicLink()) return `## File: ${path}\n[ERROR: Symlink skipped]`;
		const realPath = realpathSync(path);
		if (!isInside(realPath, allowedRoot)) return `## File: ${path}\n[ERROR: Escapes allowed root]`;
		return `## File: ${path}\n${fenced(safeReadFile(realPath))}`;
	} catch (error) {
		if ((error as Error & { code?: string }).code === "ENOENT") return `## File: ${path}\n[MISSING]`;
		const message = error instanceof Error ? error.message : String(error);
		return `## File: ${path}\n[ERROR: ${message}]`;
	}
}

function skippedMarkdownSymlinksUnder(root: string): string[] {
	if (!existsSync(root)) return [];
	try {
		const entries = readdirSync(root, { withFileTypes: true, recursive: true });
		return entries
			.filter((entry) => entry.isSymbolicLink() && entry.name.endsWith(".md"))
			.map((entry) => join(entry.parentPath ?? entry.path, entry.name))
			.sort((a, b) => relative(root, a).localeCompare(relative(root, b)));
	} catch {
		return [];
	}
}

function resolveOpenSpecChange(cwd: string, changeDir: string): { changeRoot: string; changesRoot: string; changeName: string } | { error: string } {
	try {
		const changesPath = join(cwd, "openspec", "changes");
		const changesStat = lstatSync(changesPath);
		if (changesStat.isSymbolicLink()) return { error: "openspec/changes must not be a symlink" };
		if (!changesStat.isDirectory()) return { error: "openspec/changes must be a directory" };
		const changesRoot = realpathSync(changesPath);
		const requestedPath = resolve(cwd, changeDir);
		const requestedStat = lstatSync(requestedPath);
		if (requestedStat.isSymbolicLink()) return { error: "change_dir must not be a symlink" };
		if (!requestedStat.isDirectory()) return { error: "change_dir must be a directory" };
		const changeRoot = realpathSync(requestedPath);
		const parent = dirname(changeRoot);
		if (parent !== changesRoot) return { error: `change_dir must resolve directly under ${join("openspec", "changes")}` };
		if (basename(changeRoot) !== basename(requestedPath)) return { error: "change_dir canonical basename differs from requested basename" };
		return { changeRoot, changesRoot, changeName: basename(changeRoot) };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { error: message };
	}
}

function runOpenSpecValidate(cwd: string, changeName: string): { text: string; status: "pass" | "fail" | "not_run" } {
	const result = spawnSync("openspec", ["validate", changeName, "--strict"], {
		cwd,
		shell: false,
		encoding: "utf-8",
		timeout: 30_000,
		maxBuffer: 128 * 1024,
	});
	const output = [`exitCode: ${result.status}`, result.stdout?.trim(), result.stderr?.trim()].filter(Boolean).join("\n");
	if (result.error) {
		if ((result.error as Error & { code?: string }).code === "ENOENT") return { text: "NOT RUN: openspec CLI not found", status: "not_run" };
		return { text: [`ERROR: ${result.error.message}`, output].filter(Boolean).join("\n"), status: "fail" };
	}
	return { text: output, status: result.status === 0 ? "pass" : "fail" };
}

function buildOpenSpecPack(params: {
	cwd: string;
	plan: string;
	changeDir: string;
	reviewDepth: ReviewDepth;
	includeBaselineSpecs: boolean;
	reviewScope?: string;
	stopCondition?: string;
}): { text: string; validationStatus?: "pass" | "fail" | "not_run" } {
	const resolved = resolveOpenSpecChange(params.cwd, params.changeDir);
	if ("error" in resolved) return { text: `# OpenSpec Plan Review Pack\n\n## Pack Error\n\n[ERROR: ${resolved.error}]\n\n## Caller Notes\n\n${fenced(params.plan)}` };

	const defaultScope = [
		"Review for blockers, contradictions, source-boundary conflicts, OpenSpec traceability gaps, and unsafe undefined behavior inside the stated scope.",
		"Do not review future slices, unrelated architecture alternatives, docs-site work unless in scope, or exhaustive hardening outside accepted trade-offs.",
	].join("\n");
	const requiredStopCondition = [
		"OpenSpec strict validation plus raw verdict APPROVABLE_WITH_NOTES, APPROVED, or legacy PASS means approvable.",
		"Validation failure, BLOCKED, NEEDS WORK, or UNKNOWN is not approvable.",
		"Critical count is represented by reviewer verdict; do not guess it by string-scanning sections.",
	].join("\n");
	const stopCondition = params.stopCondition ? `${requiredStopCondition}\n\nCaller stop condition:\n${fenced(params.stopCondition)}` : requiredStopCondition;

	const sections: string[] = [
		"# OpenSpec Plan Review Pack",
		`## Review Settings\n\n- mode: openspec\n- review_depth: ${params.reviewDepth}\n- change: ${resolved.changeName}\n\n### Stop Condition\n\n${stopCondition}`,
		`## Review Scope\n\n### Required Scope\n\n${defaultScope}${params.reviewScope ? `\n\n### Caller Scope\n\n${fenced(params.reviewScope)}` : ""}`,
		safeMarkdownSection(join(resolved.changeRoot, "proposal.md"), resolved.changeRoot),
		safeMarkdownSection(join(resolved.changeRoot, "design.md"), resolved.changeRoot),
	];

	const specsRoot = join(resolved.changeRoot, "specs");
	const specFiles = markdownFilesUnder(specsRoot);
	const skippedSpecLinks = skippedMarkdownSymlinksUnder(specsRoot).map((path) => `## File: ${path}\n[ERROR: Symlink skipped]`);
	const deltaSections = [...specFiles.map((path) => safeMarkdownSection(path, resolved.changeRoot)), ...skippedSpecLinks];
	sections.push(`## Delta Specs\n\n${deltaSections.length ? deltaSections.join("\n\n") : "[MISSING]"}`);

	if (params.includeBaselineSpecs) {
		let baselineRoot = join(params.cwd, "openspec", "specs");
		try {
			if (existsSync(baselineRoot)) baselineRoot = realpathSync(baselineRoot);
		} catch {
			baselineRoot = join(params.cwd, "openspec", "specs");
		}
		const capabilities = [...new Set(specFiles.map((path) => relative(specsRoot, path).split(/[\\/]/)[0]).filter(Boolean))].sort();
		const baselineSections = capabilities.map((capability) => {
			const baselinePath = join(baselineRoot, capability, "spec.md");
			return existsSync(baselinePath) ? safeMarkdownSection(baselinePath, baselineRoot) : `## Baseline Spec: ${capability}\n[MISSING]`;
		});
		if (skippedSpecLinks.length > 0) baselineSections.push("## Baseline Discovery Note\nSymlinked delta specs were skipped and excluded from baseline discovery.");
		sections.push(`## Baseline Specs\n\n${baselineSections.length ? baselineSections.join("\n\n") : "[NONE DISCOVERED]"}`);
	}

	sections.push(safeMarkdownSection(join(resolved.changeRoot, "tasks.md"), resolved.changeRoot));
	if (params.plan.trim()) sections.push(`## Caller Notes\n\n${fenced(params.plan)}`);
	const validation = runOpenSpecValidate(params.cwd, resolved.changeName);
	sections.push(`## OpenSpec Validation\n\n- status: ${validation.status}\n- command: openspec validate ${resolved.changeName} --strict\n\n${fenced(validation.text)}`);
	return { text: sections.join("\n\n---\n\n"), validationStatus: validation.status };
}

export default function (pi: ExtensionAPI) {
	let currentModel: Model | undefined;
	let currentModelRegistry: ModelRegistry | undefined;
	let activeProfiles = new Map<string, string>();
	let profilesResolved = false;

	function restoreProfiles(entries: Iterable<{ type: string; customType?: string; data?: Record<string, unknown> }>): boolean {
		for (const entry of entries) {
			if (entry.type === "custom" && entry.customType === "trio-reviewer-profiles") {
				const savedNames = entry.data?.names as string[] | undefined;
				if (savedNames?.length) {
					const allProfiles = selectableProfiles(loadProfiles());
					activeProfiles = new Map<string, string>();
					for (const name of savedNames) {
						const content = allProfiles.get(name);
						if (content) activeProfiles.set(name, content);
					}
					if (activeProfiles.size > 0) {
						profilesResolved = true;
						return true;
					}
				}
			}
		}
		return false;
	}

	// biome-ignore lint: ctx type varies between event handlers and tool execute
	async function ensureProfiles(ctx: any): Promise<void> {
		if (profilesResolved) return;

		if (restoreProfiles(ctx.sessionManager.getEntries())) {
			profilesResolved = true;
			return;
		}

		const allProfiles = selectableProfiles(loadProfiles());
		if (allProfiles.size === 0) {
			profilesResolved = true;
			return;
		}

		// Enable all selectable profiles by default when UI is unavailable or not interactive
		if (!ctx.hasUI) {
			activeProfiles = allProfiles;
			profilesResolved = true;
			return;
		}

		const enabled = new Set<string>();

		const confirmed = await ctx.ui.custom<boolean>((_tui: any, theme: any, _kb: any, done: (v: boolean) => void) => {
			const container = new Container();
			container.addChild(new Text(theme.fg("accent", theme.bold("Reviewer Profiles")), 1, 1));

			const items: SettingItem[] = [...allProfiles.keys()].map((name) => ({
				id: name,
				label: name,
				currentValue: "off",
				values: ["on", "off"],
			}));

			const settingsList = new SettingsList(
				items,
				Math.min(items.length + 2, 15),
				getSettingsListTheme(),
				(id: string, newValue: string) => {
					if (newValue === "on") {
						enabled.add(id);
					} else {
						enabled.delete(id);
					}
				},
				() => done(false),
			);
			container.addChild(settingsList);
			container.addChild(new Text(theme.fg("dim", "space/enter toggle • tab confirm • esc skip"), 1, 0));

			return {
				render: (w: number) => container.render(w),
				invalidate: () => container.invalidate(),
				handleInput: (data: string) => {
					if (matchesKey(data, "tab")) {
						done(true);
						return;
					}
					settingsList.handleInput?.(data);
					_tui.requestRender();
				},
			};
		});

		if (!confirmed) {
			// User skipped profile selection — enable all by default
			activeProfiles = allProfiles;
		}

		profilesResolved = true;

		if (enabled.size > 0) {
			activeProfiles = new Map<string, string>();
			for (const name of enabled) {
				const content = allProfiles.get(name);
				if (content) activeProfiles.set(name, content);
			}
			pi.appendEntry("trio-reviewer-profiles", { names: [...enabled] });
		}
	}

	pi.on("session_start", async (_event, ctx) => {
		currentModel = ctx.model;
		currentModelRegistry = ctx.modelRegistry;
		profilesResolved = false;
		activeProfiles = new Map<string, string>();
		restoreProfiles(ctx.sessionManager.getEntries());
	});

	pi.on("model_select", async (event) => {
		currentModel = event.model;
	});

	function getModel(ctx: { model?: Model }): Model | undefined {
		return currentModel ?? ctx.model;
	}

	pi.registerTool({
		name: "trio_plan_review",
		label: "Trio Plan Review",
		description: `Run an independent plan review via a sub-agent with clean context.
The sub-agent receives ONLY the plan text or generated OpenSpec pack. It does NOT see the chat history.

Use this after the Planner produces a plan, before user approval.
Pass the full plan text, or use mode=openspec with a change_dir.`,
		parameters: Type.Object({
			plan: Type.String({ description: "The full plan text to review. Use an empty string when mode=openspec and change_dir is provided." }),
			review_depth: Type.Optional(
				Type.Union([Type.Literal("critical_only"), Type.Literal("critical_and_important"), Type.Literal("exhaustive")]),
			),
			mode: Type.Optional(Type.Union([Type.Literal("generic"), Type.Literal("openspec")])),
			change_dir: Type.Optional(Type.String({ description: "OpenSpec change directory, e.g. openspec/changes/my-change" })),
			include_baseline_specs: Type.Optional(Type.Boolean({ description: "Include relevant baseline specs in OpenSpec mode" })),
			review_scope: Type.Optional(Type.String({ description: "Additional review scope instructions" })),
			stop_condition: Type.Optional(Type.String({ description: "Stop condition to include in the review pack" })),
		}),

		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const reviewDepth = (params.review_depth ?? "critical_and_important") as ReviewDepth;
			const reviewMode = (params.mode ?? "generic") as ReviewMode;
			const diagnostics = startDiagnosticLog({
				tool: "trio_plan_review",
				mode: reviewMode,
				reviewDepth,
				input: {
					changeDir: params.change_dir,
					includeBaselineSpecs: params.include_baseline_specs ?? true,
					planChars: params.plan.length,
				},
			});
			const model = getModel(ctx);
			const modelRegistry = currentModelRegistry ?? ctx.modelRegistry;
			const authStorage = modelRegistry?.authStorage;
			if (!model) {
				const diagnostic = writeDiagnosticLog(diagnostics);
				return { content: [{ type: "text", text: "ERROR: No model available" }], isError: true, details: diagnostic };
			}
			if (!authStorage || !modelRegistry) {
				const diagnostic = writeDiagnosticLog(diagnostics);
				return { content: [{ type: "text", text: "ERROR: No auth storage or model registry available" }], isError: true, details: diagnostic };
			}

			try {
				onUpdate?.({ content: [{ type: "text", text: "[trio_plan_review] resolving reviewer profiles..." }] });
				await timePhase(diagnostics, "resolve_profiles", () => ensureProfiles(ctx));

				const invocationProfiles = await timePhase(diagnostics, "prepare_profiles", () => buildInvocationProfiles(activeProfiles, { includeOpenSpec: isOpenSpecPlanReview(reviewMode) }));
				const profileNames = [...invocationProfiles.keys()];
				setDiagnosticProfiles(diagnostics, profileNames);
				const profileInfo = profileNames.length > 0 ? ` with profiles: ${profileNames.join(", ")}` : " (no profiles)";
				onUpdate?.({ content: [{ type: "text", text: `[trio_plan_review] applying profiles: ${profileNames.join(", ") || "none"}` }] });

				const prompt = await timePhase(diagnostics, "build_system_prompt", () => buildPrompt(PLAN_REVIEWER_PROMPT, invocationProfiles));
				let reviewText = params.plan;
				let openspecValidationStatus: "pass" | "fail" | "not_run" | undefined;
				if (reviewMode === "openspec" && !params.change_dir) {
					const diagnostic = writeDiagnosticLog(diagnostics);
					return { content: [{ type: "text", text: "ERROR: change_dir is required when mode=openspec" }], isError: true, details: diagnostic };
				}
				if (reviewMode === "openspec" && params.change_dir) {
					onUpdate?.({ content: [{ type: "text", text: "[trio_plan_review] building OpenSpec review pack..." }] });
					const resolvedChange = resolveOpenSpecChange(ctx.cwd ?? process.cwd(), params.change_dir);
					if ("error" in resolvedChange) {
						const diagnostic = writeDiagnosticLog(diagnostics);
						return { content: [{ type: "text", text: `ERROR: invalid change_dir: ${resolvedChange.error}` }], isError: true, details: diagnostic };
					}
					const pack = await timePhase(diagnostics, "build_openspec_pack", () =>
						buildOpenSpecPack({
							cwd: ctx.cwd ?? process.cwd(),
							plan: params.plan,
							changeDir: params.change_dir,
							reviewDepth,
							includeBaselineSpecs: params.include_baseline_specs ?? true,
							reviewScope: params.review_scope,
							stopCondition: params.stop_condition,
						}),
					);
					reviewText = pack.text;
					openspecValidationStatus = pack.validationStatus;
				} else {
					reviewText = await timePhase(diagnostics, "build_generic_pack", () => `# Review Settings\n\n- mode: ${reviewMode}\n- review_depth: ${reviewDepth}\n\n## Plan\n\n${fenced(params.plan)}`);
				}
				setDiagnosticPack(diagnostics, reviewText);
				const userPrompt = `# Plan Review Request\n\n${reviewText}`;
				setDiagnosticRaw(diagnostics, { systemPrompt: prompt, userPrompt });
				onUpdate?.({ content: [{ type: "text", text: `[trio_plan_review] calling reviewer model ${model.name}${profileInfo}...` }] });
				const result = await timePhase(diagnostics, "model_call", () => runSubAgent(model, prompt, userPrompt, authStorage, modelRegistry, ctx.cwd ?? process.cwd()));
				setDiagnosticRaw(diagnostics, { systemPrompt: prompt, userPrompt, modelResponse: result });
				const rawVerdict = parseRawVerdict(result);
				const verdict = parseVerdict(result);
				diagnostics.result = { verdict, rawVerdict, openspecValidationStatus };
				const diagnostic = writeDiagnosticLog(diagnostics);
				onUpdate?.({ content: [{ type: "text", text: `[trio_plan_review] reviewer finished in ${(diagnostic.durationMs / 1000).toFixed(1)}s${diagnostic.logPath ? ` • log: ${diagnostic.logPath}` : ""}` }] });
				return {
					content: [{ type: "text", text: result }],
					details: { verdict, rawVerdict, type: "plan", reviewDepth, mode: reviewMode, openspecValidationStatus, profiles: profileNames, durationMs: diagnostic.durationMs, logPath: diagnostic.logPath, diagnosticWarnings: diagnostic.warnings },
				};
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				diagnostics.result = { error: message };
				const diagnostic = writeDiagnosticLog(diagnostics);
				return { content: [{ type: "text", text: `Plan review sub-agent error: ${message}` }], isError: true, details: diagnostic };
			}
		},
	});

	pi.registerTool({
		name: "trio_review",
		label: "Trio Review",
		description: `Run an independent code review via a sub-agent with clean context.
The sub-agent receives ONLY the plan, file contents, and optionally OpenSpec specs.
It does NOT see the chat history or development process.

Use this after implementation is complete to get an objective review.
Pass the plan text, list of created/modified file paths, and optionally the OpenSpec specs directory.`,
		parameters: Type.Object({
			plan: Type.String({ description: "The approved plan text (full plan that was implemented)" }),
			files: Type.Array(Type.String(), {
				description: "Absolute paths to files to review (created/modified during implementation)",
			}),
			specs_dir: Type.Optional(
				Type.String({ description: "Path to OpenSpec specs directory (e.g. openspec/changes/my-change/specs/)" }),
			),
		}),

		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const { plan, files, specs_dir: specsDir } = params;
			const diagnostics = startDiagnosticLog({
				tool: "trio_review",
				mode: specsDir ? "openspec" : "generic",
				input: { filesCount: files.length, specsDir, planChars: plan.length },
			});
			const model = getModel(ctx);
			const modelRegistry = currentModelRegistry ?? ctx.modelRegistry;
			const authStorage = modelRegistry?.authStorage;
			if (!model) {
				const diagnostic = writeDiagnosticLog(diagnostics);
				return { content: [{ type: "text", text: "ERROR: No model available" }], isError: true, details: diagnostic };
			}
			if (!authStorage || !modelRegistry) {
				const diagnostic = writeDiagnosticLog(diagnostics);
				return { content: [{ type: "text", text: "ERROR: No auth storage or model registry available" }], isError: true, details: diagnostic };
			}

			try {
				onUpdate?.({ content: [{ type: "text", text: "[trio_review] resolving reviewer profiles..." }] });
				await timePhase(diagnostics, "resolve_profiles", () => ensureProfiles(ctx));

				const invocationProfiles = await timePhase(diagnostics, "prepare_profiles", () => buildInvocationProfiles(activeProfiles, { includeOpenSpec: isOpenSpecCodeReview(specsDir) }));
				const profileNames = [...invocationProfiles.keys()];
				setDiagnosticProfiles(diagnostics, profileNames);
				const profileInfo = profileNames.length > 0 ? ` with profiles: ${profileNames.join(", ")}` : " (no profiles)";
				onUpdate?.({ content: [{ type: "text", text: `[trio_review] applying profiles: ${profileNames.join(", ") || "none"}` }] });

				onUpdate?.({ content: [{ type: "text", text: `[trio_review] reading ${files.length} files...` }] });
				const fileContents = await timePhase(diagnostics, "read_files", () => {
					const contents: string[] = [];
					for (const filePath of files) {
						const content = safeReadFile(filePath);
						contents.push(`## File: ${filePath}\n${fenced(content)}`);
					}
					return contents;
				});

				let prompt = await timePhase(diagnostics, "build_review_pack", () => `# Review Request\n\n## Plan\n${plan}\n\n## Files\n${fileContents.join("\n\n")}`);
				if (specsDir) {
					onUpdate?.({ content: [{ type: "text", text: "[trio_review] reading OpenSpec specifications..." }] });
					const specsText = await timePhase(diagnostics, "read_specs", () => readSpecs(specsDir));
					prompt += `\n\n## OpenSpec Specifications\n${specsText}`;
				}
				setDiagnosticPack(diagnostics, prompt);
				const reviewerSystemPrompt = await timePhase(diagnostics, "build_system_prompt", () => buildPrompt(CODE_REVIEWER_PROMPT, invocationProfiles));
				setDiagnosticRaw(diagnostics, { systemPrompt: reviewerSystemPrompt, userPrompt: prompt });
				onUpdate?.({ content: [{ type: "text", text: `[trio_review] calling reviewer model ${model.name}${profileInfo}...` }] });
				const result = await timePhase(diagnostics, "model_call", () => runSubAgent(model, reviewerSystemPrompt, prompt, authStorage, modelRegistry, ctx.cwd ?? process.cwd()));
				setDiagnosticRaw(diagnostics, { systemPrompt: reviewerSystemPrompt, userPrompt: prompt, modelResponse: result });
				const rawVerdict = parseRawVerdict(result);
				const verdict = parseVerdict(result);
				diagnostics.result = { verdict, rawVerdict, filesReviewed: files.length, hasSpecs: !!specsDir };
				const diagnostic = writeDiagnosticLog(diagnostics);
				onUpdate?.({ content: [{ type: "text", text: `[trio_review] reviewer finished in ${(diagnostic.durationMs / 1000).toFixed(1)}s${diagnostic.logPath ? ` • log: ${diagnostic.logPath}` : ""}` }] });
				return {
					content: [{ type: "text", text: result }],
					details: { verdict, rawVerdict, filesReviewed: files.length, hasSpecs: !!specsDir, profiles: profileNames, durationMs: diagnostic.durationMs, logPath: diagnostic.logPath, diagnosticWarnings: diagnostic.warnings },
				};
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				diagnostics.result = { error: message };
				const diagnostic = writeDiagnosticLog(diagnostics);
				return { content: [{ type: "text", text: `Review sub-agent error: ${message}` }], isError: true, details: diagnostic };
			}
		},
	});
}
