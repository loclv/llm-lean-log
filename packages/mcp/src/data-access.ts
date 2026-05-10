import { readFile } from "node:fs/promises";
import { csvToLogEntries, type LogEntry } from "llm-lean-log-core";

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

export const getEntriesByTags = (
	entries: LogEntry[],
	tags: string[],
): LogEntry[] => {
	const lowerTags = tags.map((tag) => tag.toLowerCase());
	return entries.filter((entry) => {
		if (!entry.tags) return false;
		const entryTags = entry.tags.toLowerCase().split(",");
		return lowerTags.some((tag) =>
			entryTags.some((entryTag) => entryTag.trim() === tag),
		);
	});
};

export const getEntriesByDateRange = (
	entries: LogEntry[],
	startDate: string,
	endDate: string,
): LogEntry[] => {
	const start = new Date(startDate);
	const end = new Date(endDate);
	return entries.filter((entry) => {
		if (!entry["created-at"]) return false;
		const entryDate = new Date(entry["created-at"]);
		return entryDate >= start && entryDate <= end;
	});
};

export const getEntriesByAgent = (
	entries: LogEntry[],
	agent: string,
): LogEntry[] => {
	const lowerAgent = agent.toLowerCase();
	return entries.filter((entry) =>
		entry["created-by-agent"]?.toLowerCase().includes(lowerAgent),
	);
};

export const getProblemPatterns = (
	entries: LogEntry[],
): Array<{
	pattern: string;
	count: number;
	examples: string[];
}> => {
	const patterns: Record<string, { count: number; examples: string[] }> = {};

	entries.forEach((entry) => {
		if (!entry.problem) return;

		// Extract common patterns from problem descriptions
		const problem = entry.problem.toLowerCase();

		// Look for common error patterns
		const errorPatterns = [
			"error",
			"failed",
			"bug",
			"issue",
			"problem",
			"exception",
			"timeout",
			"connection",
			"auth",
			"permission",
			"not found",
			"undefined",
			"null",
			"missing",
			"invalid",
		];

		errorPatterns.forEach((pattern) => {
			if (problem.includes(pattern)) {
				if (!patterns[pattern]) {
					patterns[pattern] = { count: 0, examples: [] };
				}
				patterns[pattern].count++;
				if (patterns[pattern].examples.length < 3) {
					patterns[pattern].examples.push(entry.problem);
				}
			}
		});
	});

	return Object.entries(patterns)
		.map(([pattern, data]) => ({ pattern, ...data }))
		.sort((a, b) => b.count - a.count);
};

export const getSolutionSuggestions = (
	entries: LogEntry[],
	problem: string,
): Array<{
	solution: string;
	problem: string;
	agent: string;
	createdAt: string;
}> => {
	const lowerProblem = problem.toLowerCase();
	const similarProblems = entries.filter(
		(entry) =>
			entry.problem?.toLowerCase().includes(lowerProblem) ||
			lowerProblem.includes(entry.problem?.toLowerCase() || ""),
	);

	return similarProblems
		.filter((entry) => entry.solution)
		.map((entry) => ({
			solution: entry.solution!,
			problem: entry.problem!,
			agent: entry["created-by-agent"] || "unknown",
			createdAt: entry["created-at"] || "unknown",
		}))
		.slice(0, 5); // Return top 5 suggestions
};

export const getDetailedStatistics = (entries: LogEntry[]) => {
	const stats = {
		totalEntries: entries.length,
		lastEntry: entries[entries.length - 1]?.["created-at"] || null,
		firstEntry: entries[0]?.["created-at"] || null,
		uniqueTags: [
			...new Set(
				entries.map((e) => e.tags).filter((tag): tag is string => Boolean(tag)),
			),
		],
		uniqueAgents: [
			...new Set(
				entries
					.map((e) => e["created-by-agent"])
					.filter((agent): agent is string => Boolean(agent)),
			),
		],
		entriesByAgent: {} as Record<string, number>,
		entriesByTag: {} as Record<string, number>,
		problemTypes: {} as Record<string, number>,
		solutionTypes: {} as Record<string, number>,
	};

	entries.forEach((entry) => {
		// Count by agent
		const agent = entry["created-by-agent"] || "unknown";
		stats.entriesByAgent[agent] = (stats.entriesByAgent[agent] || 0) + 1;

		// Count by tags
		if (entry.tags) {
			const tags = entry.tags.split(",").map((tag) => tag.trim());
			tags.forEach((tag) => {
				stats.entriesByTag[tag] = (stats.entriesByTag[tag] || 0) + 1;
			});
		}

		// Count problem types
		if (entry.problem) {
			const problemLower = entry.problem.toLowerCase();
			const problemType = problemLower.includes("error")
				? "error"
				: problemLower.includes("bug")
					? "bug"
					: problemLower.includes("feature")
						? "feature"
						: problemLower.includes("performance")
							? "performance"
							: problemLower.includes("security")
								? "security"
								: "other";
			stats.problemTypes[problemType] =
				(stats.problemTypes[problemType] || 0) + 1;
		}

		// Count solution types
		if (entry.solution) {
			const solutionLower = entry.solution.toLowerCase();
			const solutionType = solutionLower.includes("fix")
				? "fix"
				: solutionLower.includes("add")
					? "add"
					: solutionLower.includes("update")
						? "update"
						: solutionLower.includes("remove")
							? "remove"
							: solutionLower.includes("implement")
								? "implement"
								: "other";
			stats.solutionTypes[solutionType] =
				(stats.solutionTypes[solutionType] || 0) + 1;
		}
	});

	return stats;
};
