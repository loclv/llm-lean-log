import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import {
	getDetailedStatistics,
	getEntriesByAgent,
	getEntriesByDateRange,
	getEntriesByTags,
	getEntriesByTask,
	getLastNEntries,
	getProblemPatterns,
	getSolutionSuggestions,
	loadEntries,
	searchEntries,
} from "./data-access.js";

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

	test("should get entries by tags", () => {
		const entries = [
			{
				name: "Task 1",
				problem: "P1",
				tags: "bug,fix",
				"created-at": "2024-01-01",
			},
			{
				name: "Task 2",
				problem: "P2",
				tags: "feature,api",
				"created-at": "2024-01-02",
			},
			{
				name: "Task 3",
				problem: "P3",
				tags: "bug,performance",
				"created-at": "2024-01-03",
			},
			{
				name: "Task 4",
				problem: "P4",
				tags: "feature,ui",
				"created-at": "2024-01-04",
			},
		] as any;

		// Test single tag
		let results = getEntriesByTags(entries, ["bug"]);
		expect(results.length).toBe(2);
		expect(results.every((r) => r.tags?.includes("bug"))).toBe(true);

		// Test multiple tags
		results = getEntriesByTags(entries, ["bug", "feature"]);
		expect(results.length).toBe(4);

		// Test case insensitive
		results = getEntriesByTags(entries, ["BUG"]);
		expect(results.length).toBe(2);

		// Test no matches
		results = getEntriesByTags(entries, ["nonexistent"]);
		expect(results.length).toBe(0);

		// Test empty tags
		results = getEntriesByTags(entries, []);
		expect(results.length).toBe(0);
	});

	test("should get entries by date range", () => {
		const entries = [
			{ name: "Task 1", problem: "P1", "created-at": "2024-01-01" },
			{ name: "Task 2", problem: "P2", "created-at": "2024-01-05" },
			{ name: "Task 3", problem: "P3", "created-at": "2024-01-10" },
			{ name: "Task 4", problem: "P4", "created-at": "2024-01-15" },
		] as any;

		// Test date range
		let results = getEntriesByDateRange(entries, "2024-01-03", "2024-01-12");
		expect(results.length).toBe(2);
		expect(results[0]?.name).toBe("Task 2");
		expect(results[1]?.name).toBe("Task 3");

		// Test inclusive range
		results = getEntriesByDateRange(entries, "2024-01-01", "2024-01-01");
		expect(results.length).toBe(1);
		expect(results[0]?.name).toBe("Task 1");

		// Test no matches
		results = getEntriesByDateRange(entries, "2024-02-01", "2024-02-28");
		expect(results.length).toBe(0);

		// Test entries without created-at
		const entriesWithMissing = [
			{ name: "Task 1", problem: "P1" },
			{ name: "Task 2", problem: "P2", "created-at": "2024-01-05" },
		] as any;
		results = getEntriesByDateRange(
			entriesWithMissing,
			"2024-01-01",
			"2024-01-10",
		);
		expect(results.length).toBe(1);
	});

	test("should get entries by agent", () => {
		const entries = [
			{ name: "Task 1", problem: "P1", "created-by-agent": "claude" },
			{ name: "Task 2", problem: "P2", "created-by-agent": "gpt-4" },
			{ name: "Task 3", problem: "P3", "created-by-agent": "claude" },
			{ name: "Task 4", problem: "P4", "created-by-agent": "cascade" },
		] as any;

		// Test exact match
		let results = getEntriesByAgent(entries, "claude");
		expect(results.length).toBe(2);
		expect(results.every((r) => r["created-by-agent"] === "claude")).toBe(true);

		// Test partial match
		results = getEntriesByAgent(entries, "gpt");
		expect(results.length).toBe(1);
		expect(results[0]?.name).toBe("Task 2");

		// Test case insensitive
		results = getEntriesByAgent(entries, "CLAUDE");
		expect(results.length).toBe(2);

		// Test no matches
		results = getEntriesByAgent(entries, "nonexistent");
		expect(results.length).toBe(0);

		// Test entries without agent
		const entriesWithMissing = [
			{ name: "Task 1", problem: "P1" },
			{ name: "Task 2", problem: "P2", "created-by-agent": "claude" },
		] as any;
		results = getEntriesByAgent(entriesWithMissing, "claude");
		expect(results.length).toBe(1);
	});

	test("should get problem patterns", () => {
		const entries = [
			{ name: "Task 1", problem: "Database connection error" },
			{ name: "Task 2", problem: "Failed to load configuration" },
			{ name: "Task 3", problem: "Bug in authentication system" },
			{ name: "Task 4", problem: "Timeout in API request" },
			{ name: "Task 5", problem: "Permission denied error" },
			{ name: "Task 6", problem: "Feature implementation" },
			{ name: "Task 7", problem: "Connection pool exhausted" },
		] as any;

		const patterns = getProblemPatterns(entries);

		// Should detect common patterns
		expect(patterns.length).toBeGreaterThan(0);

		// Check that error patterns are detected
		const errorPattern = patterns.find((p) => p.pattern === "error");
		expect(errorPattern).toBeDefined();
		expect(errorPattern?.count).toBe(2);

		// Check that connection patterns are detected
		const connectionPattern = patterns.find((p) => p.pattern === "connection");
		expect(connectionPattern).toBeDefined();
		expect(connectionPattern?.count).toBe(2);

		// Check that patterns are sorted by count (descending)
		expect(patterns[0]?.count).toBeGreaterThanOrEqual(patterns[1]?.count || 0);

		// Check that examples are included (max 3 per pattern)
		expect(errorPattern?.examples.length).toBeLessThanOrEqual(3);
		expect(errorPattern?.examples.every((ex) => typeof ex === "string")).toBe(
			true,
		);
	});

	test("should get solution suggestions", () => {
		const entries = [
			{
				name: "Task 1",
				problem: "Database connection error",
				solution: "Check connection string and retry",
				"created-by-agent": "claude",
				"created-at": "2024-01-01",
			},
			{
				name: "Task 2",
				problem: "Database timeout issue",
				solution: "Increase timeout value",
				"created-by-agent": "gpt-4",
				"created-at": "2024-01-02",
			},
			{
				name: "Task 3",
				problem: "Database connection error",
				solution: "Verify database server is running",
				"created-by-agent": "claude",
				"created-at": "2024-01-03",
			},
			{
				name: "Task 4",
				problem: "API authentication failed",
				solution: "Check API key validity",
				"created-by-agent": "cascade",
				"created-at": "2024-01-04",
			},
			{
				name: "Task 5",
				problem: "No solution provided",
				"created-by-agent": "claude",
				"created-at": "2024-01-05",
			},
		] as any;

		// Test exact match
		let suggestions = getSolutionSuggestions(
			entries,
			"Database connection error",
		);
		expect(suggestions.length).toBe(2);
		expect(suggestions.every((s) => s.solution)).toBe(true);
		expect(
			suggestions.every((s) => s.problem === "Database connection error"),
		).toBe(true);

		// Test partial match
		suggestions = getSolutionSuggestions(entries, "database");
		expect(suggestions.length).toBe(3); // Should match all database entries

		// Test structure of suggestions
		const firstSuggestion = suggestions[0];
		expect(firstSuggestion).toHaveProperty("solution");
		expect(firstSuggestion).toHaveProperty("problem");
		expect(firstSuggestion).toHaveProperty("agent");
		expect(firstSuggestion).toHaveProperty("createdAt");

		// Test no matches
		suggestions = getSolutionSuggestions(entries, "nonexistent problem");
		expect(suggestions.length).toBe(0);

		// Test limit of 5 suggestions
		const manyEntries = Array(10)
			.fill(null)
			.map((_, i) => ({
				name: `Task ${i}`,
				problem: "Similar problem",
				solution: `Solution ${i}`,
				"created-by-agent": "claude",
				"created-at": "2024-01-01",
			})) as any;
		const manySuggestions = getSolutionSuggestions(
			manyEntries,
			"Similar problem",
		);
		expect(manySuggestions.length).toBe(5);
	});

	test("should get detailed statistics", () => {
		const entries = [
			{
				name: "Task 1",
				problem: "Database error",
				solution: "Fix connection",
				tags: "bug,database",
				"created-by-agent": "claude",
				"created-at": "2024-01-01",
			},
			{
				name: "Task 2",
				problem: "Add new feature",
				solution: "Implement feature",
				tags: "feature,api",
				"created-by-agent": "gpt-4",
				"created-at": "2024-01-02",
			},
			{
				name: "Task 3",
				problem: "Fix authentication bug",
				solution: "Update auth logic",
				tags: "bug,security",
				"created-by-agent": "claude",
				"created-at": "2024-01-03",
			},
		] as any;

		const stats = getDetailedStatistics(entries);

		// Basic stats
		expect(stats.totalEntries).toBe(3);
		expect(stats.firstEntry).toBe("2024-01-01");
		expect(stats.lastEntry).toBe("2024-01-03");

		// Unique tags and agents
		expect(stats.uniqueTags).toContain("bug,database");
		expect(stats.uniqueTags).toContain("feature,api");
		expect(stats.uniqueTags).toContain("bug,security");
		expect(stats.uniqueAgents).toContain("claude");
		expect(stats.uniqueAgents).toContain("gpt-4");

		// Entries by agent
		expect(stats.entriesByAgent["claude"]).toBe(2);
		expect(stats.entriesByAgent["gpt-4"]).toBe(1);

		// Entries by tag
		expect(stats.entriesByTag["bug"]).toBe(2);
		expect(stats.entriesByTag["database"]).toBe(1);
		expect(stats.entriesByTag["feature"]).toBe(1);
		expect(stats.entriesByTag["api"]).toBe(1);
		expect(stats.entriesByTag["security"]).toBe(1);

		// Problem types
		expect(stats.problemTypes["error"]).toBe(1);
		expect(stats.problemTypes["feature"]).toBe(1);
		expect(stats.problemTypes["bug"]).toBe(1);

		// Solution types
		expect(stats.solutionTypes["fix"]).toBe(1);
		expect(stats.solutionTypes["implement"]).toBe(1);

		// Test with empty entries
		const emptyStats = getDetailedStatistics([]);
		expect(emptyStats.totalEntries).toBe(0);
		expect(emptyStats.firstEntry).toBe(null);
		expect(emptyStats.lastEntry).toBe(null);
		expect(emptyStats.uniqueTags).toEqual([]);
		expect(emptyStats.uniqueAgents).toEqual([]);
	});
});
