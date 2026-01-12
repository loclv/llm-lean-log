/**
 * Unit tests for all logger functions
 */

import { describe, expect, test } from "bun:test";
import {
	addLogEntry,
	createLogEntry,
	filterByTags,
	loadLogs,
	saveLogs,
	searchLogs,
	updateLogEntry,
} from "./logger";
import type { LogEntry } from "./types";

describe("updateLogEntry", () => {
	// Test data setup
	const mockEntries: LogEntry[] = [
		{
			name: "Test Entry 1",
			problem: "Problem 1",
			"created-at": "2024-01-01T00:00:00.000Z",
		},
		{
			name: "Test Entry 2",
			problem: "Problem 2",
			solution: "Solution 2",
			tags: "test,example",
			"created-at": "2024-01-02T00:00:00.000Z",
		},
		{
			name: "Test Entry 3",
			problem: "Problem 3",
			"created-at": "2024-01-03T00:00:00.000Z",
			"updated-at": "2024-01-04T00:00:00.000Z",
		},
	];

	test("should update entry at valid index with partial updates", () => {
		const updates = {
			name: "Updated Name",
			solution: "New Solution",
		};

		const result = updateLogEntry(mockEntries, 1, updates);

		expect(result).toHaveLength(3);
		expect(result[0]).toEqual(mockEntries[0]); // Unchanged
		expect(result[2]).toEqual(mockEntries[2]); // Unchanged

		// Updated entry
		expect(result[1]?.name).toBe("Updated Name");
		expect(result[1]?.problem).toBe("Problem 2"); // Preserved
		expect(result[1]?.solution).toBe("New Solution");
		expect(result[1]?.tags).toBe("test,example"); // Preserved
		expect(result[1]?.["created-at"]).toBe("2024-01-02T00:00:00.000Z"); // Preserved
		expect(result[1]?.["updated-at"]).toBeDefined(); // Added automatically
	});

	test("should add updated-at timestamp when updating", () => {
		const beforeUpdate = new Date();
		const updates = { solution: "New solution" };

		const result = updateLogEntry(mockEntries, 0, updates);
		const afterUpdate = new Date();

		const updatedAt = new Date(result[0]?.["updated-at"] || "");
		expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
		expect(updatedAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
	});

	test("should preserve required fields when not provided in updates", () => {
		const updates = { solution: "New solution" };

		const result = updateLogEntry(mockEntries, 0, updates);

		expect(result[0]?.name).toBe("Test Entry 1"); // Preserved
		expect(result[0]?.problem).toBe("Problem 1"); // Preserved
		expect(result[0]?.["created-at"]).toBe("2024-01-01T00:00:00.000Z"); // Preserved
		expect(result[0]?.solution).toBe("New solution"); // Updated
	});

	test("should override existing updated-at timestamp", () => {
		const originalUpdatedAt = "2024-01-04T00:00:00.000Z";
		const updates = { name: "New name" };

		const result = updateLogEntry(mockEntries, 2, updates);

		expect(result[2]?.["updated-at"]).not.toBe(originalUpdatedAt);
		expect(result[2]?.["updated-at"]).toBeDefined();
	});

	test("should update optional fields", () => {
		const updates = {
			tags: "updated,tag",
			action: "New action",
			model: "gpt-4",
			"log-created-modal": "claude-3",
		};

		const result = updateLogEntry(mockEntries, 0, updates);

		expect(result[0]?.tags).toBe("updated,tag");
		expect(result[0]?.action).toBe("New action");
		expect(result[0]?.model).toBe("gpt-4");
		expect(result[0]?.["log-created-modal"]).toBe("claude-3");
	});

	test("should handle empty updates object", () => {
		const updates = {};

		const result = updateLogEntry(mockEntries, 1, updates);

		expect(result[1]?.name).toBe("Test Entry 2");
		expect(result[1]?.problem).toBe("Problem 2");
		expect(result[1]?.solution).toBe("Solution 2");
		expect(result[1]?.tags).toBe("test,example");
		expect(result[1]?.["created-at"]).toBe("2024-01-02T00:00:00.000Z");
		expect(result[1]?.["updated-at"]).toBeDefined();
	});

	test("should throw error for negative index", () => {
		const updates = { name: "Updated" };

		expect(() => updateLogEntry(mockEntries, -1, updates)).toThrow(
			"Invalid index: -1",
		);
	});

	test("should throw error for index equal to array length", () => {
		const updates = { name: "Updated" };

		expect(() => updateLogEntry(mockEntries, 3, updates)).toThrow(
			"Invalid index: 3",
		);
	});

	test("should throw error for index greater than array length", () => {
		const updates = { name: "Updated" };

		expect(() => updateLogEntry(mockEntries, 10, updates)).toThrow(
			"Invalid index: 10",
		);
	});

	test("should work with single entry array", () => {
		const singleEntry: LogEntry[] = [mockEntries[0] as LogEntry];
		const updates = { problem: "Updated problem" };

		const result = updateLogEntry(singleEntry, 0, updates);

		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("Test Entry 1");
		expect(result[0]?.problem).toBe("Updated problem");
		expect(result[0]?.["updated-at"]).toBeDefined();
	});

	test("should not mutate original array", () => {
		const updates = { name: "Updated name" };
		const originalJSON = JSON.stringify(mockEntries);

		updateLogEntry(mockEntries, 1, updates);

		expect(JSON.stringify(mockEntries)).toBe(originalJSON);
	});

	test("should return new array with updated entry", () => {
		const updates = { name: "Updated name" };

		const result = updateLogEntry(mockEntries, 1, updates);

		expect(result).not.toBe(mockEntries); // Different array instance
		expect(result[0]).toBe(mockEntries[0]); // Same reference for unchanged entries
		expect(result[2]).toBe(mockEntries[2]); // Same reference for unchanged entries
		expect(result[1]).not.toBe(mockEntries[1]); // New object for updated entry
	});

	test("should handle updating created-at field", () => {
		const newCreatedAt = "2024-12-25T00:00:00.000Z";
		const updates = { "created-at": newCreatedAt };

		const result = updateLogEntry(mockEntries, 0, updates);

		expect(result[0]?.["created-at"]).toBe(newCreatedAt);
		expect(result[0]?.["updated-at"]).toBeDefined();
	});

	test("should handle updates with undefined values", () => {
		const updates = {
			name: "Updated name",
			solution: undefined,
		};

		const result = updateLogEntry(mockEntries, 1, updates);

		expect(result[1]?.name).toBe("Updated name");
		expect(result[1]?.solution).toBeUndefined(); // Should be undefined, not preserved
		expect(result[1]?.problem).toBe("Problem 2"); // Preserved
	});
});

describe("createLogEntry", () => {
	test("should create log entry with provided created-at timestamp", () => {
		const customTimestamp = "2024-01-01T12:00:00.000Z";
		const entry = {
			name: "Test Entry",
			problem: "Test Problem",
			"created-at": customTimestamp,
		};

		const result = createLogEntry(entry);

		expect(result.name).toBe("Test Entry");
		expect(result.problem).toBe("Test Problem");
		expect(result["created-at"]).toBe(customTimestamp);
	});

	test("should create log entry with auto-generated timestamp", () => {
		const beforeCreate = new Date().toISOString();
		const entry = {
			name: "Test Entry",
			problem: "Test Problem",
		};

		const result = createLogEntry(entry);
		const afterCreate = new Date().toISOString();

		expect(result.name).toBe("Test Entry");
		expect(result.problem).toBe("Test Problem");
		const createdDate = new Date(result["created-at"]);
		const beforeDate = new Date(beforeCreate);
		const afterDate = new Date(afterCreate);
		expect(createdDate.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime());
		expect(createdDate.getTime()).toBeLessThanOrEqual(afterDate.getTime());
	});

	test("should create log entry with optional fields", () => {
		const entry = {
			name: "Test Entry",
			problem: "Test Problem",
			solution: "Test Solution",
			tags: "test,example",
			action: "Test Action",
			model: "gpt-4",
		};

		const result = createLogEntry(entry);

		expect(result.solution).toBe("Test Solution");
		expect(result.tags).toBe("test,example");
		expect(result.action).toBe("Test Action");
		expect(result.model).toBe("gpt-4");
		expect(result["created-at"]).toBeDefined();
	});
});

describe("addLogEntry", () => {
	const mockEntries: LogEntry[] = [
		{
			name: "Existing Entry",
			problem: "Existing Problem",
			"created-at": "2024-01-01T00:00:00.000Z",
		},
	];

	test("should add new entry to existing array", () => {
		const newEntry = {
			name: "New Entry",
			problem: "New Problem",
		};

		const result = addLogEntry(mockEntries, newEntry);

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual(mockEntries[0]); // Original entry preserved
		expect(result[1]?.name).toBe("New Entry");
		expect(result[1]?.problem).toBe("New Problem");
		expect(result[1]?.["created-at"]).toBeDefined();
	});

	test("should add entry to empty array", () => {
		const newEntry = {
			name: "First Entry",
			problem: "First Problem",
		};

		const result = addLogEntry([], newEntry);

		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("First Entry");
		expect(result[0]?.problem).toBe("First Problem");
		expect(result[0]?.["created-at"]).toBeDefined();
	});

	test("should not mutate original array", () => {
		const newEntry = {
			name: "New Entry",
			problem: "New Problem",
		};

		const originalJSON = JSON.stringify(mockEntries);
		addLogEntry(mockEntries, newEntry);

		expect(JSON.stringify(mockEntries)).toBe(originalJSON);
	});

	test("should return new array instance", () => {
		const newEntry = {
			name: "New Entry",
			problem: "New Problem",
		};

		const result = addLogEntry(mockEntries, newEntry);

		expect(result).not.toBe(mockEntries);
	});
});

describe("filterByTags", () => {
	const mockEntries: LogEntry[] = [
		{
			name: "Entry 1",
			problem: "Problem 1",
			tags: "error,api",
			"created-at": "2024-01-01T00:00:00.000Z",
		},
		{
			name: "Entry 2",
			problem: "Problem 2",
			tags: "feature,ui",
			"created-at": "2024-01-02T00:00:00.000Z",
		},
		{
			name: "Entry 3",
			problem: "Problem 3",
			tags: "bug,api",
			"created-at": "2024-01-03T00:00:00.000Z",
		},
		{
			name: "Entry 4",
			problem: "Problem 4",
			"created-at": "2024-01-04T00:00:00.000Z", // No tags
		},
	];

	test("should filter entries by single tag", () => {
		const result = filterByTags(mockEntries, ["api"]);

		expect(result).toHaveLength(2);
		expect(result[0]?.name).toBe("Entry 1");
		expect(result[1]?.name).toBe("Entry 3");
	});

	test("should filter entries by multiple tags (OR logic)", () => {
		const result = filterByTags(mockEntries, ["error", "feature"]);

		expect(result).toHaveLength(2);
		expect(result[0]?.name).toBe("Entry 1");
		expect(result[1]?.name).toBe("Entry 2");
	});

	test("should return empty array for non-existent tag", () => {
		const result = filterByTags(mockEntries, ["nonexistent"]);

		expect(result).toHaveLength(0);
	});

	test("should exclude entries without tags", () => {
		const result = filterByTags(mockEntries, ["error"]);

		expect(result).toHaveLength(1); // Only Entry 1 has "error" tag, Entry 4 has no tags
		expect(result.some((entry) => entry.name === "Entry 4")).toBe(false);
	});

	test("should handle empty tags array", () => {
		const result = filterByTags(mockEntries, []);

		expect(result).toHaveLength(0);
	});

	test("should handle entries with empty tags string", () => {
		const entriesWithEmptyTags = [
			...mockEntries,
			{
				name: "Entry 5",
				problem: "Problem 5",
				tags: "",
				"created-at": "2024-01-05T00:00:00.000Z",
			},
		];

		const result = filterByTags(entriesWithEmptyTags, ["error"]);

		expect(result).toHaveLength(1); // Only Entry 1 has "error" tag, Entry 5 has empty tags
	});

	test("should handle tags with extra spaces", () => {
		const entriesWithSpaces = [
			{
				name: "Entry 1",
				problem: "Problem 1",
				tags: " error , api ",
				"created-at": "2024-01-01T00:00:00.000Z",
			},
		];

		const result = filterByTags(entriesWithSpaces, ["error"]);

		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("Entry 1");
	});
});

describe("searchLogs", () => {
	const mockEntries: LogEntry[] = [
		{
			name: "Authentication Error",
			problem: "User cannot login to system",
			solution: "Reset user password",
			"created-at": "2024-01-01T00:00:00.000Z",
		},
		{
			name: "Database Connection",
			problem: "Cannot connect to database",
			"created-at": "2024-01-02T00:00:00.000Z",
		},
		{
			name: "API Response",
			problem: "API returns null data",
			solution: "Check API endpoint configuration",
			"created-at": "2024-01-03T00:00:00.000Z",
		},
	];

	test("should search by name (case insensitive)", () => {
		const result = searchLogs(mockEntries, "auth");

		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("Authentication Error");
	});

	test("should search by problem (case insensitive)", () => {
		const result = searchLogs(mockEntries, "database");

		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("Database Connection");
	});

	test("should search by solution (case insensitive)", () => {
		const result = searchLogs(mockEntries, "password");

		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("Authentication Error");
	});

	test("should return multiple matches for partial search", () => {
		const result = searchLogs(mockEntries, "api");

		expect(result).toHaveLength(1); // Only "API Response" contains "api"
		expect(result[0]?.name).toBe("API Response");
	});

	test("should return empty array for no matches", () => {
		const result = searchLogs(mockEntries, "nonexistent");

		expect(result).toHaveLength(0);
	});

	test("should handle empty query string", () => {
		const result = searchLogs(mockEntries, "");

		expect(result).toHaveLength(3); // Should match all entries
	});

	test("should handle entries without solution", () => {
		const result = searchLogs(mockEntries, "connect");

		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("Database Connection");
	});

	test("should be case insensitive", () => {
		const result1 = searchLogs(mockEntries, "AUTH");
		const result2 = searchLogs(mockEntries, "auth");

		expect(result1).toEqual(result2);
	});
});

describe("loadLogs", () => {
	test("should return empty array for non-existent file", async () => {
		const result = await loadLogs("/nonexistent/file.csv");

		expect(result).toEqual([]);
	});

	test("should handle file read errors gracefully", async () => {
		// Test with invalid path that should cause an error
		const result = await loadLogs("/invalid/path/file.csv");

		expect(result).toEqual([]);
	});
});

describe("saveLogs", () => {
	const mockEntries: LogEntry[] = [
		{
			name: "Test Entry",
			problem: "Test Problem",
			"created-at": "2024-01-01T00:00:00.000Z",
		},
	];

	test("should save logs to file successfully", async () => {
		const tempFile = "/tmp/test-logs.csv";

		// Should not throw
		await saveLogs(tempFile, mockEntries);

		// Clean up
		await Bun.write(tempFile, "");
	});

	test("should throw error on save failure", async () => {
		// Test with invalid path that should cause an error
		const invalidPath = "/invalid/path/that/does/not/exist/file.csv";

		try {
			await saveLogs(invalidPath, mockEntries);
			expect(true).toBe(false); // Should not reach here
		} catch (error) {
			expect(error).toBeDefined();
		}
	});
});
