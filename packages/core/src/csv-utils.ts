/**
 * CSV utilities for llm-lean-log
 * Handles CSV parsing and stringification
 */

import type { LogEntry } from "./types";

// CSV headers in order
export const CSV_HEADERS = [
	"id",
	"name",
	"tags",
	"problem",
	"solution",
	"action",
	"files",
	"tech-stack",
	"causeIds",
	"effectIds",
	"last-commit-short-sha",
	"created-at",
	"updated-at",
	"model",
	"created-by-agent",
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
	if (!entry.id || !entry.name || !entry.problem || !entry["created-at"]) {
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
	if (!csv.trim()) return [];

	const entries: LogEntry[] = [];
	let currentField = "";
	let inQuotes = false;
	let fields: string[] = [];
	let fileHeaders: string[] = [];
	let isHeaderRow = true;

	const requiredHeaders = ["id", "name", "problem", "created-at"];

	for (let i = 0; i < csv.length; i++) {
		const char = csv[i];
		const nextChar = csv[i + 1];

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
		} else if ((char === "\n" || char === "\r") && !inQuotes) {
			// Handle CRLF
			if (char === "\r" && nextChar === "\n") {
				i++;
			}

			fields.push(unescapeCSVField(currentField));
			currentField = "";

			if (isHeaderRow) {
				fileHeaders = fields.map((h) => h.trim());
				const missing = requiredHeaders.filter((h) => !fileHeaders.includes(h));
				if (missing.length > 0) {
					throw new Error(
						`CSV is missing required headers: ${missing.join(", ")}`,
					);
				}
				isHeaderRow = false;
			} else {
				const entry: Partial<LogEntry> = {};
				fileHeaders.forEach((header, index) => {
					const value = fields[index]?.trim();
					if (value) {
						// @ts-expect-error - dynamic header mapping
						entry[header] = value;
					}
				});

				if (entry.id && entry.name && entry.problem && entry["created-at"]) {
					entries.push(entry as LogEntry);
				}
			}
			fields = [];
		} else {
			currentField += char;
		}
	}

	// Handle last field if not ending with newline
	if (currentField || fields.length > 0) {
		fields.push(unescapeCSVField(currentField));
		if (isHeaderRow) {
			fileHeaders = fields.map((h) => h.trim());
			const missing = requiredHeaders.filter((h) => !fileHeaders.includes(h));
			if (missing.length > 0) {
				throw new Error(
					`CSV is missing required headers: ${missing.join(", ")}`,
				);
			}
		} else {
			const entry: Partial<LogEntry> = {};
			fileHeaders.forEach((header, index) => {
				const value = fields[index]?.trim();
				if (value) {
					// @ts-expect-error - dynamic header mapping
					entry[header] = value;
				}
			});
			if (entry.id && entry.name && entry.problem && entry["created-at"]) {
				entries.push(entry as LogEntry);
			}
		}
	}

	return entries;
}
