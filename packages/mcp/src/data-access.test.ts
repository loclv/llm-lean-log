import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import {
	getEntriesByTask,
	getLastNEntries,
	loadEntries,
	searchEntries,
} from "./data-access";

describe("data-access", () => {
	const testLogPath = path.resolve(process.cwd(), "test-data-access.csv");

	test("should load entries from CSV", async () => {
		fs.writeFileSync(
			testLogPath,
			"name,problem,created-at\nTest1,Problem1,2024-01-01\nTest2,Problem2,2024-01-02\n",
		);
		const entries = await loadEntries(testLogPath);
		expect(entries.length).toBe(2);
		expect(entries[0]?.name).toBe("Test1");

		if (fs.existsSync(testLogPath)) {
			fs.unlinkSync(testLogPath);
		}
	});

	test("should return empty array if file does not exist", async () => {
		const entries = await loadEntries("non-existent-file.csv");
		expect(entries).toEqual([]);
	});

	test("should throw error for other read errors", async () => {
		// Create a directory with same name as file to cause read error
		const dirPath = path.resolve(process.cwd(), "test-dir-error");
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath);
		}
		try {
			await loadEntries(dirPath);
			expect(true).toBe(false); // Should not reach here
		} catch (error) {
			expect(error).toBeDefined();
		} finally {
			fs.rmdirSync(dirPath);
		}
	});

	test("should get last N entries in reverse order", () => {
		const entries = [
			{ name: "Task 1", problem: "Problem 1", "created-at": "2024-01-01" },
			{ name: "Task 2", problem: "Problem 2", "created-at": "2024-01-02" },
			{ name: "Task 3", problem: "Problem 3", "created-at": "2024-01-03" },
		] as any;

		const result = getLastNEntries(entries, 2);
		expect(result.length).toBe(2);
		expect(result[0]?.name).toBe("Task 3");
		expect(result[1]?.name).toBe("Task 2");
	});

	test("should search entries", () => {
		const entries = [
			{ name: "Task 1", problem: "Error in build", "created-at": "2024-01-01" },
			{
				name: "Task 2",
				problem: "Deployment success",
				"created-at": "2024-01-02",
				"created-by-agent": "Antigravity",
			},
		] as any;

		const results = searchEntries(entries, "build");
		expect(results.length).toBe(1);
		expect(results[0]?.name).toBe("Task 1");
	});

	test("should get entries by task name", () => {
		const entries = [
			{ name: "Refactor API", problem: "P1", "created-at": "2024-01-01" },
			{ name: "Fix Bug", problem: "P2", "created-at": "2024-01-02" },
			{ name: "Update API docs", problem: "P3", "created-at": "2024-01-03" },
		] as any;

		const results = getEntriesByTask(entries, "API");
		expect(results.length).toBe(2);
		expect(results.every((r) => r.name.includes("API"))).toBe(true);
	});
});
