import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { run } from "./index";

/**
 * MCP App Tests
 */
describe("MCP App", () => {
	const testLogPath = path.resolve(process.cwd(), "test-cli-chat.csv");

	beforeEach(() => {
		// Create a dummy log file for tests that need it
		fs.writeFileSync(
			testLogPath,
			"name,created-at,tags,problem,solution,action,files,tech-stack,last-commit-short-sha,created-by-agent\nTest Task,2024-01-01,test,test problem,test solution,test action,test file,test tech,abc123,test agent\n",
		);
	});

	afterEach(() => {
		if (fs.existsSync(testLogPath)) {
			fs.unlinkSync(testLogPath);
		}
	});

	/**
	 * Test for --version flag
	 */
	test("should print version with --version", async () => {
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		await run(["--version"]);
		expect(logSpy).toHaveBeenCalledWith("0.1.1");
		logSpy.mockRestore();
	});

	/**
	 * Test for -v flag
	 */
	test("should print version with -v", async () => {
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		await run(["-v"]);
		expect(logSpy).toHaveBeenCalledWith("0.1.1");
		logSpy.mockRestore();
	});

	/**
	 * Test for --help flag
	 */
	test("should print help with --help", async () => {
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		await run(["--help"]);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("Usage: l-log-mcp-server"),
		);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("--version, -v, -V"),
		);
		expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("--help, -h"));
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("--config, -c"),
		);

		logSpy.mockRestore();
	});

	/**
	 * Test for --config flag
	 */
	test("should print config with --config", async () => {
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		await run(["--config"]);
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("OpenCode (~/.opencode.json)"),
		);
		logSpy.mockRestore();
	});

	/**
	 * Test for environment variable usage
	 */
	test("should use LLM_LOG_PATH from env", async () => {
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const errorSpy = spyOn(console, "error").mockImplementation(() => {});

		// Mock server connection to avoid actual stdio transport binding
		const connectSpy = spyOn(McpServer.prototype, "connect").mockImplementation(
			async () => {},
		);

		await run([], { LLM_LOG_PATH: testLogPath });

		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				`Starting MCP server with log path: ${testLogPath}`,
			),
		);

		logSpy.mockRestore();
		errorSpy.mockRestore();
		connectSpy.mockRestore();
	});

	/**
	 * Test for warning when log file is missing
	 */
	test("should warn when log file does not exist", async () => {
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const errorSpy = spyOn(console, "error").mockImplementation(() => {});
		const connectSpy = spyOn(McpServer.prototype, "connect").mockImplementation(
			async () => {},
		);

		const nonExistentPath = path.resolve(process.cwd(), "non-existent.csv");
		await run([], { LLM_LOG_PATH: nonExistentPath });

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Warning: Log file not found"),
		);

		logSpy.mockRestore();
		errorSpy.mockRestore();
		connectSpy.mockRestore();
	});

	/**
	 * Test for default log path warning
	 */
	test("should warn when LLM_LOG_PATH is not set", async () => {
		const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const errorSpy = spyOn(console, "error").mockImplementation(() => {});
		const connectSpy = spyOn(McpServer.prototype, "connect").mockImplementation(
			async () => {},
		);

		await run([], {});

		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining("LLM_LOG_PATH environment variable is not set"),
		);

		warnSpy.mockRestore();
		logSpy.mockRestore();
		errorSpy.mockRestore();
		connectSpy.mockRestore();
	});
});
