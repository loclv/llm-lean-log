import { describe, expect, it } from "bun:test";
import {
	CSV_HEADERS,
	csvRowToLogEntry,
	csvToLogEntries,
	logEntriesToCSV,
	logEntryToCSVRow,
} from "./csv-utils";
import type { LogEntry } from "./types";

/**
 * Unit tests for CSV utilities
 */
describe("csv-utils", () => {
	const mockEntry1: LogEntry = {
		id: "test-id-1",
		name: "Test Entry 1",
		tags: "test,tag1",
		problem: "Something is wrong",
		solution: "Fixed it",
		action: "ts`console.log(1)`",
		files: "src/index.ts",
		"tech-stack": "typescript",
		"created-at": "2024-01-01T00:00:00.000Z",
		"updated-at": "2024-01-01T00:00:00.000Z",
		model: "gpt-4",
		"log-created-modal": "true",
	};

	const mockEntry2: LogEntry = {
		id: "test-id-2",
		name: "Test Entry 2",
		tags: "tag2",
		problem: 'Problem with "quotes"',
		solution: "Multi-line\nsolution",
		action: "none",
		"created-at": "2024-01-02T00:00:00.000Z",
	};

	/**
	 * Tests for logEntryToCSVRow
	 */
	describe("logEntryToCSVRow", () => {
		it("should correctly escape commas and quotes", () => {
			const entry: LogEntry = {
				id: "test-escape",
				name: 'Test, "quoted"',
				problem: "Test problem",
				"created-at": "2024-01-01",
			};
			const row = logEntryToCSVRow(entry);
			// CSV order: id,name,tags,problem,solution,action,files,tech-stack,causeIds,effectIds,created-at,updated-at,model,log-created-modal
			expect(row).toBe(
				'test-escape,"Test, ""quoted""",,Test problem,,,,,,,2024-01-01,,,',
			);
		});

		it("should handle newline in values", () => {
			const entry: LogEntry = {
				id: "test-newline",
				name: "Multi-line",
				problem: "Line 1\nLine 2",
				"created-at": "2024-01-01",
			};
			const row = logEntryToCSVRow(entry);
			expect(row).toBe(
				'test-newline,Multi-line,,"Line 1\nLine 2",,,,,,,2024-01-01,,,',
			);
		});

		it("should handle all fields", () => {
			const row = logEntryToCSVRow(mockEntry1);
			const expected = [
				"test-id-1", // id
				"Test Entry 1",
				'"test,tag1"',
				"Something is wrong",
				"Fixed it",
				"ts`console.log(1)`",
				"src/index.ts",
				"typescript",
				"", // causeIds
				"", // effectIds
				"2024-01-01T00:00:00.000Z",
				"2024-01-01T00:00:00.000Z",
				"gpt-4",
				"true",
			].join(",");
			expect(row).toBe(expected);
		});
	});

	/**
	 * Tests for csvRowToLogEntry
	 */
	describe("csvRowToLogEntry", () => {
		it("should parse a simple row string", () => {
			const entry = csvRowToLogEntry(
				"test-id,Entry 1,,Prob 1,,,,,,,2024-01-01,,,",
			);
			expect(entry?.name).toBe("Entry 1");
			expect(entry?.problem).toBe("Prob 1");
			expect(entry?.["created-at"]).toBe("2024-01-01");
		});

		it("should parse quoted fields with commas", () => {
			const testRow =
				'test-id2,"Name, with comma",,"Prob, with comma",,,,,,,2024-01-01,,,';
			const entry = csvRowToLogEntry(testRow);
			expect(entry?.name).toBe("Name, with comma");
			expect(entry?.problem).toBe("Prob, with comma");
		});

		it("should parse escaped quotes", () => {
			const entry = csvRowToLogEntry(
				'test-id3,"Name with ""quotes""",,Problem,,,,,,,2024-01-01,,,',
			);
			expect(entry?.name).toBe('Name with "quotes"');
		});

		it("should return null for empty or invalid rows", () => {
			expect(csvRowToLogEntry("")).toBeNull();
			expect(csvRowToLogEntry("   ")).toBeNull();
			expect(csvRowToLogEntry("NameOnly,,,,,,,,,,,,")).toBeNull(); // Missing id and created-at
		});

		it("should trim values during parsing", () => {
			const entry = csvRowToLogEntry(
				"  test-id  ,  Name 1  , , Problem 1 , , , , , , , 2024-01-01 , , , ",
			);
			expect(entry?.name).toBe("Name 1");
			expect(entry?.problem).toBe("Problem 1");
			expect(entry?.["created-at"]).toBe("2024-01-01");
		});
	});

	/**
	 * Tests for logEntriesToCSV
	 */
	describe("logEntriesToCSV", () => {
		it("should create CSV with headers and multiple rows", () => {
			const entries = [
				{ id: "e1", name: "E1", problem: "P1", "created-at": "D1" },
				{ id: "e2", name: "E2", problem: "P2", "created-at": "D2" },
			] as LogEntry[];
			const csv = logEntriesToCSV(entries);
			const lines = csv.split("\n");
			expect(lines).toHaveLength(3);
			expect(lines[0]).toBe(CSV_HEADERS.join(","));
			expect(lines[1]).toBe("e1,E1,,P1,,,,,,,D1,,,");
			expect(lines[2]).toBe("e2,E2,,P2,,,,,,,D2,,,");
		});

		it("should handle empty array", () => {
			const csv = logEntriesToCSV([]);
			expect(csv).toBe(CSV_HEADERS.join(","));
		});
	});

	/**
	 * Tests for csvToLogEntries
	 */
	describe("csvToLogEntries", () => {
		it("should parse a simple CSV string", () => {
			const csv = [
				CSV_HEADERS.join(","),
				"id1,Entry 1,tag1,prob1,sol1,act1,file1,stack1,,,2024-01-01,2024-01-01,m1,true",
			].join("\n");

			const entries = csvToLogEntries(csv);
			expect(entries).toHaveLength(1);
			expect(entries[0].name).toBe("Entry 1");
			expect(entries[0].tags).toBe("tag1");
			expect(entries[0].problem).toBe("prob1");
			expect(entries[0]["created-at"]).toBe("2024-01-01");
		});

		it("should handle CRLF line endings", () => {
			const csv = `id,name,problem,created-at\r\ntest-1,Entry 1,Prob 1,2024-01-01\r\ntest-2,Entry 2,Prob 2,2024-01-02`;
			const entries = csvToLogEntries(csv);
			expect(entries).toHaveLength(2);
			expect(entries[0].name).toBe("Entry 1");
			expect(entries[1].name).toBe("Entry 2");
		});

		it("should handle dynamic header mapping (reordered columns)", () => {
			const csv =
				"id,created-at,name,problem\ntest-1,2024-01-01,Entry 1,Prob 1";
			const entries = csvToLogEntries(csv);
			expect(entries).toHaveLength(1);
			expect(entries[0]["created-at"]).toBe("2024-01-01");
			expect(entries[0].name).toBe("Entry 1");
			expect(entries[0].problem).toBe("Prob 1");
		});

		it("should handle quoted fields with interior newlines", () => {
			const csv = [
				"id,name,problem,created-at",
				'test-1,"Entry\nmultiline","Prob\nmultiline",2024-01-01',
			].join("\n");
			const entries = csvToLogEntries(csv);
			expect(entries).toHaveLength(1);
			expect(entries[0].name).toBe("Entry\nmultiline");
			expect(entries[0].problem).toBe("Prob\nmultiline");
		});

		it("should filter out entries missing required fields", () => {
			const csv = [
				"id,name,problem,created-at",
				"test-1,Valid,P,2024-01-01",
				"test-2,,P,", // Missing name
				"test-3,,NoName,2024-01-01", // Missing name
			].join("\n");
			const entries = csvToLogEntries(csv);
			expect(entries).toHaveLength(1);
			expect(entries[0].name).toBe("Valid");
		});

		it("should handle empty or whitespace CSV", () => {
			expect(csvToLogEntries("")).toEqual([]);
			expect(csvToLogEntries("   \n   ")).toEqual([]);
		});
	});

	/**
	 * Tests for data integrity
	 */
	describe("round-trip conversion", () => {
		it("should maintain data integrity through logEntriesToCSV -> csvToLogEntries", () => {
			const initialEntries = [mockEntry1, mockEntry2];
			const csv = logEntriesToCSV(initialEntries);
			const parsedEntries = csvToLogEntries(csv);

			expect(parsedEntries).toHaveLength(2);
			expect(parsedEntries[0]).toEqual(initialEntries[0]);

			// Compare mockEntry2 (need to ensure optional fields match)
			expect(parsedEntries[1].name).toBe(initialEntries[1].name);
			expect(parsedEntries[1].problem).toBe(initialEntries[1].problem);
			expect(parsedEntries[1].solution).toBe(initialEntries[1].solution);
			expect(parsedEntries[1].action).toBe(initialEntries[1].action);
			expect(parsedEntries[1]["created-at"]).toBe(
				initialEntries[1]["created-at"],
			);
		});
	});
});
