/**
 * Example usage of llm-lean-log
 */

import type { LogEntry } from "./src";
import {
	addLogEntry,
	filterByTags,
	saveLogs,
	searchLogs,
	updateLogEntry,
	visualizeEntry,
	visualizeStats,
	visualizeTable,
} from "./src";

const LOG_FILE = "./logs/example.csv";

async function main() {
	console.log("🚀 llm-lean-log - Example Usage\n");

	// Load existing logs (if any) - starts fresh for demo
	let entries: LogEntry[] = [];

	// Add example log entries
	console.log("📝 Creating example log entries...\n");

	entries = addLogEntry(entries, {
		name: "API Authentication Error",
		tags: "error,api,auth",
		problem:
			"Users unable to login due to JWT token expiration not being handled correctly",
		solution:
			"Added token refresh logic in the auth middleware to automatically renew tokens before expiration",
		action: "Updated auth.ts middleware and added refresh endpoint",
		model: "claude-3.5-sonnet",
		"log-created-modal": "gpt-4",
	});

	entries = addLogEntry(entries, {
		name: "Database Connection Pool Exhausted",
		tags: "error,database,performance",
		problem:
			"Application crashes during high traffic due to database connection pool being exhausted",
		solution:
			"Increased pool size from 10 to 50 and added connection timeout handling",
		action:
			"Modified database.config.ts: pool.max = 50, pool.idleTimeoutMillis = 30000",
		model: "gpt-4-turbo",
	});

	entries = addLogEntry(entries, {
		name: "Implement Dark Mode",
		tags: "feature,ui,enhancement",
		problem: "Users requested dark mode for better viewing experience at night",
		solution:
			"Implemented theme toggle using CSS variables and localStorage for persistence",
		action:
			"Created theme.ts utility and updated global.css with dark mode variables",
		model: "claude-3.5-sonnet",
	});

	entries = addLogEntry(entries, {
		name: "Memory Leak in WebSocket Handler",
		tags: "bug,websocket,memory",
		problem:
			"Server memory usage grows continuously when WebSocket connections are active",
		solution:
			"Fixed event listener cleanup in disconnect handler to prevent memory leaks",
		action: "Added removeAllListeners() call in websocket.disconnect()",
		model: "gpt-4",
	});

	entries = addLogEntry(entries, {
		name: "Optimize Image Loading",
		tags: "performance,optimization,images",
		problem: "Page load time is slow due to large unoptimized images",
		solution: "Implemented lazy loading and WebP format with fallback to JPEG",
		action:
			"Added next/image component and configured image optimization in next.config.js",
		model: "claude-3.5-sonnet",
	});

	entries = addLogEntry(entries, {
		name: "TypeScript Migration Complete",
		tags: "refactor,typescript,milestone",
		problem: "Codebase was in JavaScript making it hard to catch type errors",
		solution: "Migrated entire codebase to TypeScript with strict mode enabled",
		action:
			"Converted all .js files to .ts, added type definitions, configured tsconfig.json",
		model: "gpt-4-turbo",
	});

	console.log(`✅ Created ${entries.length} log entries\n`);

	// Visualize all logs
	console.log("📊 All Log Entries:");
	console.log(visualizeTable(entries, { compact: false }));
	console.log("\n");

	// Filter by tags
	console.log("🏷️  Filtering by 'error' tag:");
	const errorLogs = filterByTags(entries, ["error"]);
	console.log(visualizeTable(errorLogs, { compact: true }));
	console.log("\n");

	// Search logs
	console.log("🔍 Searching for 'memory':");
	const searchResults = searchLogs(entries, "memory");
	console.log(visualizeTable(searchResults, { compact: false }));
	console.log("\n");

	// Show detailed view of first entry
	console.log("📄 Detailed view of first entry:");
	if (entries.length > 0) {
		const firstEntry = entries[0];
		if (firstEntry) {
			console.log(visualizeEntry(firstEntry));
			console.log("\n");
		}
	}

	// Show statistics
	console.log("📈 Log Statistics:");
	console.log(visualizeStats(entries));
	console.log("\n");

	// Update an entry
	console.log("✏️  Updating first entry...");
	entries = updateLogEntry(entries, 0, {
		solution:
			"Added token refresh logic with exponential backoff retry mechanism",
	});
	console.log("✅ Entry updated\n");

	// Save to file
	await saveLogs(LOG_FILE, entries);

	// Show the CSV file location
	console.log(`💾 Logs saved to: ${entries.length > 0 ? LOG_FILE : "N/A"}`);
	console.log("\n🎉 Example complete!");
}

main().catch(console.error);
