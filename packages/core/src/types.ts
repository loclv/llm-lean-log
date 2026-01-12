/**
 * Core types for llm-lean-log
 */

export interface LogEntry {
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
	/** When the log was created. (required) */
	"created-at": string;
	/** When the log was updated (optional). */
	"updated-at"?: string;
	/** Model that was used (optional). */
	model?: string;
	/** Model that was used to create the log (optional). */
	"log-created-modal"?: string;
}
