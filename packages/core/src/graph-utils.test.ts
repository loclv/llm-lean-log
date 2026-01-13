/**
 * Tests for graph utilities
 */

import { beforeEach, describe, expect, it } from "bun:test";
import {
	buildGraph,
	findShortestPath,
	formatIds,
	generateUUID,
	getAncestors,
	getCausalChain,
	getDescendants,
	getGraphStatistics,
	getStronglyConnectedComponents,
	hasCycles,
	parseIds,
	reasoningSearch,
} from "./graph-utils";
import type { LogEntry } from "./types";

describe("Graph Utils", () => {
	let testLogs: LogEntry[];

	beforeEach(() => {
		// Create test logs with causal relationships
		const log1: LogEntry = {
			id: "log1",
			name: "Initial Problem",
			problem: "System crashes on startup",
			"created-at": "2024-01-01T00:00:00Z",
		};

		const log2: LogEntry = {
			id: "log2",
			name: "Debug Issue",
			problem: "Investigate crash logs",
			solution: "Add error handling",
			"created-at": "2024-01-01T01:00:00Z",
			causeIds: "log1",
		};

		const log3: LogEntry = {
			id: "log3",
			name: "Fix Implementation",
			problem: "Implement the fix",
			solution: "Add try-catch blocks",
			"created-at": "2024-01-01T02:00:00Z",
			causeIds: "log2",
		};

		const log4: LogEntry = {
			id: "log4",
			name: "Testing",
			problem: "Test the fix",
			solution: "Run unit tests",
			"created-at": "2024-01-01T03:00:00Z",
			causeIds: "log3",
		};

		// Set up effect relationships (optional, for reverse lookup)
		log1.effectIds = "log2";
		log2.effectIds = "log3";
		log3.effectIds = "log4";

		testLogs = [log1, log2, log3, log4];
	});

	describe("UUID Generation", () => {
		it("should generate valid UUIDs", () => {
			const uuid1 = generateUUID();
			const uuid2 = generateUUID();

			expect(uuid1).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
			);
			expect(uuid2).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
			);
			expect(uuid1).not.toBe(uuid2);
		});
	});

	describe("ID Parsing and Formatting", () => {
		it("should parse comma-separated IDs", () => {
			expect(parseIds("log1,log2,log3")).toEqual(["log1", "log2", "log3"]);
			expect(parseIds("log1, log2, log3")).toEqual(["log1", "log2", "log3"]);
			expect(parseIds("log1")).toEqual(["log1"]);
			expect(parseIds("")).toEqual([]);
			expect(parseIds(undefined)).toEqual([]);
		});

		it("should format IDs to comma-separated string", () => {
			expect(formatIds(["log1", "log2", "log3"])).toBe("log1,log2,log3");
			expect(formatIds(["log1"])).toBe("log1");
			expect(formatIds([])).toBe("");
		});
	});

	describe("Graph Building", () => {
		it("should build correct adjacency list", () => {
			const graph = buildGraph(testLogs);

			expect(graph.get("log1")?.causes).toEqual([]);
			expect(graph.get("log1")?.effects).toEqual(["log2"]);

			expect(graph.get("log2")?.causes).toEqual(["log1"]);
			expect(graph.get("log2")?.effects).toEqual(["log3"]);

			expect(graph.get("log3")?.causes).toEqual(["log2"]);
			expect(graph.get("log3")?.effects).toEqual(["log4"]);

			expect(graph.get("log4")?.causes).toEqual(["log3"]);
			expect(graph.get("log4")?.effects).toEqual([]);
		});
	});

	describe("Ancestors and Descendants", () => {
		it("should get correct ancestors", () => {
			const ancestors = getAncestors(testLogs, "log4");
			const ancestorNames = ancestors.map((log) => log.id);

			expect(ancestorNames).toContain("log1");
			expect(ancestorNames).toContain("log2");
			expect(ancestorNames).toContain("log3");
			expect(ancestorNames).not.toContain("log4");
		});

		it("should get correct descendants", () => {
			const descendants = getDescendants(testLogs, "log1");
			const descendantNames = descendants.map((log) => log.id);

			expect(descendantNames).toContain("log2");
			expect(descendantNames).toContain("log3");
			expect(descendantNames).toContain("log4");
			expect(descendantNames).not.toContain("log1");
		});

		it("should return empty for isolated node", () => {
			const isolatedLog: LogEntry = {
				id: "isolated",
				name: "Isolated",
				problem: "No connections",
				"created-at": "2024-01-01T00:00:00Z",
			};

			const ancestors = getAncestors([isolatedLog], "isolated");
			const descendants = getDescendants([isolatedLog], "isolated");

			expect(ancestors).toEqual([]);
			expect(descendants).toEqual([]);
		});
	});

	describe("Causal Chain", () => {
		it("should get complete causal chain", () => {
			const chain = getCausalChain(testLogs, "log3");
			const chainNames = chain.map((log) => log.id);

			expect(chainNames).toEqual(["log1", "log2", "log3", "log4"]);
		});
	});

	describe("Shortest Path", () => {
		it("should find shortest path between nodes", () => {
			const path = findShortestPath(testLogs, "log1", "log4");
			const pathNames = path.map((log) => log.id);

			expect(pathNames).toEqual(["log1", "log2", "log3", "log4"]);
		});

		it("should return empty for no path", () => {
			const unrelatedLog: LogEntry = {
				id: "unrelated",
				name: "Unrelated",
				problem: "No connection",
				"created-at": "2024-01-01T00:00:00Z",
			};

			const path = findShortestPath(
				[...testLogs, unrelatedLog],
				"log1",
				"unrelated",
			);
			expect(path).toEqual([]);
		});
	});

	describe("Cycle Detection", () => {
		it("should detect no cycles in DAG", () => {
			expect(hasCycles(testLogs)).toBe(false);
		});

		it("should detect cycles", () => {
			const cyclicLogs = [...testLogs];
			// Create a temporal cycle: log1 causes log4 (completing the circle)
			// Original: log1 → log2 → log3 → log4 (via causes)
			// Make it cyclic: log1 → log2 → log3 → log4 → log1
			cyclicLogs[0].causeIds = "log4"; // log1 is caused by log4
			// Update effect relationships to maintain consistency
			cyclicLogs[3].effectIds = "log1"; // log4 now has log1 as effect

			expect(hasCycles(cyclicLogs)).toBe(true);
		});

		it("should detect self-loops", () => {
			const selfLoopLog: LogEntry = {
				id: "selfloop",
				name: "Self Loop",
				problem: "Points to itself",
				"created-at": "2024-01-01T00:00:00Z",
				causeIds: "selfloop",
			};

			expect(hasCycles([selfLoopLog])).toBe(true);
		});
	});

	describe("Strongly Connected Components", () => {
		it("should find no cycles in DAG", () => {
			const components = getStronglyConnectedComponents(testLogs);
			expect(components).toEqual([]);
		});

		it("should find cycles", () => {
			const cyclicLogs = [...testLogs];
			// Create a temporal cycle: log1 causes log4 (completing the circle)
			// Original: log1 → log2 → log3 → log4 (via causes)
			// Make it cyclic: log1 → log2 → log3 → log4 → log1
			cyclicLogs[0].causeIds = "log4"; // log1 is caused by log4
			// Update effect relationships to maintain consistency
			cyclicLogs[3].effectIds = "log1"; // log4 now has log1 as effect

			const components = getStronglyConnectedComponents(cyclicLogs);
			expect(components.length).toBeGreaterThan(0);
		});
	});

	describe("Reasoning Search", () => {
		it("should find relevant logs with causal context", () => {
			const results = reasoningSearch(testLogs, "Fix", 2);
			const resultNames = results.map((log) => log.name);

			expect(resultNames).toContain("Fix Implementation");
			// Should include causal context
			expect(resultNames.length).toBeGreaterThan(1);
		});

		it("should limit depth correctly", () => {
			const results = reasoningSearch(testLogs, "Fix", 1);
			const resultNames = results.map((log) => log.name);

			// Should include the fix and immediate context
			expect(resultNames.length).toBeGreaterThanOrEqual(1);
			expect(resultNames.length).toBeLessThanOrEqual(3); // Fix + immediate causes/effects
		});
	});

	describe("Graph Statistics", () => {
		it("should calculate correct statistics", () => {
			const stats = getGraphStatistics(testLogs);

			expect(stats.totalNodes).toBe(4);
			expect(stats.totalEdges).toBe(3); // log1->log2, log2->log3, log3->log4
			expect(stats.hasCycles).toBe(false);
			expect(stats.cyclesCount).toBe(0);
			expect(stats.maxDegree).toBe(2); // log2 and log3 have degree 2
			expect(stats.avgDegree).toBe(1.5); // Total degree (6) / nodes (4)
		});
	});
});

