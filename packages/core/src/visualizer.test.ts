import { describe, expect, it } from "bun:test";
import type { LogEntry } from "./types";
import { visualizeEntry, visualizeStats, visualizeTable } from "./visualizer";

describe("visualizer", () => {
	const mockEntry1: LogEntry = {
		id: "1",
		name: "Test Entry 1",
		tags: "tag1, tag2",
		problem: "```typescript\nconst x = 1;\n```",
		solution: "Fixed x",
		action: "ts`console.log(x)`",
		files: "src/index.ts",
		"tech-stack": "typescript, bun",
		"created-at": "2024-01-01T10:00:00.000Z",
		"updated-at": "2024-01-01T11:00:00.000Z",
		model: "gpt-4",
		"created-by-agent": "true",
	};

	const mockEntry2: LogEntry = {
		id: "2",
		name: "Test Entry 2",
		problem: "Just a problem",
		"created-at": "2024-01-02T10:00:00.000Z",
	};

	// Helper to strip ANSI colors
	const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "");

	describe("highlightText", () => {
		it("should handle markdown code blocks", () => {
			const output = visualizeEntry(mockEntry1, {
				colors: true,
				highlight: true,
			});
			expect(output).toContain("\x1b[");
		});

		it("should handle custom code blocks", () => {
			const output = visualizeEntry(mockEntry1, {
				colors: true,
				highlight: true,
			});
			expect(stripAnsi(output)).toContain("console.log(x)");
		});

		it("should handle heuristic code detection", () => {
			const entry: LogEntry = {
				...mockEntry2,
				problem: "function test() { return 1; }",
			};
			const output = visualizeEntry(entry, { colors: true, highlight: true });
			expect(stripAnsi(output)).toContain("function test()");
		});

		it("should handle inline code blocks", () => {
			const entry: LogEntry = {
				...mockEntry2,
				problem: "Check the `const x = 1` part.",
			};
			const output = visualizeEntry(entry, { colors: true, highlight: true });
			expect(stripAnsi(output)).toContain("const x = 1");
		});

		it("should handle short inline code blocks by not highlighting them", () => {
			const entry: LogEntry = {
				...mockEntry2,
				problem: "Check the `abc` part.",
			};
			const output = visualizeEntry(entry, { colors: true, highlight: true });
			expect(stripAnsi(output)).toContain("`abc`");
		});

		it("should not highlight if colors/highlight disabled", () => {
			const output = visualizeEntry(mockEntry1, {
				colors: false,
				highlight: false,
			});
			expect(output).not.toContain("\x1b[");
		});
	});

	describe("visualizeTable", () => {
		it("should show empty message when no entries", () => {
			expect(stripAnsi(visualizeTable([]))).toContain("No log entries found.");
			expect(visualizeTable([], { llm: true })).toBe("No log entries found.");
		});

		it("should render multiple entries", () => {
			const output = stripAnsi(visualizeTable([mockEntry1, mockEntry2]));
			expect(output).toContain("Test Entry 1");
			expect(output).toContain("Test Entry 2");
			expect(output).toContain("Problem: Just a problem");
		});

		it("should respect compact mode", () => {
			const output = stripAnsi(visualizeTable([mockEntry1], { compact: true }));
			expect(output).toContain("Test Entry 1");
			expect(output).not.toContain("Problem:");
			expect(output).not.toContain("Solution:");
		});

		it("should respect llm mode", () => {
			const output = visualizeTable([mockEntry1], { llm: true });
			expect(output).not.toContain("═");
			expect(output).toContain("Test Entry 1");
		});

		it("should handle long text truncation", () => {
			const longEntry: LogEntry = {
				...mockEntry2,
				problem: "A".repeat(100),
			};
			const output = stripAnsi(visualizeTable([longEntry], { maxWidth: 20 }));
			expect(output).toContain("Problem: AAAAAAAAAAAAAAAAA...");
		});
	});

	describe("visualizeEntry", () => {
		it("should show all fields in detailed view", () => {
			const output = stripAnsi(visualizeEntry(mockEntry1));
			expect(output).toContain("Test Entry 1");
			expect(output).toContain("Tags: tag1, tag2");
			expect(output).toContain("Problem:");
			expect(output).toContain("Solution:");
			expect(output).toContain("Action:");
			expect(output).toContain("Files:");
			expect(output).toContain("src/index.ts");
			expect(output).toContain("Tech Stack:");
			expect(output).toContain("typescript, bun");
			expect(output).toContain("Model: gpt-4");
			expect(output).toContain("Log Created By: true");
		});

		it("should omit missing fields", () => {
			const output = stripAnsi(visualizeEntry(mockEntry2));
			expect(output).toContain("Test Entry 2");
			expect(output).not.toContain("Tags:");
			expect(output).not.toContain("Solution:");
			expect(output).not.toContain("Action:");
		});

		it("should handle llm mode for single entry", () => {
			const output = visualizeEntry(mockEntry1, { llm: true });
			expect(output).toContain("## Test Entry 1");
			expect(output).not.toContain("═");
		});
	});

	describe("visualizeStats", () => {
		it("should show correct statistics", () => {
			const output = stripAnsi(visualizeStats([mockEntry1, mockEntry2]));
			expect(output).toContain("Total Entries: 2");
			expect(output).toContain("Tag Distribution:");
			expect(output).toContain("tag1: 1");
			expect(output).toContain("tag2: 1");
			expect(output).toContain("Model Distribution:");
			expect(output).toContain("gpt-4: 1");
			expect(output).toContain("Tech Stack Distribution:");
			expect(output).toContain("typescript: 1");
			expect(output).toContain("bun: 1");
			expect(output).toContain("Entries with Solutions: 1 (50.0%)");
		});

		it("should handle empty list for stats", () => {
			const output = visualizeStats([], { llm: true });
			expect(output).toContain("Total Entries: 0");
			expect(output).toContain("Entries with Solutions: 0 (0%)");
		});
	});

	describe("helper branch coverage", () => {
		it("should handle invalid dates in formatDate", () => {
			const entry: LogEntry = {
				...mockEntry2,
				"created-at": "invalid-date",
			};
			const output = stripAnsi(visualizeEntry(entry));
			// Since new Date("invalid") doesn't throw but returns "Invalid Date"
			expect(output).toContain("Created: Invalid Date");
		});
	});
});
