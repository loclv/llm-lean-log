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
} from "llm-lean-log-core";
import { helpText, helpTextForHuman } from "./const";
import { getLastCommitShortSha } from "./git";
import { visualizeEntry, visualizeStats, visualizeTable } from "./visualizer";

export async function main(version: string) {
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

			// Auto-populate last-commit-short-sha if not provided
			let lastCommitShortSha = findFlag("--last-commit-short-sha");
			if (!lastCommitShortSha) {
				lastCommitShortSha = await getLastCommitShortSha();
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
				cause: findFlag("--cause"),
				causeIds: findFlag("--causeIds"),
				effectIds: findFlag("--effectIds"),
				"last-commit-short-sha": lastCommitShortSha,
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
			console.log(version);
			break;

		default:
			if (command) {
				console.error(`Error: Unknown command "${command}"\n${helpText}`);
				process.exit(1);
			} else {
				console.log(helpText);
			}
			break;
	}
}
