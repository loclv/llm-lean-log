import type { LogEntry } from "./types";

/**
 * Sanitize a string to be used as a filename
 * @param str - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeFilename(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Format a LogEntry as a Markdown note
 * @param entry - Log entry to format
 * @param allEntries - All entries (for linking)
 * @returns Markdown string
 */
export function formatLogEntryForMarkdown(
	entry: LogEntry,
	allEntries: LogEntry[] = [],
	diff?: string,
): string {
	const tags = entry.tags
		? entry.tags.split(",").map((t) => t.trim())
		: [];
	const techStack = entry["tech-stack"]
		? entry["tech-stack"].split(",").map((t) => t.trim())
		: [];

	const date = entry["created-at"] ? entry["created-at"].split("T")[0] : "";

	let frontmatter = "---\n";
	frontmatter += `id: ${entry.id}\n`;
	frontmatter += `title: "${entry.name.replace(/"/g, '\\"')}"\n`;
	if (tags.length > 0) frontmatter += `tags: [${tags.join(", ")}]\n`;
	if (techStack.length > 0)
		frontmatter += `tech-stack: [${techStack.join(", ")}]\n`;
	frontmatter += `created-at: ${date}\n`;
	if (entry.model) frontmatter += `model: ${entry.model}\n`;
	if (entry["created-by-agent"])
		frontmatter += `created-by-agent: ${entry["created-by-agent"]}\n`;
	frontmatter += "---\n\n";

	let content = `# ${entry.name}\n\n`;

	content += "## Problem\n";
	content += `${entry.problem}\n\n`;

	if (entry.solution) {
		content += "## Solution\n";
		content += `${entry.solution}\n\n`;
	}

	if (entry.action) {
		content += "## Action\n";
		content += `${entry.action}\n\n`;
	}

	if (entry.cause) {
		content += "## Cause\n";
		content += `${entry.cause}\n\n`;
	}

	if (entry.files) {
		content += "## Files Involved\n";
		content += `${entry.files
			.split(",")
			.map((f) => `- ${f.trim()}`)
			.join("\n")}\n\n`;
	}

	// Linking
	if (entry.causeIds || entry.effectIds) {
		content += "## Relationships\n";

		if (entry.causeIds) {
			const causeIds = entry.causeIds.split(",").map((id) => id.trim());
			content += "### Causes\n";
			for (const id of causeIds) {
				const causeEntry = allEntries.find((e) => e.id === id);
				if (causeEntry) {
					content += `- [[${getMarkdownFilename(causeEntry)}|${causeEntry.name}]]\n`;
				} else {
					content += `- ${id} (not found)\n`;
				}
			}
			content += "\n";
		}

		if (entry.effectIds) {
			const effectIds = entry.effectIds.split(",").map((id) => id.trim());
			content += "### Effects\n";
			for (const id of effectIds) {
				const effectEntry = allEntries.find((e) => e.id === id);
				if (effectEntry) {
					content += `- [[${getMarkdownFilename(effectEntry)}|${effectEntry.name}]]\n`;
				} else {
					content += `- ${id} (not found)\n`;
				}
			}
			content += "\n";
		}
	}

	if (diff) {
		content += "## Git Diff\n";
		content += "```diff\n";
		content += `${diff}\n`;
		content += "```\n\n";
	}

	return (frontmatter + content).trim() + "\n";
}

/**
 * Get the expected filename for a Markdown note
 * @param entry - Log entry
 * @returns Filename (without .md extension)
 */
export function getMarkdownFilename(entry: LogEntry): string {
	const date = entry["created-at"] ? entry["created-at"].split("T")[0] : "no-date";
	const sanitizedName = sanitizeFilename(entry.name);
	return `${date}-${sanitizedName}`;
}
