import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	mock,
	spyOn,
} from "bun:test";
import * as core from "llm-lean-log-core";
import pkg from "../package.json";
import { main } from "./index";

// Mock core functions
mock.module("llm-lean-log-core", () => ({
	loadLogs: mock(() => Promise.resolve([])),
	saveLogs: mock(() => Promise.resolve()),
	addLogEntry: mock((entries, entry) => [
		...entries,
		{ ...entry, id: "test-id", "created-at": "2024-01-01" },
	]),
	filterByTags: mock(() => []),
	searchLogs: mock(() => []),
	visualizeEntry: mock(() => "visualized entry"),
	visualizeStats: mock(() => "visualized stats"),
	visualizeTable: mock(() => "visualized table"),
}));

describe("CLI", () => {
	let consoleLogSpy: any;
	let consoleErrorSpy: any;
	let processExitSpy: any;
	let bunFileSpy: any;
	let bunWriteSpy: any;
	let originalArgv: string[];

	beforeEach(() => {
		consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
		processExitSpy = spyOn(process, "exit").mockImplementation(
			(code?: string | number | null | undefined) => {
				throw new Error(`process.exit(${code})`);
			},
		);
		bunFileSpy = spyOn(Bun, "file").mockImplementation(
			() =>
				({
					exists: () => Promise.resolve(true),
					text: () => Promise.resolve(""),
				}) as any,
		);
		bunWriteSpy = spyOn(Bun, "write").mockImplementation(() =>
			Promise.resolve(0),
		);
		originalArgv = process.argv;
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		processExitSpy.mockRestore();
		bunFileSpy.mockRestore();
		bunWriteSpy.mockRestore();
		process.argv = originalArgv;
	});

	const runCommand = async (args: string[]) => {
		process.argv = ["bun", "index.ts", ...args];
		await main();
	};

	it("should show help message with 'help' command", async () => {
		await runCommand(["help"]);
		expect(consoleLogSpy).toHaveBeenCalled();
		expect(consoleLogSpy.mock.calls[0][0]).toContain("l-log CLI");
	});

	it("should show help message with '--help' flag", async () => {
		await runCommand(["--help"]);
		expect(consoleLogSpy).toHaveBeenCalled();
		expect(consoleLogSpy.mock.calls[0][0]).toContain("l-log CLI");
	});

	it("should show CSV format help by default (for LLMs)", async () => {
		await runCommand(["help"]);
		expect(consoleLogSpy).toHaveBeenCalled();
		const output = consoleLogSpy.mock.calls[0][0];
		expect(output).toContain("command,options,description");
		expect(output).toContain("list|ls");
	});

	it("should show human-readable help with '--human' flag", async () => {
		await runCommand(["help", "--human"]);
		expect(consoleLogSpy).toHaveBeenCalled();
		const output = consoleLogSpy.mock.calls[0][0];
		expect(output).toContain("Usage: l-log <command> [log-file] [options]");
		expect(output).toContain("Commands:");
		expect(output).toContain("list, ls");
		expect(output).not.toContain("command,options,description");
		expect(output).toContain("--cause=<text>");
	});

	it("should show version with '--version' flag", async () => {
		await runCommand(["--version"]);
		expect(consoleLogSpy).toHaveBeenCalledWith(pkg.version);
	});

	it("should show version with '-v' flag", async () => {
		await runCommand(["-v"]);
		expect(consoleLogSpy).toHaveBeenCalledWith(pkg.version);
	});

	it("should show version with '-V' flag", async () => {
		await runCommand(["-V"]);
		expect(consoleLogSpy).toHaveBeenCalledWith(pkg.version);
	});

	it("should call loadLogs and visualizeTable for 'list' command", async () => {
		const { loadLogs, visualizeTable } = core as any;
		loadLogs.mockResolvedValueOnce([
			{ id: "1", name: "test", problem: "p", "created-at": "t" },
		]);

		await runCommand(["list"]);

		expect(loadLogs).toHaveBeenCalled();
		expect(visualizeTable).toHaveBeenCalled();
		expect(consoleLogSpy).toHaveBeenCalledWith("visualized table");
	});

	it("should work with 'ls' alias", async () => {
		const { loadLogs, visualizeTable } = core as any;
		await runCommand(["ls"]);
		expect(loadLogs).toHaveBeenCalled();
		expect(visualizeTable).toHaveBeenCalled();
	});

	it("should call visualizeStats for 'stats' command", async () => {
		const { visualizeStats } = core as any;

		await runCommand(["stats"]);

		expect(visualizeStats).toHaveBeenCalled();
		expect(consoleLogSpy).toHaveBeenCalledWith("visualized stats");
	});

	it("should add a new log entry with 'add' command", async () => {
		const { saveLogs, addLogEntry } = core;

		await runCommand([
			"add",
			"New Log",
			"--problem=Test Problem",
			"--tags=test,cli",
			"--cause=Test Cause",
		]);

		expect(addLogEntry).toHaveBeenCalled();
		expect(saveLogs).toHaveBeenCalled();
		expect(consoleLogSpy).toHaveBeenCalledWith("Log entry added successfully");

		// Verify that saveLogs was called with the expected entries
		const savedEntries = (saveLogs as any).mock.calls[0][1];
		const lastEntry = savedEntries[savedEntries.length - 1];

		expect(lastEntry.name).toBe("New Log");
		expect(lastEntry.problem).toBe("Test Problem");
		expect(lastEntry.tags).toBe("test,cli");
		expect(lastEntry.cause).toBe("Test Cause");
		expect(lastEntry["created-at"]).toBeDefined();
		expect(lastEntry.id).toBeDefined();
	});

	it("should show error and exit if 'add' is missing problem", async () => {
		try {
			await runCommand(["add", "New Log"]);
		} catch (e: any) {
			expect(e.message).toBe("process.exit(1)");
		}
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Please provide a problem description"),
		);
	});

	it("should show error and exit if 'add' is missing name", async () => {
		try {
			await runCommand(["add"]);
		} catch (e: any) {
			expect(e.message).toBe("process.exit(1)");
		}
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Please provide a log name"),
		);
	});

	it("should search logs with 'search' command", async () => {
		const { searchLogs, visualizeTable } = core as any;
		searchLogs.mockReturnValueOnce([]);

		await runCommand(["search", "query"]);

		expect(searchLogs).toHaveBeenCalled();
		expect(visualizeTable).toHaveBeenCalled();
	});

	it("should show error and exit if 'search' is missing query", async () => {
		try {
			await runCommand(["search"]);
		} catch (e: any) {
			expect(e.message).toBe("process.exit(1)");
		}
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Please provide a search query"),
		);
	});

	it("should filter logs by tags with 'tags' command", async () => {
		const { filterByTags, visualizeTable } = core as any;
		filterByTags.mockReturnValueOnce([]);

		await runCommand(["tags", "tag1", "tag2"]);

		expect(filterByTags).toHaveBeenCalled();
		expect(visualizeTable).toHaveBeenCalled();
	});

	it("should show error and exit if 'tags' is missing tags", async () => {
		try {
			await runCommand(["tags"]);
		} catch (e: any) {
			expect(e.message).toBe("process.exit(1)");
		}
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Please provide at least one tag"),
		);
	});

	it("should view entry at index", async () => {
		const { loadLogs, visualizeEntry } = core as any;
		loadLogs.mockResolvedValueOnce([
			{ id: "1", name: "test", problem: "p", "created-at": "t" },
		]);

		await runCommand(["view", "0"]);

		expect(visualizeEntry).toHaveBeenCalled();
		expect(consoleLogSpy).toHaveBeenCalledWith("visualized entry");
	});

	it("should view last entry with --last flag", async () => {
		const { loadLogs, visualizeEntry } = core as any;
		loadLogs.mockResolvedValueOnce([
			{ id: "1", name: "test1", problem: "p1", "created-at": "t1" },
			{ id: "2", name: "test2", problem: "p2", "created-at": "t2" },
		]);

		await runCommand(["view", "--last"]);

		expect(visualizeEntry).toHaveBeenCalledWith(
			expect.objectContaining({ id: "2" }),
			expect.any(Object),
		);
	});

	it("should show error and exit if 'view' has no logs", async () => {
		const { loadLogs } = core as any;
		loadLogs.mockResolvedValueOnce([]);

		try {
			await runCommand(["view", "0"]);
		} catch (e: any) {
			expect(e.message).toBe("process.exit(1)");
		}
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("No log entries found"),
		);
	});

	it("should show error and exit if 'view' index is NaN", async () => {
		const { loadLogs } = core as any;
		loadLogs.mockResolvedValueOnce([{ id: "1" }]);

		try {
			await runCommand(["view", "abc"]);
		} catch (e: any) {
			expect(e.message).toBe("process.exit(1)");
		}
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Please provide a valid entry index"),
		);
	});

	it("should show error and exit if 'view' index is out of range", async () => {
		const { loadLogs } = core as any;
		loadLogs.mockResolvedValueOnce([{ id: "1" }]);

		try {
			await runCommand(["view", "10"]);
		} catch (e: any) {
			expect(e.message).toBe("process.exit(1)");
		}
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("out of range"),
		);
	});

	it("should show error and exit if entry is missing at index", async () => {
		const { loadLogs } = core as any;
		// Create an array with a hole or undefined
		loadLogs.mockResolvedValueOnce([undefined]);

		try {
			await runCommand(["view", "0"]);
		} catch (e: any) {
			expect(e.message).toBe("process.exit(1)");
		}
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Entry not found at index 0"),
		);
	});

	it("should show error for unknown command", async () => {
		try {
			await runCommand(["unknown"]);
		} catch (e: any) {
			expect(e.message).toBe("process.exit(1)");
		}
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Unknown command "unknown"'),
		);
	});

	it("should show help when no command is provided", async () => {
		await runCommand([]);
		expect(consoleLogSpy).toHaveBeenCalled();
		expect(consoleLogSpy.mock.calls[0][0]).toContain("l-log CLI");
	});

	it("should use custom log file if provided", async () => {
		const { loadLogs } = core as any;
		await runCommand(["list", "custom.csv"]);
		expect(loadLogs).toHaveBeenCalledWith("custom.csv");
	});
});
