/**
 * Visualizer for llm-lean-log
 * Displays logs in a human-readable format
 */

import type { LogEntry } from "./types";

interface VisualizerOptions {
	/** Show full details or compact view */
	compact?: boolean;
	/** Maximum width for columns */
	maxWidth?: number;
	/** Color output */
	colors?: boolean;
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
 * Visualize log entries in a table format
 */
export function visualizeTable(
	entries: LogEntry[],
	options: VisualizerOptions = {},
): string {
	const { compact = false, maxWidth = 50, colors: useColors = true } = options;

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
			lines.push(
				colorize("  Problem: ", "yellow", useColors) +
					truncate(entry.problem, maxWidth),
			);
		}

		// Solution
		if (entry.solution && !compact) {
			lines.push(
				colorize("  Solution: ", "green", useColors) +
					truncate(entry.solution, maxWidth),
			);
		}

		// Action
		if (entry.action && !compact) {
			lines.push(
				colorize("  Action: ", "magenta", useColors) +
					truncate(entry.action, maxWidth),
			);
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
	const { colors: useColors = true } = options;

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
		lines.push(entry.problem);
		lines.push("");
	}

	if (entry.solution) {
		lines.push(colorize("Solution:", "green", useColors));
		lines.push(entry.solution);
		lines.push("");
	}

	if (entry.action) {
		lines.push(colorize("Action:", "magenta", useColors));
		lines.push(entry.action);
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

	if (entry["log-created-modal"]) {
		lines.push(`  Log Created By: ${entry["log-created-modal"]}`);
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
