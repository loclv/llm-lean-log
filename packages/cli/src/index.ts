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

const args = process.argv.slice(2);
const command = args[0];

// Check if second argument is a file (ends with .csv) or a parameter
const isLogFile = (arg: string) => arg.endsWith(".csv");
const secondArg = args[1];
const hasLogFile = secondArg && isLogFile(secondArg);
const logFile: string = hasLogFile ? secondArg : "./logs/example.csv";

// Get the index where actual parameters start
const paramStart = hasLogFile ? 2 : 1;

const helpText = `llml CLI

Usage: llml <command> [logfile] [options]

Commands:
  list, ls              List all log entries
    --compact, -c       Show compact view
  
  stats                 Show log statistics
  
  view <index>          View detailed entry at index
  
  search <query>        Search logs by name, problem, or solution
  
  tags <tag1> [tag2]    Filter logs by tags
  
  add <name>            Add a new log entry
    --tags=<tags>       Comma-separated tags
    --problem=<text>    Problem description
    --solution=<text>   Solution description
    --action=<text>     Action taken
    --model=<name>      Model name
  
  help                  Show this help message

Examples:
  llml list ./logs/example.csv
  llml stats
  llml view 0
  llml search "memory"
  llml tags error api
  llml add "Fix bug" --tags=bug,fix --problem="Bug description"
`;

async function main() {
	let entries = await loadLogs(logFile);

	switch (command) {
		case "list":
		case "ls": {
			const compact = args.includes("--compact") || args.includes("-c");
			console.log(visualizeTable(entries, { compact }));
			break;
		}

		case "stats": {
			console.log(visualizeStats(entries));
			break;
		}

		case "view": {
			const index = parseInt(args[paramStart] || "0", 10);
			if (Number.isNaN(index) || index < 0) {
				console.error("Error: Please provide a valid entry index");
				process.exit(1);
			}
			if (index >= entries.length) {
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
			console.log(visualizeEntry(entry));
			break;
		}

		case "search": {
			const query = args[paramStart];
			if (!query) {
				console.error("Error: Please provide a search query");
				process.exit(1);
			}
			const results = searchLogs(entries, query);
			console.log(visualizeTable(results));
			break;
		}

		case "tags": {
			const tagsList = args.slice(paramStart);
			if (tagsList.length === 0) {
				console.error("Error: Please provide at least one tag");
				process.exit(1);
			}
			const results = filterByTags(entries, tagsList);
			console.log(visualizeTable(results));
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
