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

/**
 * Help text for LLMs in CSV format
 */
const helpText = `l-log CLI - Usage: l-log <command> [log-file] [options]

command,options,description
list|ls,"--compact|-c,--human",List all log entries
stats,--human,Show log statistics
view <index>,"--last,--human",View detailed entry at index
search <query>,--human,Search logs by name/problem/solution
tags <tag1> [tag2],--human,Filter logs by tags
add <name>,"--tags=<tags>,--problem=<text>,--solution=<text>,--action=<text>,--files=<files>,--tech-stack=<tech>,--model=<name>,--causeIds=<ids>,--effectIds=<ids>,--last-commit-short-sha=<sha>,--created-at=<time>,--updated-at=<time>,--created-by-agent=<name>",Add a new log entry
help|-h|--help,--human,Show this help message
-v|-V|--version,,Show version number

examples
l-log list ./logs/example.csv
l-log stats
l-log view 0
l-log view --last
l-log search "memory"
l-log tags error api
l-log add ./logs/chat1.csv "Fix bug" --tags=bug,fix --problem="Bug description" --files="file1.ts,src/file2.ts" --tech-stack="ts,react" --causeIds="721ace2b-5e73-4901-bef9-97de16bf170f" --last-commit-short-sha="a1b2c3d" --model="gpt-4o"
`;

const helpTextForHuman = `l-log CLI

Usage: l-log <command> [log-file] [options]

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
    --tags=<tags>       Comma-separated tags, wrap with double quotes if multiple tags
    --problem=<text>    Problem description
    --solution=<text>   Solution description
    --action=<text>     Action taken
    --files=<files>     Comma-separated files paths, wrap with double quotes if multiple files
    --tech-stack=<tech> Comma-separated tech stack, wrap with double quotes if multiple tech stack
    --model=<name>      Model name
    --causeIds=<ids>    Comma-separated cause log row UUIDs, wrap with double quotes if multiple cause log row UUIDs
    --effectIds=<ids>   Comma-separated effect log row UUIDs, wrap with double quotes if multiple effect log row UUIDs
    --last-commit-short-sha=<sha> Last git commit short SHA
    --created-at=<time> Creation time (ISO 8601 formatted string)
    --updated-at=<time> Update time (ISO 8601 formatted string)
    --created-by-agent=<name> Agent model name
  
  help, -h, --help      Show this help message
    --human             Show human-readable output (default for terminal)
  
  -v, -V, --version     Show version number

Examples for LLMs:
  l-log list ./logs/example.csv
  l-log stats
  l-log view 0
  l-log view --last
  l-log search "memory"
  l-log tags error api
  l-log add ./logs/chat1.csv "Fix bug" --tags=bug,fix --problem="Bug description" --files="file1.ts,src/file2.ts" --tech-stack="ts,react" --causeIds="721ace2b-5e73-4901-bef9-97de16bf170f" --last-commit-short-sha="a1b2c3d" --model="gpt-4o"
`;

/**
 * Main function for the CLI
 */
export async function main() {
	const args = process.argv.slice(2);
	const command = args[0];

	// Check if second argument is a file (ends with .csv) or a parameter
	const isLogFile = (arg: string) => arg?.endsWith(".csv");
	const secondArg = args[1];
	const hasLogFile = secondArg && isLogFile(secondArg);
	const logFile: string = hasLogFile ? secondArg : "./logs/example.csv";

	// Get the index where actual parameters start
	const paramStart = hasLogFile ? 2 : 1;

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
				id: findFlag("--id"),
				causeIds: findFlag("--causeIds"),
				effectIds: findFlag("--effectIds"),
				"last-commit-short-sha": findFlag("--last-commit-short-sha"),
				"created-at": findFlag("--created-at"),
				"updated-at": findFlag("--updated-at"),
				"created-by-agent": findFlag("--created-by-agent"),
			});

			await saveLogs(logFile, entries);
			console.log("Log entry added successfully");
			break;
		}
		case "help":
		case "--help":
		case "-h": {
			const showHumanHelp = args.includes("--human");
			console.log(showHumanHelp ? helpTextForHuman : helpText);
			break;
		}
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

if (import.meta.main) {
	main().catch((error) => {
		console.error("Error:", error.message);
		process.exit(1);
	});
}
