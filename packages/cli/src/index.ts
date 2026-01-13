#!/usr/bin/env bun
/**
 * CLI tool for llm-lean-log
 */

import {
	addLogEntry,
	filterByTags,
	loadLogs,
	saveLogs,
	searchLogs,
	visualizeEntry,
	visualizeStats,
	visualizeTable,
} from "llm-lean-log-core";
import pkg from "../package.json";

const args = process.argv.slice(2);
const command = args[0];

// Check if second argument is a file (ends with .csv) or a parameter
const isLogFile = (arg: string) => arg.endsWith(".csv");
const secondArg = args[1];
const hasLogFile = secondArg && isLogFile(secondArg);
const logFile: string = hasLogFile ? secondArg : "./logs/example.csv";

// Get the index where actual parameters start
const paramStart = hasLogFile ? 2 : 1;

const helpText = `l-log CLI

Usage: l-log <command> [logfile] [options]

Commands:
  list, ls              List all log entries
    --compact, -c       Show compact view
    --human             Show human-readable output (with colors)
  
  stats                 Show log statistics
    --human             Show human-readable output (with colors)
  
  view <index>          View detailed entry at index
    --last              Show the last log entry
    --human             Show human-readable output (with colors)
  
  search <query>        Search logs by name, problem, or solution
    --human             Show human-readable output (with colors)
  
  tags <tag1> [tag2]    Filter logs by tags
    --human             Show human-readable output (with colors)
  
  add <name>            Add a new log entry
    --tags=<tags>       Comma-separated tags
    --problem=<text>    Problem description
    --solution=<text>   Solution description
    --action=<text>     Action taken
    --files=<files>     Comma-separated files
    --tech-stack=<tech> Comma-separated tech stack
    --model=<name>      Model name
  
  help, -h, --help      Show this help message
  
  -v, -V, --version     Show version number

Examples:
  l-log list ./logs/example.csv --human
  l-log stats --human
  l-log view 0 --human
  l-log search "memory" --human
  l-log tags error api --human
  l-log add "Fix bug" --tags=bug,fix --problem="Bug description"
`;

async function main() {
	let entries = await loadLogs(logFile);
	const isHuman = args.includes("--human");
	const llm = !isHuman;

	switch (command) {
		case "list":
		case "ls": {
			const compact = args.includes("--compact") || args.includes("-c") || llm;
			console.log(visualizeTable(entries, { compact, llm }));
			break;
		}

		case "stats": {
			console.log(visualizeStats(entries, { llm }));
			break;
		}

		case "view": {
			const isLast = args.includes("--last");
			const index = isLast
				? entries.length - 1
				: parseInt(args[paramStart] || "0", 10);

			if (entries.length === 0) {
				console.error("Error: No log entries found");
				process.exit(1);
			}

			if (Number.isNaN(index)) {
				console.error("Error: Please provide a valid entry index");
				process.exit(1);
			}

			if (index >= entries.length || index < 0) {
				console.error(
					`Error: Index ${index} out of range (0-${entries.length - 1})`,
				);
				process.exit(1);
			}
			const entry = entries[index];
			if (!entry) {
				console.error(`Error: Entry not found at index ${index}`);
				process.exit(1);
			}
			console.log(visualizeEntry(entry, { llm }));
			break;
		}

		case "search": {
			const query = args[paramStart];
			if (!query) {
				console.error("Error: Please provide a search query");
				process.exit(1);
			}
			const results = searchLogs(entries, query);
			const compact = args.includes("--compact") || args.includes("-c") || llm;
			console.log(visualizeTable(results, { compact, llm }));
			break;
		}

		case "tags": {
			const tagsList = args.slice(paramStart).filter((a) => a !== "--human");
			if (tagsList.length === 0) {
				console.error("Error: Please provide at least one tag");
				process.exit(1);
			}
			const results = filterByTags(entries, tagsList);
			const compact = args.includes("--compact") || args.includes("-c") || llm;
			console.log(visualizeTable(results, { compact, llm }));
			break;
		}

		case "add": {
			const name = args[paramStart];
			if (!name) {
				console.error("Error: Please provide a log name");
				process.exit(1);
			}

			const findFlag = (flag: string): string | undefined => {
				const arg = args.find((a) => a.startsWith(`${flag}=`));
				return arg ? arg.split("=")[1] : undefined;
			};

			const problem = findFlag("--problem");
			if (!problem) {
				console.error(
					"Error: Please provide a problem description with --problem=<text>",
				);
				process.exit(1);
			}

			entries = addLogEntry(entries, {
				name,
				problem,
				tags: findFlag("--tags"),
				solution: findFlag("--solution"),
				action: findFlag("--action"),
				files: findFlag("--files"),
				"tech-stack": findFlag("--tech-stack"),
				model: findFlag("--model"),
			});

			await saveLogs(logFile, entries);
			console.log("Log entry added successfully");
			break;
		}
		case "help":
		case "--help":
		case "-h":
			console.log(helpText);
			break;
		case "-v":
		case "-V":
		case "--version":
			console.log(pkg.version);
			break;

		default:
			if (command) {
				console.error(`Error: Unknown command "${command}"`);
				console.log(helpText);
				process.exit(1);
			} else {
				console.log(helpText);
			}
			break;
	}
}

main().catch((error) => {
	console.error("Error:", error.message);
	process.exit(1);
});
