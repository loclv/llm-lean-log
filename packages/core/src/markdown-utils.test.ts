import { describe, expect, it } from "bun:test";
import {
	formatLogEntryForMarkdown,
	getMarkdownFilename,
	sanitizeFilename,
} from "./markdown-utils";
import type { LogEntry } from "./types";

describe("markdown-utils", () => {
	describe("sanitizeFilename", () => {
		it("should convert to lowercase and replace spaces with hyphens", () => {
			expect(sanitizeFilename("Hello World")).toBe("hello-world");
		});

		it("should remove special characters", () => {
			expect(sanitizeFilename("Fix: Bug #123!")).toBe("fix-bug-123");
		});

		it("should handle multiple hyphens", () => {
			expect(sanitizeFilename("Test --- Name")).toBe("test-name");
		});
	});

	describe("getMarkdownFilename", () => {
		it("should format filename with date and sanitized name", () => {
			const entry: LogEntry = {
				id: "1",
				name: "Fix login bug",
				problem: "Login fails",
				"created-at": "2026-05-08T12:00:00Z",
			};
			expect(getMarkdownFilename(entry)).toBe("2026-05-08-fix-login-bug");
		});
	});

	describe("formatLogEntryForMarkdown", () => {
		it("should format entry with frontmatter and content", () => {
			const entry: LogEntry = {
				id: "uuid-123",
				name: "Refactor core",
				tags: "refactor, core",
				"tech-stack": "typescript, bun",
				problem: "Code is messy",
				solution: "Cleaned it up",
				"created-at": "2026-05-08T12:00:00Z",
				model: "gpt-4",
			};

			const output = formatLogEntryForMarkdown(entry);

			expect(output).toContain("id: uuid-123");
			expect(output).toContain("tags: [refactor, core]");
			expect(output).toContain("tech-stack: [typescript, bun]");
			expect(output).toContain("created-at: 2026-05-08");
			expect(output).toContain("# Refactor core");
			expect(output).toContain("## Problem\nCode is messy");
			expect(output).toContain("## Solution\nCleaned it up");
		});

		it("should handle linking between entries", () => {
			const entry1: LogEntry = {
				id: "id-1",
				name: "Task 1",
				problem: "P1",
				"created-at": "2026-05-01T12:00:00Z",
			};
			const entry2: LogEntry = {
				id: "id-2",
				name: "Task 2",
				problem: "P2",
				causeIds: "id-1",
				"created-at": "2026-05-02T12:00:00Z",
			};

			const output = formatLogEntryForMarkdown(entry2, [entry1, entry2]);

			expect(output).toContain("## Relationships");
			expect(output).toContain("### Causes");
			expect(output).toContain("- [[2026-05-01-task-1|Task 1]]");
		});

		it("should have exactly one trailing newline", () => {
			const entry: LogEntry = {
				id: "1",
				name: "Test",
				problem: "P",
				"created-at": "2026-05-08T12:00:00Z",
			};
			const output = formatLogEntryForMarkdown(entry);
			expect(output.endsWith("\n")).toBe(true);
			expect(output.endsWith("\n\n")).toBe(false);
		});

		it("should include git diff if provided", () => {
			const entry: LogEntry = {
				id: "1",
				name: "Test",
				problem: "P",
				"created-at": "2026-05-08T12:00:00Z",
			};
			const diff = "--- a/file.ts\n+++ b/file.ts\n+ console.log('hello');";
			const output = formatLogEntryForMarkdown(entry, [], diff);
			expect(output).toContain("## Git Diff");
			expect(output).toContain("```diff");
			expect(output).toContain(diff);
		});
	});
});
