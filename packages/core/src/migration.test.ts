import { describe, expect, test } from "bun:test";
import { csvToLogEntries, logEntriesToCSV } from "./csv-utils";
import type { LogEntry } from "./types";

describe("Migration from old CSV format", () => {
	test("should handle loading old CSV without cause column and saving with it", () => {
		// 1. Simulate old CSV content (no 'cause' column)
		const oldHeader = "id,name,problem,created-at";
		const oldRow = "1,Old Entry,Old Problem,2024-01-01T00:00:00.000Z";
		const oldCsv = `${oldHeader}\n${oldRow}`;

		// 2. Load it
		const entries = csvToLogEntries(oldCsv);

		// Verify load
		expect(entries).toHaveLength(1);
		expect(entries[0].name).toBe("Old Entry");
		expect(entries[0].cause).toBeUndefined();

		// 3. Add new entry with cause
		const newEntry: LogEntry = {
			id: "2",
			name: "New Entry",
			problem: "New Problem",
			cause: "New Cause",
			"created-at": "2024-01-02T00:00:00.000Z",
		};
		const allEntries = [...entries, newEntry];

		// 4. Save (convert to CSV)
		const newCsv = logEntriesToCSV(allEntries);

		// 5. Verify structure
		const lines = newCsv.split("\n");
		const newHeaders = lines[0].split(",");

		// Should have 'cause' in header
		expect(newHeaders).toContain("cause");

		// Parse back to check data integrity
		const reloadedEntries = csvToLogEntries(newCsv);

		expect(reloadedEntries).toHaveLength(2);

		// Old entry should still exist, with undefined cause (or empty string in CSV -> undefined/empty in parsed)
		const reloadedOld = reloadedEntries.find((e) => e.id === "1");
		expect(reloadedOld).toBeDefined();
		expect(reloadedOld?.name).toBe("Old Entry");
		// csvToLogEntries trims values, empty string likely becomes undefined or empty?
		// Actually csv-utils.ts:205 checks `if (value)`, so empty string becomes undefined in the object
		expect(reloadedOld?.cause).toBeUndefined();

		// New entry should have cause
		const reloadedNew = reloadedEntries.find((e) => e.id === "2");
		expect(reloadedNew).toBeDefined();
		expect(reloadedNew?.cause).toBe("New Cause");
	});
});