describe("Complex Graph Scenarios", () => {
	it("should handle multiple causes and effects", () => {
		const log1: LogEntry = {
			id: "root",
			name: "Root Problem",
			problem: "Base issue",
			"created-at": "2024-01-01T00:00:00Z",
		};

		const log2: LogEntry = {
			id: "branch1",
			name: "Branch 1",
			problem: "First branch",
			"created-at": "2024-01-01T01:00:00Z",
			causeIds: "root",
		};

		const log3: LogEntry = {
			id: "branch2",
			name: "Branch 2",
			problem: "Second branch",
			"created-at": "2024-01-01T01:00:00Z",
			causeIds: "root",
		};

		const log4: LogEntry = {
			id: "merge",
			name: "Merge Solution",
			problem: "Combined fix",
			"created-at": "2024-01-01T02:00:00Z",
			causeIds: "branch1,branch2",
		};

		// Set up effects
		log1.effectIds = "branch1,branch2";
		log2.effectIds = "merge";
		log3.effectIds = "merge";

		const logs = [log1, log2, log3, log4];

		// Test graph structure
		const graph = buildGraph(logs);
		expect(graph.get("root")?.effects).toEqual(["branch1", "branch2"]);
		expect(graph.get("merge")?.causes).toEqual(["branch1", "branch2"]);

		// Test ancestors of merge
		const mergeAncestors = getAncestors(logs, "merge");
		expect(mergeAncestors.length).toBe(3); // root, branch1, branch2

		// Test descendants of root
		const rootDescendants = getDescendants(logs, "root");
		expect(rootDescendants.length).toBe(3); // branch1, branch2, merge
	});

	it("should handle disconnected components", () => {
		const component1: LogEntry[] = [
			{
				id: "c1a",
				name: "Component 1 A",
				problem: "First component",
				"created-at": "2024-01-01T00:00:00Z",
			},
			{
				id: "c1b",
				name: "Component 1 B",
				problem: "Connected to A",
				"created-at": "2024-01-01T01:00:00Z",
				causeIds: "c1a",
			},
		];

		const component2: LogEntry[] = [
			{
				id: "c2a",
				name: "Component 2 A",
				problem: "Second component",
				"created-at": "2024-01-01T00:00:00Z",
			},
			{
				id: "c2b",
				name: "Component 2 B",
				problem: "Connected to 2A",
				"created-at": "2024-01-01T01:00:00Z",
				causeIds: "c2a",
			},
		];

		// Set up effects
		component1[0].effectIds = "c1b";
		component2[0].effectIds = "c2b";

		const allLogs = [...component1, ...component2];

		// Test that components are disconnected
		const path = findShortestPath(allLogs, "c1a", "c2a");
		expect(path).toEqual([]);

		// Test ancestors work within components
		const c1bAncestors = getAncestors(allLogs, "c1b");
		expect(c1bAncestors.map((log) => log.id)).toEqual(["c1a"]);

		const c2bAncestors = getAncestors(allLogs, "c2b");
		expect(c2bAncestors.map((log) => log.id)).toEqual(["c2a"]);
	});
});
