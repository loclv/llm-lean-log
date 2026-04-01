import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerMemoryMcpHandlers } from "l-log-mcp";
import { existsSync } from "node:fs";
import path from "node:path";
import { MCP_SERVER_VERSION } from "./utils/const";

/**
 * Print configuration example for OpenCode and Claude Desktop.
 */
function printConfig() {
	const config = {
		mcp: {
			"llm-memory": {
				type: "local",
				command: ["l-log-mcp-server"],
				environment: {
					LLM_LOG_PATH: "/absolute/path/to/your/logs/chat.csv",
				},
			},
		},
	};

	const claudeConfig = {
		mcpServers: {
			"l-log-memory": {
				command: "l-log-mcp-server",
				env: {
					LLM_LOG_PATH: "/absolute/path/to/your/logs/chat.csv",
				},
			},
		},
	};

	console.log(
		"\n\x1b[32ml-log-mcp-server configuration examples:\x1b[0m\n\n\x1b[36mOpenCode (~/.opencode.json):\x1b[0m\n" +
			JSON.stringify(config, null, 2) +
			"\n\n\x1b[36mClaude Desktop / Claude Code (claude_config.json or .claude/settings.json):\x1b[0m\n" +
			JSON.stringify(claudeConfig, null, 2) +
			"\n\n\x1b[33mNote: Replace /absolute/path/to/your/logs/chat.csv with the actual path to your chat.csv file.\x1b[0m\n",
	);
}

/**
 * Main function to start the MCP server.
 *
 * @param args - Command line arguments.
 * @param env - Environment variables.
 */
export async function run(
	args: string[] = process.argv.slice(2),
	env: Record<string, string | undefined> = process.env,
) {
	if (args.includes("--config") || args.includes("-c")) {
		printConfig();
		return;
	}

	if (
		args.includes("--version") ||
		args.includes("-v") ||
		args.includes("-V")
	) {
		// Update this when you release a new version of `l-log-mcp-server`
		console.log(MCP_SERVER_VERSION);
		return;
	}

	if (args.includes("--help") || args.includes("-h")) {
		const _helpText = `Usage: l-log-mcp-server [options]

Options:
  --config, -c # Show configuration examples for OpenCode, Claude Desktop, and Claude Code
  --version, -v, -V # Show version number
  --help, -h # Show this help message

Resources:
  memory://recent # View the last 8 log entries
  memory://last # View the very last log entry with full details
  memory://stats # View statistics about your logs

Tools:
  search_logs(query) # Search for specific topics or errors in your history
  get_task_history(taskName) # Get all logs related to a specific task

Prompts:
  recent_work # A prompt template to summarize recent activities
  learned # Review past mistakes and lessons learned to avoid repeating them`;
		console.log(_helpText);
		return;
	}

	// Use environment variable or default to a test log file
	// @example
	// LLM_LOG_PATH=/absolute/path/to/your/logs/chat.csv l-log-mcp-server
	// @default ./logs/chat.csv
	const configLogPath = env.LLM_LOG_PATH;
	const LOG_PATH =
		configLogPath || path.resolve(process.cwd(), "logs/chat.csv");

	if (!configLogPath) {
		console.warn(
			"[WARN] LLM_LOG_PATH environment variable is not set. Defaulting to ./logs/chat.csv.",
		);
	}

	console.log(`Starting MCP server with log path: ${LOG_PATH}`);

	// Check if log file exists
	if (!existsSync(LOG_PATH)) {
		console.error(
			`\x1b[33mWarning: Log file not found at ${LOG_PATH}\nPlease set LLM_LOG_PATH environment variable to the absolute path of your chat.csv file.\nRun 'l-log-mcp-server --config' to see configuration examples.\x1b[0m`,
		);
	}

	const server = new McpServer({
		name: "l-log-mcp-server",
		version: MCP_SERVER_VERSION,
	});

	// Register memory MCP handlers from the package
	const refresh = registerMemoryMcpHandlers(server, LOG_PATH);

	// Initial refresh
	await refresh();

	const transport = new StdioServerTransport();
	await server.connect(transport);

	console.error("MCP Server is running on stdio");
}

/**
 * Entry point for the MCP server when run directly.
 */
export async function main() {
	try {
		await run();
	} catch (error) {
		console.error("Fatal error in MCP server:", error);
		process.exit(1);
	}
}

if (import.meta.main) {
	main();
}
