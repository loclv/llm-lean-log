import { describe, expect, test } from "bun:test";
import { csvToLogEntries, logEntriesToCSV } from "./csv-utils";
import type { LogEntry } from "./types";

describe("Migration from old CSV format - last-commit-short-sha column", () => {
	test("should handle loading old CSV without last-commit-short-sha column and saving with it", () => {
		// 1. Simulate old CSV content (no 'last-commit-short-sha' column)
		const oldHeader = "id,name,problem,created-at";
		const oldRow = "1,Old Entry,Old Problem,2024-01-01T00:00:00.000Z";
		const oldCsv = `${oldHeader}\n${oldRow}`;

		// 2. Load it
		const entries = csvToLogEntries(oldCsv);

		// Verify load
		expect(entries).toHaveLength(1);
		expect(entries[0].name).toBe("Old Entry");
		expect(entries[0]["last-commit-short-sha"]).toBeUndefined();

		// 3. Add new entry with last-commit-short-sha
		const newEntry: LogEntry = {
			id: "2",
			name: "New Entry",
			problem: "New Problem",
			"last-commit-short-sha": "abc1234",
			"created-at": "2024-01-02T00:00:00.000Z",
		};
		const allEntries = [...entries, newEntry];

		// 4. Save (convert to CSV)
		const newCsv = logEntriesToCSV(allEntries);

		// 5. Verify structure
		const lines = newCsv.split("\n");
		const newHeaders = lines[0].split(",");

		// Should have 'last-commit-short-sha' in header
		expect(newHeaders).toContain("last-commit-short-sha");

		// Parse back to check data integrity
		const reloadedEntries = csvToLogEntries(newCsv);

		expect(reloadedEntries).toHaveLength(2);

		// Old entry should still exist, with undefined last-commit-short-sha
		const reloadedOld = reloadedEntries.find((e) => e.id === "1");
		expect(reloadedOld).toBeDefined();
		expect(reloadedOld?.name).toBe("Old Entry");
		expect(reloadedOld?.["last-commit-short-sha"]).toBeUndefined();

		// New entry should have last-commit-short-sha
		const reloadedNew = reloadedEntries.find((e) => e.id === "2");
		expect(reloadedNew).toBeDefined();
		expect(reloadedNew?.["last-commit-short-sha"]).toBe("abc1234");
	});

	test("should handle CSV with last-commit-short-sha column in different positions", () => {
		// Simulate a CSV with columns in different order
		const csv =
			"id,last-commit-short-sha,name,problem,created-at\n1,def5678,Test Name,Test Problem,2024-01-01T00:00:00.000Z";

		const entries = csvToLogEntries(csv);

		expect(entries).toHaveLength(1);
		expect(entries[0].name).toBe("Test Name");
		expect(entries[0]["last-commit-short-sha"]).toBe("def5678");
	});

	test("should preserve last-commit-short-sha when upgrading from old format with mixed entries", () => {
		// 1. Old format entries (no last-commit-short-sha)
		const oldHeader = "id,name,problem,created-at";
		const oldRows = [
			"1,Task 1,Problem 1,2024-01-01T00:00:00.000Z",
			"2,Task 2,Problem 2,2024-01-02T00:00:00.000Z",
			"3,Task 3,Problem 3,2024-01-03T00:00:00.000Z",
		];
		const oldCsv = `${oldHeader}\n${oldRows.join("\n")}`;

		// 2. Load old entries
		const entries = csvToLogEntries(oldCsv);
		expect(entries).toHaveLength(3);

		// 3. Add new entry with SHA
		const newEntry: LogEntry = {
			id: "4",
			name: "Task 4",
			problem: "Problem 4",
			"last-commit-short-sha": "sha1234",
			"created-at": "2024-01-04T00:00:00.000Z",
		};

		// 4. Update one existing entry with SHA
		entries[1]["last-commit-short-sha"] = "sha5678";

		const allEntries = [...entries, newEntry];

		// 5. Save and reload
		const newCsv = logEntriesToCSV(allEntries);
		const reloadedEntries = csvToLogEntries(newCsv);

		expect(reloadedEntries).toHaveLength(4);

		// Entry 1: no SHA
		expect(reloadedEntries[0]["last-commit-short-sha"]).toBeUndefined();

		// Entry 2: has SHA (updated)
		expect(reloadedEntries[1]["last-commit-short-sha"]).toBe("sha5678");

		// Entry 3: no SHA
		expect(reloadedEntries[2]["last-commit-short-sha"]).toBeUndefined();

		// Entry 4: has SHA (new)
		expect(reloadedEntries[3]["last-commit-short-sha"]).toBe("sha1234");
	});

	test("should handle empty last-commit-short-sha values", () => {
		// CSV with explicit empty last-commit-short-sha
		const csv = `id,name,problem,last-commit-short-sha,created-at
1,Entry 1,Problem 1,,2024-01-01T00:00:00.000Z
2,Entry 2,Problem 2,abc1234,2024-01-02T00:00:00.000Z`;

		const entries = csvToLogEntries(csv);

		expect(entries).toHaveLength(2);
		// Empty string becomes undefined in parsed entry
		expect(entries[0]["last-commit-short-sha"]).toBeUndefined();
		expect(entries[1]["last-commit-short-sha"]).toBe("abc1234");
	});
});
