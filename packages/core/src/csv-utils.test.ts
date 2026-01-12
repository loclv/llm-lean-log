import { describe, expect, it } from "bun:test";
import {
	CSV_HEADERS,
	csvRowToLogEntry,
	csvToLogEntries,
	logEntriesToCSV,
	logEntryToCSVRow,
} from "./csv-utils";
import type { LogEntry } from "./types";

describe("csv-utils", () => {
	const mockEntry1: LogEntry = {
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
		name: "Test Entry 2",
		tags: "tag2",
		problem: 'Problem with "quotes"',
		solution: "Multi-line\nsolution",
		action: "none",
		"created-at": "2024-01-02T00:00:00.000Z",
	};

	describe("logEntryToCSVRow", () => {
		it("should correctly escape commas and quotes", () => {
			const entry: LogEntry = {
				name: 'Test, "quoted"',
				"created-at": "2024-01-01",
			};
			const row = logEntryToCSVRow(entry);
			// "Test, ""quoted""",,,,,,,2024-01-01,,
			expect(row).toContain('"Test, ""quoted"""');
			expect(row).toContain("2024-01-01");
		});
	});

	describe("csvRowToLogEntry", () => {
		it("should parse a single row string", () => {
			const entry = csvRowToLogEntry("Entry 1,,,,,,,2024-01-01,,");
			expect(entry?.name).toBe("Entry 1");
			expect(entry?.["created-at"]).toBe("2024-01-01");
		});

		it("should return null for invalid rows", () => {
			expect(csvRowToLogEntry("")).toBeNull();
			expect(csvRowToLogEntry("MissingDate,,,,,,,,")).toBeNull();
		});
	});

	describe("csvToLogEntries", () => {
		it("should parse a simple CSV string", () => {
			const csv = [
				CSV_HEADERS.join(","),
				"Entry 1,tag1,prob1,sol1,act1,file1,stack1,2024-01-01,2024-01-01,m1,true",
			].join("\n");

			const entries = csvToLogEntries(csv);
			expect(entries).toHaveLength(1);
			expect(entries[0].name).toBe("Entry 1");
			expect(entries[0].tags).toBe("tag1");
		});

		it("should handle quoted fields with commas and newlines", () => {
			const csv = [
				CSV_HEADERS.join(","),
				'"Entry, with comma","tag1,tag2","Problem\nwith\nnewline",sol1,act1,file1,stack1,2024-01-01,2024-01-01,m1,true',
			].join("\n");

			const entries = csvToLogEntries(csv);
			expect(entries).toHaveLength(1);
			expect(entries[0].name).toBe("Entry, with comma");
			expect(entries[0].tags).toBe("tag1,tag2");
			expect(entries[0].problem).toBe("Problem\nwith\nnewline");
		});

		it("should handle escaped quotes", () => {
			const csv = [
				CSV_HEADERS.join(","),
				'"Entry with ""quotes""","tag1","prob1",sol1,act1,file1,stack1,2024-01-01,2024-01-01,m1,true',
			].join("\n");

			const entries = csvToLogEntries(csv);
			expect(entries).toHaveLength(1);
			expect(entries[0].name).toBe('Entry with "quotes"');
		});

		it("should filter out entries missing required fields", () => {
			const csv = [
				CSV_HEADERS.join(","),
				"Entry 1,tag1,prob1,sol1,act1,file1,stack1,,2024-01-01,m1,true", // missing created-at
				",tag1,prob1,sol1,act1,file1,stack1,2024-01-01,2024-01-01,m1,true", // missing name
				"Entry 2,tag1,prob1,sol1,act1,file1,stack1,2024-01-01,2024-01-01,m1,true", // valid
			].join("\n");

			const entries = csvToLogEntries(csv);
			expect(entries).toHaveLength(1);
			expect(entries[0].name).toBe("Entry 2");
		});

		it("should handle empty or header-only CSV", () => {
			expect(csvToLogEntries("")).toEqual([]);
			expect(csvToLogEntries(CSV_HEADERS.join(","))).toEqual([]);
		});

		it("should handle extra whitespace in headers and values", () => {
			const csv = " name , created-at \n Entry 1 , 2024-01-01 ";
			const entries = csvToLogEntries(csv);
			expect(entries).toHaveLength(1);
			expect(entries[0].name).toBe("Entry 1");
			expect(entries[0]["created-at"]).toBe("2024-01-01");
		});
	});

	describe("round-trip conversion", () => {
		it("should maintain data integrity through logEntriesToCSV -> csvToLogEntries", () => {
			const initialEntries = [mockEntry1, mockEntry2];
			const csv = logEntriesToCSV(initialEntries);
			const parsedEntries = csvToLogEntries(csv);

			expect(parsedEntries).toHaveLength(2);

			// Check first entry (full)
			expect(parsedEntries[0]).toEqual(initialEntries[0]);

			// Check second entry (partial)
			expect(parsedEntries[1].name).toBe(initialEntries[1].name);
			expect(parsedEntries[1].problem).toBe(initialEntries[1].problem);
			expect(parsedEntries[1].solution).toBe(initialEntries[1].solution);
			expect(parsedEntries[1]["created-at"]).toBe(
				initialEntries[1]["created-at"],
			);
		});
	});
});
