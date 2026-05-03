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
import { readFileSync, readdirSync, existsSync, realpathSync, statSync, lstatSync } from "node:fs";
import { spawnSync } from "node:child_process";
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
					const allProfiles = loadProfiles();
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

		const allProfiles = loadProfiles();
		if (allProfiles.size === 0) {
			profilesResolved = true;
			return;
		}

		// Enable all profiles by default when UI is unavailable or not interactive
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
			const model = getModel(ctx);
			const modelRegistry = currentModelRegistry ?? ctx.modelRegistry;
			const authStorage = modelRegistry?.authStorage;
			if (!model) {
				return { content: [{ type: "text", text: "ERROR: No model available" }], isError: true };
			}
			if (!authStorage || !modelRegistry) {
				return { content: [{ type: "text", text: "ERROR: No auth storage or model registry available" }], isError: true };
			}

			await ensureProfiles(ctx);

			const profileNames = [...activeProfiles.keys()];
			const profileInfo = profileNames.length > 0 ? ` with profiles: ${profileNames.join(", ")}` : " (no profiles)";
			onUpdate?.({ content: [{ type: "text", text: `Reviewing plan with ${model.name}${profileInfo}...` }] });

			try {
				const prompt = buildPrompt(PLAN_REVIEWER_PROMPT, activeProfiles);
				let reviewText = params.plan;
				let openspecValidationStatus: "pass" | "fail" | "not_run" | undefined;
				if (reviewMode === "openspec" && !params.change_dir) {
					return { content: [{ type: "text", text: "ERROR: change_dir is required when mode=openspec" }], isError: true };
				}
				if (reviewMode === "openspec" && params.change_dir) {
					const resolvedChange = resolveOpenSpecChange(ctx.cwd ?? process.cwd(), params.change_dir);
					if ("error" in resolvedChange) {
						return { content: [{ type: "text", text: `ERROR: invalid change_dir: ${resolvedChange.error}` }], isError: true };
					}
					const pack = buildOpenSpecPack({
						cwd: ctx.cwd ?? process.cwd(),
						plan: params.plan,
						changeDir: params.change_dir,
						reviewDepth,
						includeBaselineSpecs: params.include_baseline_specs ?? true,
						reviewScope: params.review_scope,
						stopCondition: params.stop_condition,
					});
					reviewText = pack.text;
					openspecValidationStatus = pack.validationStatus;
				} else {
					reviewText = `# Review Settings\n\n- mode: ${reviewMode}\n- review_depth: ${reviewDepth}\n\n## Plan\n\n${fenced(params.plan)}`;
				}
				const result = await runSubAgent(model, prompt, `# Plan Review Request\n\n${reviewText}`, authStorage, modelRegistry, ctx.cwd ?? process.cwd());
				return {
					content: [{ type: "text", text: result }],
					details: { verdict: parseVerdict(result), rawVerdict: parseRawVerdict(result), type: "plan", reviewDepth, mode: reviewMode, openspecValidationStatus, profiles: profileNames },
				};
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				return { content: [{ type: "text", text: `Plan review sub-agent error: ${message}` }], isError: true };
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
			const model = getModel(ctx);
			const modelRegistry = currentModelRegistry ?? ctx.modelRegistry;
			const authStorage = modelRegistry?.authStorage;
			if (!model) {
				return { content: [{ type: "text", text: "ERROR: No model available" }], isError: true };
			}
			if (!authStorage || !modelRegistry) {
				return { content: [{ type: "text", text: "ERROR: No auth storage or model registry available" }], isError: true };
			}

			await ensureProfiles(ctx);

			const profileNames = [...activeProfiles.keys()];
			const profileInfo = profileNames.length > 0 ? ` with profiles: ${profileNames.join(", ")}` : " (no profiles)";
			onUpdate?.({ content: [{ type: "text", text: `Reviewing ${files.length} files with ${model.name}${profileInfo}...` }] });

			const fileContents: string[] = [];
			for (const filePath of files) {
				const content = safeReadFile(filePath);
				fileContents.push(`## File: ${filePath}\n${fenced(content)}`);
			}

			let prompt = `# Review Request\n\n## Plan\n${plan}\n\n## Files\n${fileContents.join("\n\n")}`;
			if (specsDir) {
				prompt += `\n\n## OpenSpec Specifications\n${readSpecs(specsDir)}`;
			}

			try {
				const reviewerSystemPrompt = buildPrompt(CODE_REVIEWER_PROMPT, activeProfiles);
				const result = await runSubAgent(model, reviewerSystemPrompt, prompt, authStorage, modelRegistry, ctx.cwd ?? process.cwd());
				return {
					content: [{ type: "text", text: result }],
					details: { verdict: parseVerdict(result), rawVerdict: parseRawVerdict(result), filesReviewed: files.length, hasSpecs: !!specsDir, profiles: profileNames },
				};
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				return { content: [{ type: "text", text: `Review sub-agent error: ${message}` }], isError: true };
			}
		},
	});
}
