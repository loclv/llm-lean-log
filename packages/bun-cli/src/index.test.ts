import { spawnSync } from "bun";
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("CLI Basic Checks", () => {
	const cliPath = join(import.meta.dir, "index.ts");
	const pkgPath = join(import.meta.dir, "../package.json");

	it("should output version when --version flag is used", async () => {
		const pkg = await Bun.file(pkgPath).json();
		const { stdout, exitCode } = spawnSync([
			"bun",
			"run",
			cliPath,
			"--version",
		]);
		expect(exitCode).toBe(0);
		expect(stdout.toString().trim()).toBe(pkg.version);
	});

	it("should output help when no args are provided", () => {
		const { stdout, exitCode } = spawnSync(["bun", "run", cliPath]);
		expect(exitCode).toBe(0);
		expect(stdout.toString()).toContain("Usage:");
	});

	it("should exit with error for unknown command and show help in stderr", () => {
		const { stdout, stderr, exitCode } = spawnSync([
			"bun",
			"run",
			cliPath,
			"non-existent-command",
		]);
		expect(exitCode).toBe(1);
		expect(stderr.toString()).toContain("Error: Unknown command");
		expect(stderr.toString()).toContain("command,options,description"); // part of help text
		expect(stdout.toString()).toBe("");
	});
});

describe("CLI Commands Integration", () => {
	const cliPath = join(import.meta.dir, "index.ts");
	const testCsv = join(import.meta.dir, "test-logs-ts.csv");

	// Clean up after tests
	const cleanup = () => {
		try {
			const file = Bun.file(testCsv);
			if (file.exists()) {
				spawnSync(["rm", testCsv]);
			}
		} catch (_e) {}
	};

	it("should add a log entry successfully", () => {
		cleanup();
		const { stdout, exitCode, stderr } = spawnSync([
			"bun",
			"run",
			cliPath,
			"add",
			testCsv,
			"Test Entry",
			"--problem=test problem",
			"--solution=test solution",
			"--tags=test,cli",
		]);
		if (exitCode !== 0) {
			console.error(stderr.toString());
		}
		expect(exitCode).toBe(0);
		expect(stdout.toString()).toContain("Log entry added successfully");

		const fileContent = readFileSync(testCsv, "utf8");
		expect(fileContent).toContain("Test Entry");
		expect(fileContent).toContain("test problem");
	});

	it("should list log entries", () => {
		const { stdout, exitCode } = spawnSync([
			"bun",
			"run",
			cliPath,
			"list",
			testCsv,
		]);
		expect(exitCode).toBe(0);
		expect(stdout.toString()).toContain("Test Entry");
	});

	it("should search log entries", () => {
		const { stdout, exitCode } = spawnSync([
			"bun",
			"run",
			cliPath,
			"search",
			testCsv,
			"Test",
		]);
		expect(exitCode).toBe(0);
		expect(stdout.toString()).toContain("Test Entry");
	});

	it("should show stats", () => {
		const { stdout, exitCode } = spawnSync([
			"bun",
			"run",
			cliPath,
			"stats",
			testCsv,
		]);
		expect(exitCode).toBe(0);
		expect(stdout.toString()).toContain("Total Entries");
	});

	it("should filter by tags", () => {
		const { stdout, exitCode } = spawnSync([
			"bun",
			"run",
			cliPath,
			"tags",
			testCsv,
			"cli",
		]);
		expect(exitCode).toBe(0);
		expect(stdout.toString()).toContain("Test Entry");
	});

	it("should respect --compact flag", () => {
		const { stdout: normalOutput } = spawnSync([
			"bun",
			"run",
			cliPath,
			"list",
			testCsv,
			"--human",
		]);
		const { stdout: compactOutput } = spawnSync([
			"bun",
			"run",
			cliPath,
			"list",
			testCsv,
			"--human",
			"--compact",
		]);
		// Compact output should be different
		expect(compactOutput.toString()).not.toBe(normalOutput.toString());
	});

	it("should show human-readable help with --human", () => {
		const { stdout } = spawnSync(["bun", "run", cliPath, "help", "--human"]);
		expect(stdout.toString()).toContain("Usage:");
		expect(stdout.toString()).not.toContain("command,options,description");
	});

	it("should clean up test file", async () => {
		cleanup();
		const file = Bun.file(testCsv);
		expect(await file.exists()).toBe(false);
	});
});
