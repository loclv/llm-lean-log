import { describe, expect, it } from "bun:test";
import type { LogEntry } from "./types";
import {
	jsonlToLogEntries,
	logEntriesToJSONL,
	logEntryToJSONL,
	loadLogsFromJSONL,
	saveLogsToJSONL,
} from "./jsonl-utils";

describe("jsonl-utils", () => {
	const mockEntry: LogEntry = {
		id: "test-id-123",
		name: "Test Task",
		problem: "Test problem description",
		solution: "Test solution",
		tags: "test,unit",
		"created-at": "2023-01-01T00:00:00Z",
		"created-by-agent": "test-agent",
	};

	const mockEntries: LogEntry[] = [
		mockEntry,
		{
			...mockEntry,
			id: "test-id-456",
			name: "Another Test Task",
			problem: "Another test problem",
			tags: "test,another",
		},
	];

	describe("logEntryToJSONL", () => {
		it("should convert a log entry to JSONL string", () => {
			const result = logEntryToJSONL(mockEntry);
			expect(result).toBe(JSON.stringify(mockEntry));
		});
	});

	describe("logEntriesToJSONL", () => {
		it("should convert multiple log entries to JSONL string", () => {
			const result = logEntriesToJSONL(mockEntries);
			const lines = result.split("\n");
			expect(lines).toHaveLength(2);
			expect(lines[0]).toBe(JSON.stringify(mockEntries[0]));
			expect(lines[1]).toBe(JSON.stringify(mockEntries[1]));
		});

		it("should handle empty array", () => {
			const result = logEntriesToJSONL([]);
			expect(result).toBe("");
		});

		it("should handle single entry", () => {
			const result = logEntriesToJSONL([mockEntry]);
			expect(result).toBe(JSON.stringify(mockEntry));
		});
	});

	describe("jsonlToLogEntries", () => {
		it("should parse JSONL string to log entries", () => {
			const jsonl = logEntriesToJSONL(mockEntries);
			const result = jsonlToLogEntries(jsonl);
			expect(result).toEqual(mockEntries);
		});

		it("should handle empty JSONL string", () => {
			const result = jsonlToLogEntries("");
			expect(result).toEqual([]);
		});

		it("should handle JSONL string with empty lines", () => {
			const jsonl = `${JSON.stringify(mockEntry)}\n\n${JSON.stringify(mockEntries[1])}`;
			const result = jsonlToLogEntries(jsonl);
			expect(result).toEqual([mockEntry, mockEntries[1]]);
		});

		it("should throw error for invalid JSON", () => {
			const invalidJsonl = "invalid json\n" + JSON.stringify(mockEntry);
			expect(() => jsonlToLogEntries(invalidJsonl)).toThrow("Invalid JSONL line");
		});
	});

	describe("saveLogsToJSONL and loadLogsFromJSONL", () => {
		const testFilePath = "/tmp/test-logs.jsonl";

		it("should save and load logs from JSONL file", async () => {
			try {
				// Save to file
				await saveLogsToJSONL(testFilePath, mockEntries);

				// Load from file
				const loadedEntries = await loadLogsFromJSONL(testFilePath);
				expect(loadedEntries).toEqual(mockEntries);
			} finally {
				// Clean up
				try {
					await Bun.file(testFilePath).delete();
				} catch {
					// Ignore cleanup errors
				}
			}
		});

		it("should handle empty array when saving", async () => {
			try {
				// Save empty array
				await saveLogsToJSONL(testFilePath, []);

				// Load empty array
				const loadedEntries = await loadLogsFromJSONL(testFilePath);
				expect(loadedEntries).toEqual([]);
			} finally {
				// Clean up
				try {
					await Bun.file(testFilePath).delete();
				} catch {
					// Ignore cleanup errors
				}
			}
		});

		it("should throw error when loading non-existent file", async () => {
			const nonExistentFile = "/tmp/non-existent.jsonl";
			expect(loadLogsFromJSONL(nonExistentFile)).rejects.toThrow("JSONL file not found");
		});
	});

	describe("round-trip conversion", () => {
		it("should maintain data integrity through round-trip conversion", () => {
			const jsonl = logEntriesToJSONL(mockEntries);
			const parsedEntries = jsonlToLogEntries(jsonl);
			expect(parsedEntries).toEqual(mockEntries);
		});

		it("should handle special characters in data", () => {
			const specialEntry: LogEntry = {
				...mockEntry,
				name: 'Test with "quotes" and \n newlines',
				problem: 'Special chars: \t "test" /path/to/file',
				tags: "test,special,with,commas",
			};

			const jsonl = logEntryToJSONL(specialEntry);
			const parsed = jsonlToLogEntries(jsonl)[0];
			expect(parsed).toEqual(specialEntry);
		});
	});
});
