import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "node:path";
import { registerMemoryMcpHandlers } from "./index.js";

/**
 * Main entry point for the server.
 */
async function main() {
	const LOG_PATH =
		(process.env as { LLM_LOG_PATH?: string }).LLM_LOG_PATH ||
		path.resolve(process.cwd(), "logs/chat.csv");

	if (!LOG_PATH) {
		console.warn(
			"[INFO] No log path specified. Please set LLM_LOG_PATH environment variable or it will default to ./logs/chat.csv.",
		);
	}

	const server = new McpServer({
		name: "l-log-mcp",
		version: "0.1.0",
	});

	const refresh = registerMemoryMcpHandlers(server, LOG_PATH);
	await refresh();

	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Memory MCP Server running on stdio");
	console.error(`Monitoring logs at: ${LOG_PATH}`);
}

main().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
