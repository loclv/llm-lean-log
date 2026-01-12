/**
 * CSV utilities for llm-lean-log
 * Handles CSV parsing and stringification
 */

import type { LogEntry } from "./types";

// CSV headers in order
export const CSV_HEADERS = [
	"name",
	"tags",
	"problem",
	"solution",
	"action",
	"files",
	"tech-stack",
	"created-at",
	"updated-at",
	"model",
	"log-created-modal",
] as const;

/**
 * Escape CSV field value
 */
function escapeCSVField(value: string | undefined): string {
	if (!value) return "";

	// If the value contains comma, newline, or quotes, wrap in quotes and escape quotes
	if (value.includes(",") || value.includes("\n") || value.includes('"')) {
		return `"${value.replace(/"/g, '""')}"`;
	}

	return value;
}

/**
 * Unescape CSV field value
 */
function unescapeCSVField(value: string): string {
	if (!value) return "";

	// Remove surrounding quotes if present
	if (value.startsWith('"') && value.endsWith('"')) {
		return value.slice(1, -1).replace(/""/g, '"');
	}

	return value;
}

/**
 * Convert log entry to CSV row
 */
export function logEntryToCSVRow(entry: LogEntry): string {
	const values = CSV_HEADERS.map((header) => {
		const value = entry[header];
		return escapeCSVField(value);
	});

	return values.join(",");
}

/**
 * Parse CSV row to log entry
 */
export function csvRowToLogEntry(row: string): LogEntry | null {
	if (!row.trim()) return null;

	// Simple CSV parser that handles quoted fields
	const fields: string[] = [];
	let currentField = "";
	let inQuotes = false;

	for (let i = 0; i < row.length; i++) {
		const char = row[i];
		const nextChar = row[i + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				// Escaped quote
				currentField += '"';
				i++; // Skip next quote
			} else {
				// Toggle quote mode
				inQuotes = !inQuotes;
			}
		} else if (char === "," && !inQuotes) {
			// End of field
			fields.push(unescapeCSVField(currentField));
			currentField = "";
		} else {
			currentField += char;
		}
	}

	// Add last field
	fields.push(unescapeCSVField(currentField));

	// Map fields to log entry
	const entry: Partial<LogEntry> = {};

	CSV_HEADERS.forEach((header, index) => {
		const value = fields[index]?.trim();
		if (value) {
			entry[header] = value;
		}
	});

	// Validate required fields
	if (!entry.name || !entry["created-at"]) {
		return null;
	}

	return entry as LogEntry;
}

/**
 * Convert log entries to CSV string
 */
export function logEntriesToCSV(entries: LogEntry[]): string {
	const header = CSV_HEADERS.join(",");
	const rows = entries.map(logEntryToCSVRow);

	return [header, ...rows].join("\n");
}

/**
 * Parse CSV string to log entries
 */
export function csvToLogEntries(csv: string): LogEntry[] {
	const lines = csv.split("\n");
	if (lines.length === 0) return [];

	const headerLine = lines[0];
	if (!headerLine) return [];

	// Parse headers from the first line
	const fileHeaders = headerLine.split(",").map((h) => h.trim());

	// Skip header
	const dataLines = lines.slice(1);

	return dataLines
		.map((row) => {
			if (!row.trim()) return null;

			// Simple CSV parser that handles quoted fields
			const fields: string[] = [];
			let currentField = "";
			let inQuotes = false;

			for (let i = 0; i < row.length; i++) {
				const char = row[i];
				const nextChar = row[i + 1];

				if (char === '"') {
					if (inQuotes && nextChar === '"') {
						currentField += '"';
						i++;
					} else {
						inQuotes = !inQuotes;
					}
				} else if (char === "," && !inQuotes) {
					fields.push(unescapeCSVField(currentField));
					currentField = "";
				} else {
					currentField += char;
				}
			}
			fields.push(unescapeCSVField(currentField));

			const entry: Partial<LogEntry> = {};
			fileHeaders.forEach((header, index) => {
				const value = fields[index]?.trim();
				if (value) {
					// @ts-expect-error - dynamic header mapping
					entry[header] = value;
				}
			});

			if (!entry.name || !entry["created-at"]) return null;
			return entry as LogEntry;
		})
		.filter((entry): entry is LogEntry => entry !== null);
}
