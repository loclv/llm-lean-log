/**
 * Example usage of the graph-based reasoning retrieval system
 */

import {
	buildIndex,
	createLogEntry,
	getAncestors,
	getCausalChain,
	getDescendants,
	getGraphStatistics,
	hasCycles,
	loadLogs,
	reasoningSearch,
	saveLogs,
	type LogEntry,
} from "./src/index";

// Example: Creating log entries with causal relationships
async function createExampleLogs() {
	const _logs: LogEntry[] = [];

	// Initial problem
	const bugReport = createLogEntry({
		name: "Authentication bug discovered",
		tags: "bug,auth,critical",
		problem: "Users cannot log in with valid credentials",
		solution: "",
		action: "Investigate authentication flow",
		files: "src/auth/login.ts,src/middleware/auth.ts",
		"tech-stack": "elysia,jwt,sqlite",
	});

	// Investigation
	const investigation = createLogEntry({
		name: "Debug authentication issue",
		tags: "debug,auth",
		problem: "JWT token validation failing",
		solution: "Fix token parsing logic",
		action: "run bash`bun test auth`",
		files: "src/auth/jwt.ts",
		"tech-stack": "elysia,jwt",
		causeIds: bugReport.id, // This was caused by the bug report
	});

	// Fix implementation
	const fix = createLogEntry({
		name: "Fix JWT token validation",
		tags: "fix,auth,jwt",
		problem: "Token expiration check was incorrect",
		solution: "Update token validation to use proper expiration time",
		action: "Update JWT validation logic in ts`src/auth/jwt.ts`",
		files: "src/auth/jwt.ts",
		"tech-stack": "elysia,jwt",
		causeIds: investigation.id, // This was caused by the investigation
	});

	// Testing
	const testing = createLogEntry({
		name: "Test authentication fix",
		tags: "test,auth",
		problem: "Verify the fix works correctly",
		solution: "Run comprehensive tests",
		action: "run bash`bun test:auth && bun test:integration`",
		files: "tests/auth.test.ts",
		"tech-stack": "bun,test",
		causeIds: fix.id, // This was caused by the fix
	});

	// Deployment
	const deployment = createLogEntry({
		name: "Deploy authentication fix",
		tags: "deploy,auth",
		problem: "Deploy fix to production",
		solution: "Deploy via CI/CD pipeline",
		action: "run bash`git push origin main`",
		files: ".github/workflows/deploy.yml",
		"tech-stack": "github,ci/cd",
		causeIds: testing.id, // This was caused by testing
	});

	// Add effect relationships (reverse of causes)
	bugReport.effectIds = investigation.id;
	investigation.effectIds = `${fix.id},${bugReport.id}`;
	fix.effectIds = `${testing.id},${investigation.id}`;
	testing.effectIds = `${deployment.id},${fix.id}`;
	deployment.effectIds = testing.id;

	return [bugReport, investigation, fix, testing, deployment];
}

