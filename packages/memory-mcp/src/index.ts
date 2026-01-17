import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { LogEntry } from "llm-lean-log-core";
import path from "node:path";
import { z } from "zod";
import {
	getEntriesByTask,
	getLastNEntries,
	loadEntries,
	searchEntries,
} from "./data-access.js";

// Initialize DataAccess
// Defaulting to a likely location in any workspace using this repo structure
const LOG_PATH =
	(process.env as { LLM_LOG_PATH?: string }).LLM_LOG_PATH ||
	path.resolve(process.cwd(), "logs/chat.csv");

if (!LOG_PATH) {
	console.warn(
		"[INFO] No log path specified. Please set LLM_LOG_PATH environment variable or it will default to ./logs/chat.csv.",
	);
}

let logCache: LogEntry[] = [];

const refreshCache = async () => {
	logCache = await loadEntries(LOG_PATH);
};

const server = new McpServer({
	name: "llm-lean-log-memory-mcp",
	version: "0.1.0",
});

const RECENT_LOGS_LIMIT = 50;

/**
 * Resources
 */
server.registerResource(
	"recent-logs",
	"memory://recent",
	{
		mimeType: "text/plain",
		description: "The last 50 log entries from the project history.",
	},
	async (uri) => {
		await refreshCache();
		const entries = getLastNEntries(logCache, RECENT_LOGS_LIMIT);
		// Format as simple text/markdown for easy consumption
		const text = entries
			.map(
				(e) => `[${e["created-at"]}] ${e.name}: ${e.problem} -> ${e.solution}`,
			)
			.join("\n");
		return {
			contents: [
				{
					uri: uri.href,
					mimeType: "text/plain",
					text: text,
				},
			],
		};
	},
);

server.registerResource(
	"log-stats",
	"memory://stats",
	{
		mimeType: "application/json",
		description: "Statistics about the log history.",
	},
	async (uri) => {
		await refreshCache();
		const entries = logCache;
		const stats = {
			totalEntries: entries.length,
			lastEntry: entries[entries.length - 1]?.["created-at"] || null,
			uniqueTags: [...new Set(entries.map((e) => e.tags).filter(Boolean))],
		};

		return {
			contents: [
				{
					uri: uri.href,
					mimeType: "application/json",
					text: JSON.stringify(stats, null, 2),
				},
			],
		};
	},
);

const SEARCH_LIMIT = 20;

/**
 * Tools
 */
server.registerTool(
	"search_logs",
	{
		description:
			"Search the log history for past problems, solutions, or topics.",
		inputSchema: {
			query: z
				.string()
				.describe(
					"The search query (e.g. 'build error', 'database migration')",
				),
		},
	},
	async ({ query }) => {
		await refreshCache();
		const results = searchEntries(logCache, query).slice(0, SEARCH_LIMIT); // Limit to 20 relevant results
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(results, null, 2),
				},
			],
		};
	},
);

server.registerTool(
	"get_task_history",
	{
		description: "Get all log entries related to a specific task name.",
		inputSchema: {
			taskName: z
				.string()
				.describe("The exact or partial task name to filter by."),
		},
	},
	async ({ taskName }) => {
		await refreshCache();
		const results = getEntriesByTask(logCache, taskName);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(results, null, 2),
				},
			],
		};
	},
);

const RECENT_WORK_LIMIT = 20;

/**
 * Prompts
 */
server.registerPrompt(
	"summarize_recent_work",
	{
		description: "Summarize what has been done recently based on logs.",
	},
	async () => {
		await refreshCache();
		const recent = getLastNEntries(logCache, RECENT_WORK_LIMIT);
		const text = recent.map((e) => `- ${e.name}: ${e.problem}`).join("\n");
		return {
			messages: [
				{
					role: "user",
					content: {
						type: "text",
						text: `Please summarize the following recent work logs:\n\n${text}`,
					},
				},
			],
		};
	},
);

async function main() {
	await refreshCache();
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Memory MCP Server running on stdio");
	console.error(`Monitoring logs at: ${LOG_PATH}`);
}

main().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
