export interface LogEntry {
	name: string;
	tags: string;
	problem: string;
	solution: string;
	action: string;
	"created-at": string;
	"updated-at"?: string;
	model?: string;
	"created-by-agent"?: string;
	files?: string;
	"tech-stack"?: string;
}

export interface ParsedCode {
	language: string;
	code: string;
}
