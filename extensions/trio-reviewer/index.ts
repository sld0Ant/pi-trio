import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
	createAgentSession,
	DefaultResourceLoader,
	SessionManager,
	AuthStorage,
	ModelRegistry,
} from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Model } from "@mariozechner/pi-ai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CODE_REVIEWER_PROMPT = join(__dirname, "reviewer-prompt.md");
const PLAN_REVIEWER_PROMPT = join(__dirname, "plan-reviewer-prompt.md");

async function runSubAgent(model: Model, systemPromptPath: string, userPrompt: string): Promise<string> {
	const systemPrompt = readFileSync(systemPromptPath, "utf-8");
	const authStorage = AuthStorage.create();
	const modelRegistry = new ModelRegistry(authStorage);

	const loader = new DefaultResourceLoader({
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

function parseVerdict(text: string): string {
	return text.includes("PASS") && !text.includes("NEEDS WORK") ? "PASS" : "NEEDS WORK";
}

export default function (pi: ExtensionAPI) {
	let currentModel: Model | undefined;

	pi.on("session_start", async (_event, ctx) => {
		currentModel = ctx.model;
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
			if (!model) {
				return { content: [{ type: "text", text: "ERROR: No model available" }], isError: true };
			}

			onUpdate?.({ content: [{ type: "text", text: `Reviewing plan with ${model.name}...` }] });

			try {
				const result = await runSubAgent(model, PLAN_REVIEWER_PROMPT, `# Plan Review Request\n\n${params.plan}`);
				return {
					content: [{ type: "text", text: result }],
					details: { verdict: parseVerdict(result), type: "plan" },
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
			if (!model) {
				return { content: [{ type: "text", text: "ERROR: No model available" }], isError: true };
			}

			onUpdate?.({ content: [{ type: "text", text: `Reviewing ${files.length} files with ${model.name}...` }] });

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
				const result = await runSubAgent(model, CODE_REVIEWER_PROMPT, prompt);
				return {
					content: [{ type: "text", text: result }],
					details: { verdict: parseVerdict(result), filesReviewed: files.length, hasSpecs: !!specsDir },
				};
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				return { content: [{ type: "text", text: `Review sub-agent error: ${message}` }], isError: true };
			}
		},
	});
}
