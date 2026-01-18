import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerMemoryMcpHandlers } from "l-log-mcp";
import path from "node:path";

/**
 * Main function to start the MCP server.
 */
async function main() {
	// Use environment variable or default to a test log file
	const LOG_PATH =
		(process.env as { LLM_LOG_PATH?: string }).LLM_LOG_PATH ||
		path.resolve(process.cwd(), "logs/chat.csv");

	console.error(`Starting MCP server with log path: ${LOG_PATH}`);

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
