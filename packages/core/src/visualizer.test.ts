import { describe, expect, it } from "bun:test";
import type { LogEntry } from "./types";
import { visualizeEntry } from "./visualizer";

describe("Visualizer Highlight", () => {
	const mockEntry: LogEntry = {
		name: "Test Entry",
		tags: "test",
		problem: "```typescript\nconst x: number = 1;\n```",
		solution: "Fixed the code",
		action: "ts`console.log(1)`",
		"created-at": new Date().toISOString(),
		model: "test-model",
	};

	it("should include ANSI escape codes when highlight is enabled", () => {
		const output = visualizeEntry(mockEntry, { colors: true, highlight: true });
		// ANSI escape code for colors usually starts with \x1b[
		expect(output).toContain("\x1b[");
	});

	it("should not include ANSI escape codes for the code block when highlight is disabled", () => {
		// Note: the headers might still have colors if colors: true,
		// but highlight: false should mean highlightText returns raw text.
		const output = visualizeEntry(mockEntry, {
			colors: false,
			highlight: false,
		});
		expect(output).not.toContain("\x1b[");
		expect(output).toContain("const x: number = 1;");
	});

	// The character \x1b represents the ESC (Escape) control character
	// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional to strip ANSI codes
	const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "");

	it("should handle custom code blocks", () => {
		const output = visualizeEntry(mockEntry, { colors: true, highlight: true });
		// The ts`code` block should be processed
		expect(stripAnsi(output)).toContain("console.log(1)");
	});

	it("should handle heuristic code detection", () => {
		const entryWithCode: LogEntry = {
			...mockEntry,
			problem: "function test() { return 1; }",
		};
		const output = visualizeEntry(entryWithCode, {
			colors: true,
			highlight: true,
		});
		expect(stripAnsi(output)).toContain("function test()");
	});
});
