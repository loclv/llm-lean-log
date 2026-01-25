import type { ParsedCode } from "./types";

/**
 * Extracts code and language from a string if it follows the pattern:
 * <lang>`<code>` or just appears to have a code prefix.
 * For this project, we check for common language prefixes like ts, js, python, etc.
 */
export const extractCode = (text: string | undefined): ParsedCode | null => {
	if (!text) return null;

	// Simple heuristic: check if it starts with a known language prefix and has backticks
	// or if it's explicitly marked.
	// The example had "ts`..." pattern or similar.
	const codeRegex = /^([a-z]+)`([\s\S]*)`$/i;
	const match = text.match(codeRegex);

	if (match) {
		return {
			language: match[1].toLowerCase(),
			code: match[2].trim(),
		};
	}

	// Check for inline code like "some text: ts`code`"
	const inlineRegex = /([a-z]+)`([^`]+)`/i;
	const inlineMatch = text.match(inlineRegex);
	if (inlineMatch) {
		return {
			language: inlineMatch[1].toLowerCase(),
			code: inlineMatch[2].trim(),
		};
	}

	return null;
};

/**
 * Parses tags string into an array of strings.
 */
export const parseTags = (tags: string | undefined): string[] => {
	if (!tags) return [];
	return tags
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean);
};

/**
 * Formats a date string into a more readable format.
 */
export const formatDate = (dateStr: string): string => {
	if (!dateStr) return "";
	try {
		return new Date(dateStr).toLocaleString();
	} catch (err) {
		console.error("Failed to parse date:", dateStr, err);
		return dateStr;
	}
};

/**
 * Fetches git diff content by log UUID.
 * @param logId - The UUID of the log entry
 * @returns Promise resolving to diff content string or null if not found
 */
export const fetchDiffByLogId = async (
	logId: string,
): Promise<string | null> => {
	try {
		const response = await fetch(`/api/diff/${logId}`);
		if (response.ok) {
			return await response.text();
		}
		return null;
	} catch (error) {
		console.error("Failed to fetch diff:", error);
		return null;
	}
};
