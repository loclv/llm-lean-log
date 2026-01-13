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
	let originalArgv: string[];

	beforeEach(() => {
		consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
		processExitSpy = spyOn(process, "exit").mockImplementation(
			(code?: string | number | null | undefined) => {
				throw new Error(`process.exit(${code})`);
			},
		);
		originalArgv = process.argv;
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		processExitSpy.mockRestore();
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

	it("should show version with '--version' flag", async () => {
		await runCommand(["--version"]);
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

	it("should call visualizeStats for 'stats' command", async () => {
		const { visualizeStats } = core as any;

		await runCommand(["stats"]);

		expect(visualizeStats).toHaveBeenCalled();
		expect(consoleLogSpy).toHaveBeenCalledWith("visualized stats");
	});

	it("should add a new log entry with 'add' command", async () => {
		const { saveLogs, addLogEntry } = core as any;

		await runCommand([
			"add",
			"New Log",
			"--problem=Test Problem",
			"--tags=test,cli",
		]);

		expect(addLogEntry).toHaveBeenCalled();
		expect(saveLogs).toHaveBeenCalled();
		expect(consoleLogSpy).toHaveBeenCalledWith("Log entry added successfully");
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

	it("should search logs with 'search' command", async () => {
		const { searchLogs, visualizeTable } = core as any;
		searchLogs.mockReturnValueOnce([]);

		await runCommand(["search", "query"]);

		expect(searchLogs).toHaveBeenCalled();
		expect(visualizeTable).toHaveBeenCalled();
	});

	it("should filter logs by tags with 'tags' command", async () => {
		const { filterByTags, visualizeTable } = core as any;
		filterByTags.mockReturnValueOnce([]);

		await runCommand(["tags", "tag1", "tag2"]);

		expect(filterByTags).toHaveBeenCalled();
		expect(visualizeTable).toHaveBeenCalled();
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

	it("should use custom log file if provided", async () => {
		const { loadLogs } = core as any;
		await runCommand(["list", "custom.csv"]);
		expect(loadLogs).toHaveBeenCalledWith("custom.csv");
	});
});
