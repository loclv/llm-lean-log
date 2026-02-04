
import Papa from "papaparse";

import type { LogEntry } from "llm-lean-log-core";

/**
 * Parses CSV content into LogEntry array
 * @param csvContent - Raw CSV string content
 * @returns Array of parsed LogEntry objects
 */
export const parseCsvContent = (csvContent: string): LogEntry[] => {
	const normalized = csvContent.trim();
	if (!normalized) return [];

	const parsed = Papa.parse<Record<string, string>>(normalized, {
		header: true,
		skipEmptyLines: true,
	});

	if (parsed.errors.length > 0) {
		return [];
	}

	return parsed.data
		.map(
			(
				row: Record<
					| "id"
					| "name"
					| "problem"
					| "created-at"
					| "tags"
					| "solution"
					| "action"
					| "files"
					| "tech-stack"
					| "cause"
					| "causeIds"
					| "effectIds"
					| "last-commit-short-sha"
					| "updated-at"
					| "model"
					| "created-by-agent",
					string
				>,
			) => {
				const entry: Partial<LogEntry> = {
					id: row.id?.trim() ?? "",
					name: row.name?.trim() ?? "",
					problem: row.problem?.trim() ?? "",
					"created-at": row["created-at"]?.trim() ?? "",
					// Optional fields
					tags: row.tags?.trim() || undefined,
					solution: row.solution?.trim() || undefined,
					action: row.action?.trim() || undefined,
					files: row.files?.trim() || undefined,
					"tech-stack": row["tech-stack"]?.trim() || undefined,
					cause: row.cause?.trim() || undefined,
					causeIds: row.causeIds?.trim() || undefined,
					effectIds: row.effectIds?.trim() || undefined,
					"last-commit-short-sha":
						row["last-commit-short-sha"]?.trim() || undefined,
					"updated-at": row["updated-at"]?.trim() || undefined,
					model: row.model?.trim() || undefined,
					"created-by-agent": row["created-by-agent"]?.trim() || undefined,
				};

				return entry as LogEntry;
			},
		)
		.filter((entry: LogEntry) =>
			Boolean(entry.id && entry.name && entry.problem),
		);
};

/**
 * Parses a single CSV line handling quoted values
 * @param line - CSV line string
 * @returns Array of parsed values
 */
export const parseCsvLine = (line: string): string[] => {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === "," && !inQuotes) {
			result.push(current);
			current = "";
		} else {
			current += char;
		}
	}

	result.push(current);
	return result;
};

/**
 * Formats a date string into a more readable format
 * @param dateStr - Date string
 * @returns Formatted date string
 */
export const formatDate = (dateStr: string): string => {
	if (!dateStr) return "";

	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) {
		return dateStr;
	}
	return date.toLocaleString();
};

/**
 * Parses tags string into an array of strings
 * @param tags - Tags string
 * @returns Array of tag strings
 */
export const parseTags = (tags: string | undefined): string[] => {
	if (!tags) return [];
	return tags
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean);
};

/**
 * Extracts code and language from a string if it follows the pattern
 * @param text - Text to parse
 * @returns ParsedCode object or null
 */
export const extractCode = (
	text: string | undefined,
): { language: string; code: string } | null => {
	if (!text) return null;

	const codeRegex = /^([a-z]+)`([\s\S]*)`$/i;
	const match = text.match(codeRegex);

	if (match) {
		return {
			language: match[1]?.toLowerCase() ?? "",
			code: match[2]?.trim() ?? "",
		};
	}

	const inlineRegex = /([a-z]+)`([^`]+)`/i;
	const inlineMatch = text.match(inlineRegex);
	if (inlineMatch) {
		return {
			language: inlineMatch[1]?.toLowerCase() ?? "",
			code: inlineMatch[2]?.trim() ?? "",
		};
	}

	return null;
};
