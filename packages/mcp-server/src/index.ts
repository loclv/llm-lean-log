import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerMemoryMcpHandlers } from "l-log-mcp";
import { existsSync } from "node:fs";
import path from "node:path";

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

	console.log("\n\x1b[32m✨ l-log-mcp-server configuration examples:\x1b[0m");
	console.log("\n\x1b[36mOpenCode (~/.opencode.json):\x1b[0m");
	console.log(JSON.stringify(config, null, 2));
	console.log("\n\x1b[36mClaude Desktop (claude_config.json):\x1b[0m");
	console.log(JSON.stringify(claudeConfig, null, 2));
	console.log(
		"\n\x1b[33mNote: Replace /absolute/path/to/your/logs/chat.csv with the actual path to your chat.csv file.\x1b[0m\n",
	);
}

/**
 * Main function to start the MCP server.
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.includes("--config") || args.includes("-c")) {
		printConfig();
		process.exit(0);
	}

	if (args.includes("--help") || args.includes("-h")) {
		console.log("Usage: l-log-mcp-server [options]");
		console.log("\nOptions:");
		console.log(
			"  --config, -c  Show configuration examples for OpenCode and Claude Desktop",
		);
		console.log("  --help, -h    Show this help message");
		process.exit(0);
	}

	// Use environment variable or default to a test log file
	const LOG_PATH =
		(process.env as { LLM_LOG_PATH?: string }).LLM_LOG_PATH ||
		path.resolve(process.cwd(), "logs/chat.csv");

	console.error(`Starting MCP server with log path: ${LOG_PATH}`);

	// Check if log file exists
	if (!existsSync(LOG_PATH)) {
		console.error(`\x1b[33mWarning: Log file not found at ${LOG_PATH}\x1b[0m`);
		console.error(
			"\x1b[33mPlease set LLM_LOG_PATH environment variable to the absolute path of your chat.csv file.\x1b[0m",
		);
		console.error(
			"\x1b[33mRun 'l-log-mcp-server --config' to see configuration examples.\x1b[0m",
		);
	}

	const server = new McpServer({
		name: "l-log-mcp-server",
		version: "0.1.0",
	});

	// Register memory MCP handlers from the package
	const refresh = registerMemoryMcpHandlers(server, LOG_PATH);

	// Initial refresh
	await refresh();

	const transport = new StdioServerTransport();
	await server.connect(transport);

	console.error("MCP Server is running on stdio");
}

main().catch((error) => {
	console.error("Fatal error in MCP server:", error);
	process.exit(1);
});