// Example: Using the graph-based retrieval system
async function demonstrateGraphRetrieval() {
	console.log("🌳 Creating example logs with causal relationships...\n");

	const logs = await createExampleLogs();

	// Save logs to file
	const logPath = "./logs/example.csv";
	await saveLogs(logPath, logs);
	console.log(`💾 Saved ${logs.length} logs to ${logPath}`);

	// Load logs back
	const loadedLogs = await loadLogs(logPath);
	console.log(`📂 Loaded ${loadedLogs.length} logs from file\n`);

	// Build index for efficient retrieval
	const index = buildIndex(loadedLogs);
	console.log("🔍 Built search and graph index");

	// Display graph statistics
	const stats = getGraphStatistics(loadedLogs);
	console.log("\n📊 Graph Statistics:");
	console.log(`  Total nodes: ${stats.totalNodes}`);
	console.log(`  Total edges: ${stats.totalEdges}`);
	console.log(`  Has cycles: ${stats.hasCycles}`);
	console.log(`  Max degree: ${stats.maxDegree}`);
	console.log(`  Average degree: ${stats.avgDegree}\n`);

	// Example 1: Get causal chain for a specific entry
	const fixEntry = logs.find((log) => log.name.includes("Fix JWT"));
	if (fixEntry) {
		console.log(`🔗 Causal chain for "${fixEntry.name}":`);
		const causalChain = getCausalChain(loadedLogs, fixEntry.id);
		causalChain.forEach((entry, index) => {
			const prefix = index === 2 ? "→ " : "  "; // Highlight the current entry
			console.log(`${prefix}${index + 1}. ${entry.name} (${entry.id})`);
		});
		console.log();
	}

	// Example 2: Get ancestors (causes) of deployment
	const deployEntry = logs.find((log) => log.name.includes("Deploy"));
	if (deployEntry) {
		console.log(`⬅️  Ancestors of "${deployEntry.name}":`);
		const ancestors = getAncestors(loadedLogs, deployEntry.id);
		ancestors.forEach((entry, index) => {
			console.log(`  ${index + 1}. ${entry.name} (${entry.id})`);
		});
		console.log();
	}

	// Example 3: Get descendants (effects) of bug report
	const bugEntry = logs.find((log) => log.name.includes("bug discovered"));
	if (bugEntry) {
		console.log(`➡️  Descendants of "${bugEntry.name}":`);
		const descendants = getDescendants(loadedLogs, bugEntry.id);
		descendants.forEach((entry, index) => {
			console.log(`  ${index + 1}. ${entry.name} (${entry.id})`);
		});
		console.log();
	}

	// Example 4: Reasoning-based search
	console.log("🧠 Reasoning-based search for 'authentication':");
	const relevantLogs = reasoningSearch(loadedLogs, "authentication", 2);
	relevantLogs.forEach((entry, index) => {
		console.log(`  ${index + 1}. ${entry.name}`);
		console.log(`     Tags: ${entry.tags || "none"}`);
		console.log(`     Problem: ${entry.problem}`);
		console.log();
	});

	// Example 5: Check for cycles
	console.log(`🔄 Graph contains cycles: ${hasCycles(loadedLogs)}`);

	// Example 6: Using indexed search for performance
	console.log("\n⚡ Indexed search performance demo:");
	console.time("Indexed search");
	const indexedResults = index.search.byId.get(fixEntry?.id || "");
	console.timeEnd("Indexed search");
	console.log(`Found entry by ID: ${indexedResults?.name || "not found"}`);

	console.time("Tag filter");
	const authLogs = index.search.byTags.get("auth") || [];
	console.timeEnd("Tag filter");
	console.log(`Found ${authLogs.length} logs with 'auth' tag`);
}

// Example: Creating a more complex graph with cycles
async function createComplexGraph() {
	console.log("\n🌐 Creating complex graph with cycles...\n");

	const _logs: LogEntry[] = [];

	// Create a cycle: A -> B -> C -> A
	const entryA = createLogEntry({
		name: "Task A: Initial setup",
		tags: "setup,initial",
		problem: "Need to set up project structure",
		solution: "Create basic project files",
		files: "package.json,tsconfig.json",
	});

	const entryB = createLogEntry({
		name: "Task B: Dependencies",
		tags: "deps,packages",
		problem: "Install required dependencies",
		solution: "Add npm packages",
		files: "package.json",
		causeIds: entryA.id,
	});

	const entryC = createLogEntry({
		name: "Task C: Configuration",
		tags: "config,setup",
		problem: "Configure build tools",
		solution: "Update configuration files",
		files: "tsconfig.json,vite.config.ts",
		causeIds: entryB.id,
	});

	// Create a cycle by making A depend on C
	entryA.causeIds = entryC.id;

	// Set up effect relationships
	entryA.effectIds = entryB.id;
	entryB.effectIds = entryC.id;
	entryC.effectIds = entryA.id;

	const complexLogs = [entryA, entryB, entryC];

	// Analyze the complex graph
	console.log("📊 Complex Graph Analysis:");
	const complexStats = getGraphStatistics(complexLogs);
	console.log(`  Total nodes: ${complexStats.totalNodes}`);
	console.log(`  Has cycles: ${complexStats.hasCycles}`);
	console.log(`  Number of cycles: ${complexStats.cyclesCount}`);

	// Show the cycle
	console.log("\n🔄 Detected cycle:");
	for (const entry of complexLogs) {
		const causes = entry.causeIds ? ` (caused by ${entry.causeIds})` : "";
		const effects = entry.effectIds ? ` (effects: ${entry.effectIds})` : "";
		console.log(`  ${entry.name}${causes}${effects}`);
	}

	return complexLogs;
}

// Run the demonstration
async function main() {
	try {
		await demonstrateGraphRetrieval();
		await createComplexGraph();

		console.log(
			"\n✅ Graph-based reasoning retrieval system demonstration completed!",
		);
		console.log("\n📚 Key features demonstrated:");
		console.log("  • UUID-based log identification");
		console.log("  • Cause and effect relationships");
		console.log("  • Graph traversal (ancestors, descendants)");
		console.log("  • Causal chain analysis");
		console.log("  • Cycle detection");
		console.log("  • Reasoning-based search");
		console.log("  • Efficient indexing system");
		console.log("  • Support for both DAG and cyclic graphs");
	} catch (error) {
		console.error("❌ Error during demonstration:", error);
	}
}

// Run if this file is executed directly
if (import.meta.main) {
	main();
}
