import { describe, expect, test } from "bun:test";
import { CSV_HEADERS, csvToLogEntries, logEntriesToCSV } from "./csv-utils";
import type { LogEntry } from "./types";

describe("CSV Column Order Robustness", () => {
	test("should handle CSV with columns in different orders", () => {
		// Scenario 1: Standard order
		// CSV_HEADERS defines the standard order. Let's pick a few keys to shuffle.
		// Standard: id, name, tags, problem, ...

		// Create a CSV string with a scrambled header order
		const scrambledHeader = "created-at,problem,name,id,cause";
		const scrambledRow =
			'2024-01-01T00:00:00.000Z,"Problem Description","Entry Name",12345,"Cause Description"';
		const scrambledCsv = `${scrambledHeader}\n${scrambledRow}`;

		// Parse it
		const entries = csvToLogEntries(scrambledCsv);

		// Verify correctness
		expect(entries).toHaveLength(1);
		const entry = entries[0];
		expect(entry.id).toBe("12345");
		expect(entry.name).toBe("Entry Name");
		expect(entry.problem).toBe("Problem Description");
		expect(entry.cause).toBe("Cause Description");
		expect(entry["created-at"]).toBe("2024-01-01T00:00:00.000Z");
	});

	test("should normalize column order when saving", () => {
		const entry: LogEntry = {
			id: "test-id",
			name: "Test Name",
			problem: "Test Problem",
			cause: "Test Cause",
			"created-at": "2024-01-01T12:00:00.000Z",
		};

		// Convert to CSV
		const csv = logEntriesToCSV([entry]);
		const lines = csv.split("\n");
		const headers = lines[0].split(",");

		// Verify the output follows the strict CSV_HEADERS order
		expect(headers).toEqual([...CSV_HEADERS]);

		// Verify the data row corresponds to that order
		const values = lines[1].split(",");
		const nameIndex = headers.indexOf("name");
		const causeIndex = headers.indexOf("cause");

		expect(values[nameIndex]).toBe("Test Name");
		expect(values[causeIndex]).toBe("Test Cause");
	});

	test("should handle missing optional columns gracefully", () => {
		// A CSV that is missing the 'cause' column entirely (e.g. older format)
		const partialHeader = "id,name,problem,created-at";
		const partialRow = "999,Old Name,Old Problem,2023-01-01T00:00:00.000Z";
		const partialCsv = `${partialHeader}\n${partialRow}`;

		const entries = csvToLogEntries(partialCsv);

		expect(entries).toHaveLength(1);
		expect(entries[0].name).toBe("Old Name");
		expect(entries[0].cause).toBeUndefined();
	});

	test("should handle extra unknown columns gracefully (ignore or keep appropriately)", () => {
		// Note based on current implementation: csvToLogEntries uses dynamic mapping.
		// If an extra column exists in header, it might try to put it in the object.
		// TypeScript type might not show it, but it would be on the runtime object.
		// The test checks if it crashes or behaves oddly.

		const extraHeader = "id,name,problem,created-at,extra_column";
		const extraRow = "888,Name,Problem,2024-01-01T00:00:00.000Z,SomeExtraData";
		const extraCsv = `${extraHeader}\n${extraRow}`;

		const entries = csvToLogEntries(extraCsv);

		expect(entries).toHaveLength(1);
		expect(entries[0].name).toBe("Name");
		// @ts-expect-error - testing runtime behavior for extra prop
		expect(entries[0].extra_column).toBe("SomeExtraData");
	});
});
