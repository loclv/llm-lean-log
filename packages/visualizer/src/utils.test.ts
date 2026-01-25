import { describe, expect, it } from "bun:test";
import { extractCode, formatDate, parseTags } from "./utils";

describe("extractCode", () => {
	it("should extract code and language from pattern lang`code`", () => {
		const result = extractCode("ts`const x = 1;`");
		expect(result).toEqual({
			language: "ts",
			code: "const x = 1;",
		});
	});

	it("should handle uppercase language prefixes", () => {
		const result = extractCode("JS`console.log('hello');`");
		expect(result).toEqual({
			language: "js",
			code: "console.log('hello');",
		});
	});

	it("should extract inline code from text", () => {
		const result = extractCode("some text: python`print('hello')`");
		expect(result).toEqual({
			language: "python",
			code: "print('hello')",
		});
	});

	it("should return null for invalid patterns", () => {
		expect(extractCode("no code here")).toBeNull();
		expect(extractCode("")).toBeNull();
		expect(extractCode(undefined)).toBeNull();
	});

	it("should handle multiline code", () => {
		const code = "function test() {\n  return true;\n}";
		const result = extractCode(`js\`${code}\``);
		expect(result).toEqual({
			language: "js",
			code,
		});
	});
});

describe("parseTags", () => {
	it("should split comma-separated tags", () => {
		const result = parseTags("tag1,tag2,tag3");
		expect(result).toEqual(["tag1", "tag2", "tag3"]);
	});

	it("should trim whitespace from tags", () => {
		const result = parseTags(" tag1 , tag2 , tag3 ");
		expect(result).toEqual(["tag1", "tag2", "tag3"]);
	});

	it("should filter out empty tags", () => {
		const result = parseTags("tag1,,tag2, ,tag3");
		expect(result).toEqual(["tag1", "tag2", "tag3"]);
	});

	it("should return empty array for falsy input", () => {
		expect(parseTags("")).toEqual([]);
		expect(parseTags(undefined)).toEqual([]);
	});

	it("should handle single tag", () => {
		const result = parseTags("single");
		expect(result).toEqual(["single"]);
	});
});

describe("formatDate", () => {
	it("should format valid date string", () => {
		const dateStr = "2024-01-15T10:30:00Z";
		const result = formatDate(dateStr);
		expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
	});

	it("should return empty string for falsy input", () => {
		expect(formatDate("")).toBe("");
		expect(formatDate(undefined as unknown as string)).toBe("");
	});

	it("should handle invalid date strings", () => {
		const invalidDate = "not-a-date";
		const result = formatDate(invalidDate);
		expect(result).toBe(invalidDate);
	});
});
