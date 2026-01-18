import { csvToLogEntries, type LogEntry } from "llm-lean-log-core";
import { readFile } from "node:fs/promises";

export const loadEntries = async (filePath: string): Promise<LogEntry[]> => {
	try {
		const content = await readFile(filePath, "utf-8");
		return csvToLogEntries(content);
	} catch (error) {
		// If file doesn't exist, return empty
		if ((error as { code: string }).code === "ENOENT") {
			return [];
		}
		console.error(`Error reading logs from ${filePath}:`, error);
		throw error;
	}
};

export const getLastNEntries = (entries: LogEntry[], n: number): LogEntry[] => {
	// Return most recent entries (from end of file)
	// Returned in reverse chronological order (newest first) for context window optimization
	return entries.slice(-n).reverse();
};

export const searchEntries = (
	entries: LogEntry[],
	query: string,
): LogEntry[] => {
	const lowerQuery = query.toLowerCase();
	return entries.filter((entry) => {
		return (
			entry.problem?.toLowerCase().includes(lowerQuery) ||
			entry.solution?.toLowerCase().includes(lowerQuery) ||
			entry.tags?.toLowerCase().includes(lowerQuery) ||
			entry.name?.toLowerCase().includes(lowerQuery) ||
			entry.action?.toLowerCase().includes(lowerQuery)
		);
	});
};

export const getEntriesByTask = (
	entries: LogEntry[],
	taskName: string,
): LogEntry[] => {
	const lowerTask = taskName.toLowerCase();
	return entries.filter((entry) =>
		entry.name?.toLowerCase().includes(lowerTask),
	);
};
