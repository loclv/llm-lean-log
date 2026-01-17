import { describe, expect, it } from "bun:test";
import { csvRowToLogEntry, logEntryToCSVRow } from "./csv-utils";
import { parseIds } from "./graph-utils";
import type { LogEntry } from "./types";

describe("Tags Wrapping Review", () => {
	it("should automatically wrap multiple tags in quotes when generating CSV", () => {
		const entry: LogEntry = {
			id: "1",
			name: "test",
			problem: "problem",
			"created-at": "date",
			tags: "tag1,tag2",
		};
		const row = logEntryToCSVRow(entry);
		// We expect the tags field (3rd field) to be "tag1,tag2"
		// headers: id,name,tags,...
		expect(row).toContain('"tag1,tag2"');
	});

	it("should not wrap single tag in quotes", () => {
		const entry: LogEntry = {
			id: "1",
			name: "test",
			problem: "problem",
			"created-at": "date",
			tags: "tag1",
		};
		const row = logEntryToCSVRow(entry);
		expect(row).not.toContain('"tag1"');
		expect(row).toContain("tag1");
	});

	it("should parse multiple tags correctly (stripping CSV quotes)", () => {
		// Construct a CSV row with quoted tags
		// id,name,tags,...
		const row = '1,test,"tag1,tag2",problem,,,,,,,,,,,';
		const entry = csvRowToLogEntry(row);
		expect(entry?.tags).toBe("tag1,tag2");

		// And then parseIds should work
		const parsedTags = parseIds(entry?.tags);
		expect(parsedTags).toEqual(["tag1", "tag2"]);
	});

	it("should parse single tag correctly", () => {
		const row = "1,test,tag1,problem,,,,,,,,,,,";
		const entry = csvRowToLogEntry(row);
		expect(entry?.tags).toBe("tag1");

		const parsedTags = parseIds(entry?.tags);
		expect(parsedTags).toEqual(["tag1"]);
	});
});
