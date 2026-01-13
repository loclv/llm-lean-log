/**
 * Visualizer for llm-lean-log
 * Displays logs in a human-readable format
 */

import { highlight } from "cli-highlight";
import type { LogEntry } from "./types";

interface VisualizerOptions {
	/** Show full details or compact view */
	compact?: boolean;
	/** Maximum width for columns */
	maxWidth?: number;
	/** Color output */
	colors?: boolean;
	/** Enable syntax highlighting for code blocks */
	highlight?: boolean;
}

// ANSI color codes
const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	gray: "\x1b[90m",
};

function colorize(
	text: string,
	color: keyof typeof colors,
	useColors: boolean,
): string {
	if (!useColors) return text;
	return `${colors[color]}${text}${colors.reset}`;
}

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 3)}...`;
}

function formatDate(dateStr: string): string {
	try {
		const date = new Date(dateStr);
		return date.toLocaleString();
	} catch {
		return dateStr;
	}
}

/**
 * Detects and highlights code blocks in text
 */
function highlightText(text: string, useColors: boolean): string {
	if (!useColors) return text;

	let result = text;

	// 1. Markdown code blocks: ```lang\ncode\n```
	const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
	if (codeBlockRegex.test(text)) {
		codeBlockRegex.lastIndex = 0;
		result = result.replace(codeBlockRegex, (match, lang, code) => {
			try {
				return highlight(code.trim(), {
					language: lang || "typescript",
					ignoreIllegals: true,
				});
			} catch (_e) {
				return match;
			}
		});
	}

	// 2. Custom code blocks: lang`code` (as seen in some examples)
	const customBlockRegex =
		/\b(ts|js|json|bash|sql|html|css|py|python|sh)`([^`]+)`/gi;
	if (customBlockRegex.test(result)) {
		customBlockRegex.lastIndex = 0;
		result = result.replace(customBlockRegex, (match, lang, code) => {
			const languageMap: Record<string, string> = {
				ts: "typescript",
				js: "javascript",
				py: "python",
				sh: "bash",
			};
			try {
				return highlight(code, {
					language: languageMap[lang.toLowerCase()] || lang.toLowerCase(),
					ignoreIllegals: true,
				});
			} catch (_e) {
				return match;
			}
		});
	}

	// 3. Heuristic: If the whole text looks like a code block (starts with common keywords)
	const codeKeywords = [
		"import ",
		"export ",
		"function ",
		"const ",
		"class ",
		"interface ",
		"type ",
		"public ",
		"private ",
		"async ",
	];
	const trimmed = text.trim();
	if (
		result === text && // Only if we haven't already replaced blocks
		codeKeywords.some((kw) => trimmed.startsWith(kw))
	) {
		try {
			return highlight(text, { language: "typescript", ignoreIllegals: true });
		} catch (_e) {
			return text;
		}
	}

	// 4. Inline code blocks: `code` (only if long enough or contains code-like chars)
	const inlineCodeRegex = /`([^`\n]{3,})`/g;
	if (inlineCodeRegex.test(result)) {
		inlineCodeRegex.lastIndex = 0;
		result = result.replace(inlineCodeRegex, (match, code) => {
			// Only highlight if it looks slightly like code or is long
			if (code.length > 10 || /[:;{}[\]()=]/.test(code)) {
				try {
					return highlight(code, { ignoreIllegals: true });
				} catch (_e) {
					return match;
				}
			}
			return match;
		});
	}

	return result;
}

/**
 * Visualize log entries in a table format
 */
export function visualizeTable(
	entries: LogEntry[],
	options: VisualizerOptions = {},
): string {
	const {
		compact = false,
		maxWidth = 50,
		colors: useColors = true,
		highlight: useHighlight = true,
	} = options;

	if (entries.length === 0) {
		return colorize("No log entries found.", "gray", useColors);
	}

	const lines: string[] = [];

	// Header
	lines.push(colorize("═".repeat(80), "cyan", useColors));
	lines.push(colorize("  LLM Lean Log Entries", "bright", useColors));
	lines.push(colorize("═".repeat(80), "cyan", useColors));
	lines.push("");

	entries.forEach((entry, index) => {
		// Entry header
		lines.push(
			colorize(`[${index + 1}] `, "gray", useColors) +
				colorize(entry.name, "bright", useColors) +
				(entry.tags ? colorize(` (${entry.tags})`, "blue", useColors) : ""),
		);

		// Problem
		if (entry.problem && !compact) {
			const text = truncate(entry.problem, maxWidth);
			lines.push(
				colorize("  Problem: ", "yellow", useColors) +
					(useHighlight ? highlightText(text, useColors) : text),
			);
		}

		// Solution
		if (entry.solution && !compact) {
			const text = truncate(entry.solution, maxWidth);
			lines.push(
				colorize("  Solution: ", "green", useColors) +
					(useHighlight ? highlightText(text, useColors) : text),
			);
		}

		// Action
		if (entry.action && !compact) {
			const text = truncate(entry.action, maxWidth);
			lines.push(
				colorize("  Action: ", "magenta", useColors) +
					(useHighlight ? highlightText(text, useColors) : text),
			);
		}

		// Files
		if (entry.files && !compact) {
			const text = truncate(entry.files, maxWidth);
			lines.push(colorize("  Files: ", "cyan", useColors) + text);
		}

		// Tech Stack
		if (entry["tech-stack"] && !compact) {
			const text = truncate(entry["tech-stack"], maxWidth);
			lines.push(colorize("  Tech Stack: ", "blue", useColors) + text);
		}

		// Metadata
		const metadata: string[] = [];
		metadata.push(
			colorize("Created: ", "dim", useColors) + formatDate(entry["created-at"]),
		);

		if (entry["updated-at"]) {
			metadata.push(
				colorize("Updated: ", "dim", useColors) +
					formatDate(entry["updated-at"]),
			);
		}

		if (entry.model) {
			metadata.push(colorize("Model: ", "dim", useColors) + entry.model);
		}

		lines.push(colorize(`  ${metadata.join(" | ")}`, "gray", useColors));
		lines.push("");
	});

	lines.push(colorize("─".repeat(80), "gray", useColors));
	lines.push(colorize(`Total: ${entries.length} entries`, "dim", useColors));

	return lines.join("\n");
}

/**
 * Visualize a single log entry in detail
 */
export function visualizeEntry(
	entry: LogEntry,
	options: VisualizerOptions = {},
): string {
	const { colors: useColors = true, highlight: useHighlight = true } = options;

	const lines: string[] = [];

	lines.push(colorize("═".repeat(80), "cyan", useColors));
	lines.push(colorize(`  ${entry.name}`, "bright", useColors));
	lines.push(colorize("═".repeat(80), "cyan", useColors));
	lines.push("");

	if (entry.tags) {
		lines.push(colorize("Tags: ", "blue", useColors) + entry.tags);
		lines.push("");
	}

	if (entry.problem) {
		lines.push(colorize("Problem:", "yellow", useColors));
		lines.push(
			useHighlight ? highlightText(entry.problem, useColors) : entry.problem,
		);
		lines.push("");
	}

	if (entry.solution) {
		lines.push(colorize("Solution:", "green", useColors));
		lines.push(
			useHighlight ? highlightText(entry.solution, useColors) : entry.solution,
		);
		lines.push("");
	}

	if (entry.action) {
		lines.push(colorize("Action:", "magenta", useColors));
		lines.push(
			useHighlight ? highlightText(entry.action, useColors) : entry.action,
		);
		lines.push("");
	}

	if (entry.files) {
		lines.push(colorize("Files:", "cyan", useColors));
		lines.push(entry.files);
		lines.push("");
	}

	if (entry["tech-stack"]) {
		lines.push(colorize("Tech Stack:", "blue", useColors));
		lines.push(entry["tech-stack"]);
		lines.push("");
	}

	lines.push(colorize("Metadata:", "dim", useColors));
	lines.push(`  Created: ${formatDate(entry["created-at"])}`);

	if (entry["updated-at"]) {
		lines.push(`  Updated: ${formatDate(entry["updated-at"])}`);
	}

	if (entry.model) {
		lines.push(`  Model: ${entry.model}`);
	}

	if (entry["created-by-agent"]) {
		lines.push(`  Log Created By: ${entry["created-by-agent"]}`);
	}

	return lines.join("\n");
}

/**
 * Visualize log statistics
 */
export function visualizeStats(
	entries: LogEntry[],
	options: VisualizerOptions = {},
): string {
	const { colors: useColors = true } = options;

	const lines: string[] = [];

	lines.push(colorize("═".repeat(80), "cyan", useColors));
	lines.push(colorize("  Log Statistics", "bright", useColors));
	lines.push(colorize("═".repeat(80), "cyan", useColors));
	lines.push("");

	// Total entries
	lines.push(colorize("Total Entries: ", "bright", useColors) + entries.length);
	lines.push("");

	// Tag distribution
	const tagCounts = new Map<string, number>();
	entries.forEach((entry) => {
		if (entry.tags) {
			entry.tags.split(",").forEach((tag) => {
				const trimmedTag = tag.trim();
				tagCounts.set(trimmedTag, (tagCounts.get(trimmedTag) || 0) + 1);
			});
		}
	});

	if (tagCounts.size > 0) {
		lines.push(colorize("Tag Distribution:", "blue", useColors));
		const sortedTags = Array.from(tagCounts.entries()).sort(
			(a, b) => b[1] - a[1],
		);
		sortedTags.forEach(([tag, count]) => {
			lines.push(`  ${tag}: ${count}`);
		});
		lines.push("");
	}

	// Model distribution
	const modelCounts = new Map<string, number>();
	entries.forEach((entry) => {
		if (entry.model) {
			modelCounts.set(entry.model, (modelCounts.get(entry.model) || 0) + 1);
		}
	});

	if (modelCounts.size > 0) {
		lines.push(colorize("Model Distribution:", "magenta", useColors));
		const sortedModels = Array.from(modelCounts.entries()).sort(
			(a, b) => b[1] - a[1],
		);
		sortedModels.forEach(([model, count]) => {
			lines.push(`  ${model}: ${count}`);
		});
		lines.push("");
	}

	// Tech stack distribution
	const techCounts = new Map<string, number>();
	entries.forEach((entry) => {
		if (entry["tech-stack"]) {
			entry["tech-stack"].split(",").forEach((tech) => {
				const trimmedTech = tech.trim();
				techCounts.set(trimmedTech, (techCounts.get(trimmedTech) || 0) + 1);
			});
		}
	});

	if (techCounts.size > 0) {
		lines.push(colorize("Tech Stack Distribution:", "cyan", useColors));
		const sortedTech = Array.from(techCounts.entries()).sort(
			(a, b) => b[1] - a[1],
		);
		sortedTech.forEach(([tech, count]) => {
			lines.push(`  ${tech}: ${count}`);
		});
		lines.push("");
	}

	// Entries with solutions
	const withSolutions = entries.filter((e) => e.solution).length;
	const solutionRate =
		entries.length > 0
			? ((withSolutions / entries.length) * 100).toFixed(1)
			: "0";

	lines.push(
		`${colorize("Entries with Solutions: ", "green", useColors)}${withSolutions} (${solutionRate}%)`,
	);

	return lines.join("\n");
}
