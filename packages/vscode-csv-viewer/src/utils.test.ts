import { describe, expect, it } from "bun:test";
import {
	extractCode,
	formatDate,
	parseCsvContent,
	parseCsvLine,
	parseTags,
} from "./utils";

describe("parseCsvLine", () => {
	it("should parse simple CSV line", () => {
		const result = parseCsvLine("a,b,c");
		expect(result).toEqual(["a", "b", "c"]);
	});

	it("should parse CSV line with quoted values", () => {
		const result = parseCsvLine('"a,b",c,"d"');
		expect(result).toEqual(["a,b", "c", "d"]);
	});

	it("should handle empty values", () => {
		const result = parseCsvLine("a,,c");
		expect(result).toEqual(["a", "", "c"]);
	});

	it("should handle single value", () => {
		const result = parseCsvLine("a");
		expect(result).toEqual(["a"]);
	});
});

describe("parseTags", () => {
	it("should parse comma-separated tags", () => {
		const result = parseTags("error,api,auth");
		expect(result).toEqual(["error", "api", "auth"]);
	});

	it("should handle empty string", () => {
		const result = parseTags("");
		expect(result).toEqual([]);
	});

	it("should handle undefined", () => {
		const result = parseTags(undefined);
		expect(result).toEqual([]);
	});

	it("should trim whitespace", () => {
		const result = parseTags("  error  ,  api  ");
		expect(result).toEqual(["error", "api"]);
	});

	it("should filter empty strings", () => {
		const result = parseTags("error,,api,");
		expect(result).toEqual(["error", "api"]);
	});
});

describe("formatDate", () => {
	it("should format valid date string", () => {
		const result = formatDate("2024-01-15T10:30:00Z");
		expect(result).toBeTruthy();
		expect(typeof result).toBe("string");
	});

	it("should return empty string for empty input", () => {
		const result = formatDate("");
		expect(result).toBe("");
	});

	it("should return original string for invalid date", () => {
		const result = formatDate("invalid-date");
		expect(result).toBe("invalid-date");
	});
});

describe("extractCode", () => {
	it("should extract code with language prefix", () => {
		const result = extractCode("ts`console.log('hello')`");
		expect(result).toEqual({
			language: "ts",
			code: "console.log('hello')",
		});
	});

	it("should handle javascript code", () => {
		const result = extractCode("js`const x = 1;`");
		expect(result).toEqual({
			language: "js",
			code: "const x = 1;",
		});
	});

	it("should return null for undefined input", () => {
		const result = extractCode(undefined);
		expect(result).toBeNull();
	});

	it("should return null for text without code pattern", () => {
		const result = extractCode("This is just text");
		expect(result).toBeNull();
	});

	it("should handle inline code pattern", () => {
		const result = extractCode("Run ts`console.log('test')` to test");
		expect(result).toEqual({
			language: "ts",
			code: "console.log('test')",
		});
	});
});

describe("parseCsvContent", () => {
	it("should parse valid CSV content", () => {
		const csv = `id,name,problem,solution,created-at
1,Test Entry,This is a problem,This is a solution,2024-01-15T10:00:00Z`;

		const result = parseCsvContent(csv);
		expect(result.length).toBe(1);
		const entry = result[0];
		if (!entry) throw new Error("Entry is undefined");

		expect(entry.id).toBe("1");
		expect(entry.name).toBe("Test Entry");
		expect(entry.problem).toBe("This is a problem");
		expect(entry.solution).toBe("This is a solution");
	});

	it("should return empty array for CSV with no data rows", () => {
		const csv = `id,name,problem,solution,created-at`;
		const result = parseCsvContent(csv);
		expect(result).toEqual([]);
	});

	it("should return empty array for empty content", () => {
		const result = parseCsvContent("");
		expect(result).toEqual([]);
	});

	it("should skip rows with missing required fields", () => {
		const csv = `id,name,problem,solution,created-at
1,Test,Problem,Solution,2024-01-15
,Missing ID,Problem,Solution,2024-01-15`;

		const result = parseCsvContent(csv);
		expect(result.length).toBe(1);
		const entry = result[0];
		if (!entry) throw new Error("Entry is undefined");
		expect(entry.id).toBe("1");
	});

	it("should handle multiple rows", () => {
		const csv = `id,name,problem,solution,created-at
1,Entry 1,Problem 1,Solution 1,2024-01-15T10:00:00Z
2,Entry 2,Problem 2,Solution 2,2024-01-16T10:00:00Z`;

		const result = parseCsvContent(csv);
		expect(result.length).toBe(2);
		const entry1 = result[0];
		const entry2 = result[1];
		if (!entry1 || !entry2) throw new Error("Entries are undefined");

		expect(entry1.name).toBe("Entry 1");
		expect(entry2.name).toBe("Entry 2");
	});

	it("should handle optional fields", () => {
		const csv = `id,name,problem,tags,tech-stack,created-at
1,Test,Problem,error,typescript,2024-01-15T10:00:00Z`;

		const result = parseCsvContent(csv);
		expect(result.length).toBe(1);
		const entry = result[0];
		if (!entry) throw new Error("Entry is undefined");

		expect(entry.tags).toBe("error");
		expect(entry["tech-stack"]).toBe("typescript");
	});

	it("should handle quoted values", () => {
		const csv = `id,name,problem,solution,created-at
1,"Entry, with, commas","Problem, here","Solution, here",2024-01-15T10:00:00Z`;

		const result = parseCsvContent(csv);
		expect(result.length).toBe(1);
		const entry = result[0];
		if (!entry) throw new Error("Entry is undefined");

		expect(entry.name).toBe("Entry, with, commas");
		expect(entry.problem).toBe("Problem, here");
	});

	it("should parse all fields correctly", () => {
		const csv = `id,name,problem,tags,solution,action,files,tech-stack,cause,causeIds,effectIds,last-commit-short-sha,created-at,updated-at,model,created-by-agent
1,Test Name,Test Problem,"tag1,tag2",Test Solution,Test Action,"file1.ts,file2.ts",typescript,cause of problem,"c1,c2","e1,e2",a1b2c3d,2024-01-01T00:00:00Z,2024-01-02T00:00:00Z,gpt-4,agent-1`;

		const result = parseCsvContent(csv);
		expect(result.length).toBe(1);
		const entry = result[0];
		if (!entry) {
			throw new Error("Entry is undefined");
		}

		expect(entry.id).toBe("1");
		expect(entry.name).toBe("Test Name");
		expect(entry.problem).toBe("Test Problem");
		expect(entry.tags).toBe("tag1,tag2");
		expect(entry.solution).toBe("Test Solution");
		expect(entry.action).toBe("Test Action");
		expect(entry.files).toBe("file1.ts,file2.ts");
		expect(entry["tech-stack"]).toBe("typescript");
		expect(entry.cause).toBe("cause of problem");
		expect(entry.causeIds).toBe("c1,c2");
		expect(entry.effectIds).toBe("e1,e2");
		expect(entry["last-commit-short-sha"]).toBe("a1b2c3d");
		expect(entry["created-at"]).toBe("2024-01-01T00:00:00Z");
		expect(entry["updated-at"]).toBe("2024-01-02T00:00:00Z");
		expect(entry.model).toBe("gpt-4");
		expect(entry["created-by-agent"]).toBe("agent-1");
	});
});
