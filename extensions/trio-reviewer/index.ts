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
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import type { Model } from "@mariozechner/pi-ai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CODE_REVIEWER_PROMPT = join(__dirname, "reviewer-prompt.md");
const PLAN_REVIEWER_PROMPT = join(__dirname, "plan-reviewer-prompt.md");
const BUILTIN_PROFILES_DIR = join(__dirname, "profiles");
const GLOBAL_PROFILES_DIR = join(process.env.HOME ?? "~", ".pi", "agent", "trio-profiles");
const PROJECT_PROFILES_DIR = join(process.cwd(), ".pi", "trio-profiles");

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

	await session.prompt(userPrompt);
	session.dispose();
	return result;
}

function readSpecs(specsDir: string): string {
	let content = "";
	try {
		const entries = readdirSync(specsDir, { withFileTypes: true, recursive: true });
		for (const entry of entries) {
			if (entry.isFile() && entry.name.endsWith(".md")) {
				const specPath = join(entry.parentPath ?? entry.path, entry.name);
				try {
					content += `\n## Spec: ${specPath}\n${readFileSync(specPath, "utf-8")}\n`;
				} catch {
					content += `\n## Spec: ${specPath}\n[ERROR: Could not read]\n`;
				}
			}
		}
	} catch {
		content = "[ERROR: Could not read specs directory]";
	}
	return content;
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

function parseVerdict(text: string): string {
	return text.includes("PASS") && !text.includes("NEEDS WORK") ? "PASS" : "NEEDS WORK";
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
The sub-agent receives ONLY the plan text. It does NOT see the chat history.

Use this after the Planner produces a plan, before user approval.
Pass the full plan text.`,
		parameters: Type.Object({
			plan: Type.String({ description: "The full plan text to review" }),
		}),

		async execute(toolCallId, params, signal, onUpdate, ctx) {
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
				const result = await runSubAgent(model, prompt, `# Plan Review Request\n\n${params.plan}`, authStorage, modelRegistry, ctx.cwd ?? process.cwd());
				return {
					content: [{ type: "text", text: result }],
					details: { verdict: parseVerdict(result), type: "plan", profiles: profileNames },
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
				try {
					const content = readFileSync(filePath, "utf-8");
					fileContents.push(`## File: ${filePath}\n\`\`\`\n${content}\n\`\`\``);
				} catch {
					fileContents.push(`## File: ${filePath}\n[ERROR: Could not read file]`);
				}
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
					details: { verdict: parseVerdict(result), filesReviewed: files.length, hasSpecs: !!specsDir, profiles: profileNames },
				};
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				return { content: [{ type: "text", text: `Review sub-agent error: ${message}` }], isError: true };
			}
		},
	});
}
