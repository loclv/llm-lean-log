import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, test } from "bun:test";
import { registerMemoryMcpHandlers } from "l-log-mcp";
import fs from "node:fs";
import path from "node:path";

describe("MCP App", () => {
	test("should register handlers correctly", async () => {
		const server = new McpServer({
			name: "test-server",
			version: "1.0.0",
		});

		// Create a dummy log file
		const testLogPath = path.resolve(process.cwd(), "test-chat.csv");
		if (!fs.existsSync(path.dirname(testLogPath))) {
			fs.mkdirSync(path.dirname(testLogPath), { recursive: true });
		}
		fs.writeFileSync(
			testLogPath,
			"name,created-at,tags,problem,solution,action,files,tech-stack,last-commit-short-sha,created-by-agent\nTest Task,2024-01-01,test,test problem,test solution,test action,test file,test tech,abc123,test agent\n",
		);

		const refresh = registerMemoryMcpHandlers(server, testLogPath);
		expect(typeof refresh).toBe("function");
		await refresh();

		// Clean up
		if (fs.existsSync(testLogPath)) {
			fs.unlinkSync(testLogPath);
		}
	});
});
