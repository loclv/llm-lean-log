/**
 * Core types for llm-lean-log
 */

export interface LogEntry {
	/** Log ID (required), UUID for unique identifier, used for Directed Graph, cause and effect */
	id: string;
	/** Main content of the log (short). (required) */
	name: string;
	/** Tags to categorize the log, comma separated. Example: error,api,auth. (optional) */
	tags?: string;
	/** Description of the problem, context of the log. (required) */
	problem: string;
	/** Description of the solution, method to fix the problem. (optional) */
	solution?: string;
	/** Run command, action (web search, etc.) that was taken to fix the problem. (optional) */
	action?: string;
	/** List of files that were modified, created, deleted or must be read (optional). */
	files?: string;
	/** List of technologies that were used (optional). */
	"tech-stack"?: string;
	/** Cause log ID of the log (optional). Format: comma separated list of other log IDs */
	causeIds?: string;
	/** Effect log ID of the log (optional). Format: comma separated list of other log IDs */
	effectIds?: string;
	/** Last git commit short SHA of the log (optional). Example: a1b2c3d */
	"last-commit-short-sha"?: string;
	/** When the log was created. (required) */
	"created-at": string;
	/** When the log was updated (optional). */
	"updated-at"?: string;
	/** Model that was used (optional). */
	model?: string;
	/** Model that was used to create the log (optional). */
	"created-by-agent"?: string;
}
