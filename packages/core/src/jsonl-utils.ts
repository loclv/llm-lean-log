/**
 * JSONL (JSON Lines) utilities for llm-lean-log
 */

import type { LogEntry } from "./types";

/**
 * Convert a log entry to JSONL string
 * @param entry - Log entry to convert
 * @returns JSONL string (one JSON object per line)
 */
export function logEntryToJSONL(entry: LogEntry): string {
	return JSON.stringify(entry);
}

/**
 * Convert log entries to JSONL format
 * @param entries - Array of log entries
 * @returns JSONL string (one JSON object per line)
 */
export function logEntriesToJSONL(entries: LogEntry[]): string {
	return entries.map(logEntryToJSONL).join("\n");
}

/**
 * Parse JSONL string to log entries
 * @param jsonl - JSONL string (one JSON object per line)
 * @returns Array of log entries
 */
export function jsonlToLogEntries(jsonl: string): LogEntry[] {
	const lines = jsonl.trim().split("\n");
	const entries: LogEntry[] = [];

	for (const line of lines) {
		if (line.trim() === "") {
			continue;
		}

		try {
			const entry = JSON.parse(line) as LogEntry;
			entries.push(entry);
		} catch (error) {
			console.error("Error parsing JSONL line:", line, error);
			throw new Error(`Invalid JSONL line: ${line}`);
		}
	}

	return entries;
}

/**
 * Save log entries to JSONL file
 * @param filePath - Path to the JSONL file
 * @param entries - Array of log entries
 */
export async function saveLogsToJSONL(filePath: string, entries: LogEntry[]): Promise<void> {
	try {
		const jsonlContent = logEntriesToJSONL(entries);
		await Bun.write(filePath, jsonlContent);
	} catch (error) {
		console.error("Failed to save logs to JSONL:", error);
		throw error;
	}
}

/**
 * Load log entries from JSONL file
 * @param filePath - Path to the JSONL file
 * @returns Promise resolving to array of log entries
 */
export async function loadLogsFromJSONL(filePath: string): Promise<LogEntry[]> {
	try {
		const file = Bun.file(filePath);
		if (!(await file.exists())) {
			throw new Error(`JSONL file not found: ${filePath}`);
		}

		const jsonlContent = await file.text();
		return jsonlToLogEntries(jsonlContent);
	} catch (error) {
		console.error("Failed to load logs from JSONL:", error);
		throw error;
	}
}
