import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { run } from "./index";
import { MCP_SERVER_VERSION } from "./utils/const";

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
		expect(logSpy).toHaveBeenCalledWith(MCP_SERVER_VERSION);
		logSpy.mockRestore();
	});

	/**
	 * Test for -v flag
	 */
	test("should print version with -v", async () => {
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		await run(["-v"]);
		expect(logSpy).toHaveBeenCalledWith(MCP_SERVER_VERSION);
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

	/**
	 * Test for fatal error in main()
	 */
	test("should handle fatal error in main()", async () => {
		const errorSpy = spyOn(console, "error").mockImplementation(() => {});
		const exitSpy = spyOn(process, "exit").mockImplementation((() => {
			throw new Error("process.exit");
		}) as any);

		// Mock run to throw
		const { main, run: originalRun } = require("./index");
		const _runSpy = spyOn({ run: originalRun }, "run").mockImplementation(
			async () => {
				throw new Error("test error");
			},
		);

		// We need to use the exported main but with mocked run
		// Since they are in the same file, we might need a different approach if they are closely bound
		// Let's try to just make run() throw by using invalid env
		const invalidPath = path.resolve(process.cwd(), "test-dir-error-main");
		if (!fs.existsSync(invalidPath)) fs.mkdirSync(invalidPath);
		process.env.LLM_LOG_PATH = invalidPath;

		try {
			await main();
		} catch (e: any) {
			expect(e.message).toBe("process.exit");
		}

		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Fatal error in MCP server:"),
			expect.any(Error),
		);

		delete process.env.LLM_LOG_PATH;
		fs.rmdirSync(invalidPath);
		errorSpy.mockRestore();
		exitSpy.mockRestore();
	});
});
