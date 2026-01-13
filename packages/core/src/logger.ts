/**
 * Logger functions for llm-lean-log
 * Handles creating, reading, and writing log entries using functional programming
 */

import { csvToLogEntries, logEntriesToCSV } from "./csv-utils";
import { generateUUID } from "./graph-utils";
import type { LogEntry } from "./types";

/**
 * Load existing logs from file
 */
export async function loadLogs(filePath: string): Promise<LogEntry[]> {
	try {
		const file = Bun.file(filePath);
		const exists = await file.exists();

		if (!exists) {
			return [];
		}

		const content = await file.text();
		return csvToLogEntries(content);
	} catch (error) {
		console.error("Error loading logs:", error);
		return [];
	}
}

/**
 * Save logs to file
 */
export async function saveLogs(
	filePath: string,
	entries: LogEntry[],
): Promise<void> {
	try {
		const csv = logEntriesToCSV(entries);
		await Bun.write(filePath, csv);
	} catch (error) {
		console.error("Error saving logs:", error);
		throw error;
	}
}

/**
 * Create a new log entry
 */
export function createLogEntry(
	entry: Omit<LogEntry, "id" | "created-at"> & {
		id?: string;
		"created-at"?: string;
	},
): LogEntry {
	return {
		...entry,
		id: entry.id ?? generateUUID(),
		"created-at": entry["created-at"] ?? new Date().toISOString(),
	};
}

/**
 * Add a new log entry to the list
 */
export function addLogEntry(
	entries: LogEntry[],
	entry: Omit<LogEntry, "id" | "created-at"> & {
		id?: string;
		"created-at"?: string;
	},
): LogEntry[] {
	return [...entries, createLogEntry(entry)];
}

/**
 * Update an existing log entry by index
 */
export function updateLogEntry(
	entries: LogEntry[],
	index: number,
	updates: Partial<LogEntry>,
): LogEntry[] {
	if (index < 0 || index >= entries.length) {
		throw new Error(`Invalid index: ${index}`);
	}

	const current = entries[index];
	if (!current) {
		throw new Error(`Entry not found at index: ${index}`);
	}

	const updatedEntry: LogEntry = {
		...current,
		...updates,
		// Preserve required fields - use update value if provided, otherwise keep current
		id: updates.id ?? current.id,
		name: updates.name ?? current.name,
		problem: updates.problem ?? current.problem,
		"created-at": updates["created-at"] ?? current["created-at"],
		"updated-at": new Date().toISOString(),
	};

	return entries.map((entry, i) => (i === index ? updatedEntry : entry));
}

/**
 * Get log entries filtered by tags
 */
export function filterByTags(entries: LogEntry[], tags: string[]): LogEntry[] {
	return entries.filter((entry) => {
		if (!entry.tags) return false;

		const entryTags = entry.tags.split(",").map((t) => t.trim());
		return tags.some((tag) => entryTags.includes(tag));
	});
}

/**
 * Search log entries by name or problem
 */
export function searchLogs(entries: LogEntry[], query: string): LogEntry[] {
	const lowerQuery = query.toLowerCase();

	return entries.filter((entry) => {
		return (
			entry.name.toLowerCase().includes(lowerQuery) ||
			entry.problem?.toLowerCase().includes(lowerQuery) ||
			entry.solution?.toLowerCase().includes(lowerQuery) ||
			entry.files?.toLowerCase().includes(lowerQuery) ||
			entry["tech-stack"]?.toLowerCase().includes(lowerQuery)
		);
	});
}
