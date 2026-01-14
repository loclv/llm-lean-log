/**
 * Example usage of llm-lean-log
 */

import {
	addLogEntry,
	createLogEntry,
	filterByTags,
	type LogEntry,
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

	// Mock UUIDs for predictable graph relationships
	const mockIds = {
		authError: "auth-error-001",
		dbInvestigation: "db-investigation-002",
		darkMode: "dark-mode-003",
		memoryLeak: "memory-leak-004",
		imageOptimization: "image-optimization-005",
		typescriptMigration: "typescript-migration-006",
	};

	// Initial problem
	const authError = createLogEntry({
		name: "API Authentication Error",
		tags: "error,api,auth",
		problem:
			"Users unable to login due to JWT token expiration not being handled correctly",
		solution:
			"Added token refresh logic in the auth middleware to automatically renew tokens before expiration",
		action: "Updated auth.ts middleware and added refresh endpoint",
		files: "src/middleware/auth.ts, src/routes/auth.routes.ts",
		"tech-stack": "typescript, express, jwt",
		model: "claude-3.5-sonnet",
		"created-by-agent": "gpt-4",
		effectIds: mockIds.dbInvestigation,
		"last-commit-short-sha": "a1b2c3d",
	});

	entries = addLogEntry(entries, authError);

	// Investigation caused by auth error
	const dbInvestigation = createLogEntry({
		name: "Database Connection Pool Exhausted",
		tags: "error,database,performance",
		problem:
			"Application crashes during high traffic due to database connection pool being exhausted",
		solution:
			"Increased pool size from 10 to 50 and added connection timeout handling",
		action:
			"Modified database.config.ts: ts`pool.max = 50, pool.idleTimeoutMillis = 30_000`",
		files: "src/config/database.config.ts",
		"tech-stack": "typescript, postgresql, node.js",
		model: "gpt-4-turbo",
		causeIds: mockIds.authError,
		effectIds: `${mockIds.memoryLeak},${mockIds.authError}`,
		"last-commit-short-sha": "b2c3d4e",
	});

	entries = addLogEntry(entries, dbInvestigation);

	// Feature request (independent cause)
	const darkMode = createLogEntry({
		name: "Implement Dark Mode",
		tags: "feature,ui,enhancement",
		problem: "Users requested dark mode for better viewing experience at night",
		solution:
			"Implemented theme toggle using CSS variables and localStorage for persistence",
		action:
			"Created theme.ts utility and updated global.css with dark mode variables",
		files:
			"src/utils/theme.ts, styles/global.css, src/components/ThemeToggle.tsx",
		"tech-stack": "typescript, react, tailwindcss",
		model: "claude-3.5-sonnet",
		effectIds: mockIds.imageOptimization,
	});

	entries = addLogEntry(entries, darkMode);

	// Bug discovered during database investigation
	const memoryLeak = createLogEntry({
		name: "Memory Leak in WebSocket Handler",
		tags: "bug,websocket,memory",
		problem:
			"Server memory usage grows continuously when WebSocket connections are active",
		solution:
			"Fixed event listener cleanup in disconnect handler to prevent memory leaks",
		action: "Added `removeAllListeners()` call in `websocket.disconnect()`",
		files: "src/handlers/websocket.handler.ts",
		"tech-stack": "typescript, socket.io, node.js",
		model: "gpt-4",
		causeIds: mockIds.dbInvestigation,
		effectIds: `${mockIds.typescriptMigration},${mockIds.dbInvestigation}`,
		"last-commit-short-sha": "c3d4e5f",
	});

	entries = addLogEntry(entries, memoryLeak);

	// Performance improvement (caused by dark mode implementation)
	const imageOptimization = createLogEntry({
		name: "Optimize Image Loading",
		tags: "performance,optimization,images",
		problem: "Page load time is slow due to large unoptimized images",
		solution: "Implemented lazy loading and WebP format with fallback to JPEG",
		action:
			"Added next/image component and configured image optimization in next.config.js",
		files: "next.config.js, src/components/ImageGallery.tsx",
		"tech-stack": "typescript, next.js, react",
		model: "claude-3.5-sonnet",
		causeIds: mockIds.darkMode,
		effectIds: `${mockIds.typescriptMigration},${mockIds.darkMode}`,
	});

	entries = addLogEntry(entries, imageOptimization);

	// Final milestone (caused by multiple fixes)
	const typescriptMigration = createLogEntry({
		name: "TypeScript Migration Complete",
		tags: "refactor,typescript,milestone",
		problem: "Codebase was in JavaScript making it hard to catch type errors",
		solution: "Migrated entire codebase to TypeScript with strict mode enabled",
		action:
			"Converted all .js files to .ts, added type definitions, configured tsconfig.json",
		files: "tsconfig.json, package.json, src/**/*",
		"tech-stack": "typescript, node.js",
		model: "gpt-4-turbo",
		causeIds: `${mockIds.authError},${mockIds.memoryLeak},${mockIds.imageOptimization}`,
		effectIds: "", // Final milestone, no effects
	});

	entries = addLogEntry(entries, typescriptMigration);

	// Effect relationships are now set during createLogEntry calls above
	// This ensures effectIds are properly saved to the CSV file

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

	// Show graph relationships
	console.log("🔗 Graph Relationships:");
	console.log(`  Auth Error → Database Investigation (cause: ${authError.id})`);
	console.log(
		`  Database Investigation → Memory Leak (cause: ${dbInvestigation.id})`,
	);
	console.log(`  Dark Mode → Image Optimization (cause: ${darkMode.id})`);
	console.log(
		`  Multiple causes → TypeScript Migration (${typescriptMigration.id})`,
	);
	console.log("\n");

	// Save to file
	await saveLogs(LOG_FILE, entries);

	// Show the CSV file location
	console.log(`💾 Logs saved to: ${entries.length > 0 ? LOG_FILE : "N/A"}`);
	console.log("\n🎉 Example complete!");
}

main().catch(console.error);
