import { describe, expect, it } from "bun:test";
import {
	buildGraphIndex,
	buildIndex,
	buildSearchIndex,
	getIndexStatistics,
	indexedFilterByTags,
	indexedGetCausalChain,
	indexedSearch,
	updateIndex,
} from "./indexer";
import type { LogEntry } from "./types";

/**
 * Unit tests for Indexer
 */
describe("indexer", () => {
	const mockEntries: LogEntry[] = [
		{
			id: "1",
			name: "Fix bug in auth",
			tags: "bug,auth",
			problem: "User cannot login with valid credentials",
			solution: "Updated auth middleware",
			action: "Tested with postman",
			files: "middleware/auth.ts",
			"tech-stack": "typescript,nodejs",
			"created-at": "2024-01-01T10:00:00Z",
		},
		{
			id: "2",
			name: "Performance optimization",
			tags: "perf,database",
			problem: "Query is slow when fetching many records",
			solution: "Added index to the user table",
			files: "db/migrations/001_add_index.sql",
			"tech-stack": "sql,postgres",
			causeIds: "1", // Entry 2 is caused by Entry 1
			"created-at": "2024-01-02T10:00:00Z",
		},
		{
			id: "3",
			name: "Add new feature",
			tags: "feature,ui",
			problem: "Users want dark mode",
			solution: "Implemented theme provider",
			files: "components/Theme.tsx,App.tsx",
			"tech-stack": "react,typescript",
			effectIds: "2", // Entry 2 is an effect of Entry 3 (weird example but test causal chain)
			"created-at": "2024-01-03T10:00:00Z",
		},
	];

	describe("buildSearchIndex", () => {
		it("should index entry by ID", () => {
			const index = buildSearchIndex(mockEntries);
			expect(index.byId.get("1")).toEqual(mockEntries[0]);
			expect(index.byId.get("2")).toEqual(mockEntries[1]);
		});

		it("should tokenize and index by name", () => {
			const index = buildSearchIndex(mockEntries);
			// "Fix bug in auth" -> tokens: ["fix", "bug", "auth"] (in is skipped because length <= 2)
			expect(index.byName.get("auth")).toContain(mockEntries[0]);
			expect(index.byName.get("bug")).toContain(mockEntries[0]);
			expect(index.byName.get("fix")).toContain(mockEntries[0]);
		});

		it("should tokenize and index by problem", () => {
			const index = buildSearchIndex(mockEntries);
			expect(index.byProblem.get("login")).toContain(mockEntries[0]);
			expect(index.byProblem.get("credentials")).toContain(mockEntries[0]);
		});

		it("should index by tags", () => {
			const index = buildSearchIndex(mockEntries);
			expect(index.byTags.get("auth")).toContain(mockEntries[0]);
			expect(index.byTags.get("database")).toContain(mockEntries[1]);
		});

		it("should index by files", () => {
			const index = buildSearchIndex(mockEntries);
			expect(index.byFiles.get("middleware/auth.ts")).toContain(mockEntries[0]);
			expect(index.byFiles.get("app.tsx")).toContain(mockEntries[2]);
		});

		it("should index by tech stack", () => {
			const index = buildSearchIndex(mockEntries);
			expect(index.byTechStack.get("typescript")).toContain(mockEntries[0]);
			expect(index.byTechStack.get("typescript")).toContain(mockEntries[2]);
			expect(index.byTechStack.get("postgres")).toContain(mockEntries[1]);
		});

		it("should handle empty values", () => {
			const entriesWithEmpty: LogEntry[] = [
				{
					id: "4",
					name: "",
					problem: "",
					"created-at": "2024-01-04T10:00:00Z",
				},
			];
			const index = buildSearchIndex(entriesWithEmpty);
			expect(index.byId.get("4")).toBeDefined();
		});
	});

	describe("buildGraphIndex", () => {
		it("should compute ancestors correctly", () => {
			// 1 <- 2 (2 causes 1? No, causeIds: "1" in Entry 2 means 1 is a cause of 2)
			// Hierarchy: 1 -> 2
			// Entry 3 has effectIds: "2" which means 3 -> 2
			const index = buildGraphIndex(mockEntries);

			const ancestorsOf2 = index.ancestorsCache.get("2") || [];
			const ancestorIds = ancestorsOf2.map((a) => a.id);
			expect(ancestorIds).toContain("1");
			expect(ancestorIds).toContain("3");
		});

		it("should compute descendants correctly", () => {
			const index = buildGraphIndex(mockEntries);

			const descendantsOf1 = index.descendantsCache.get("1") || [];
			expect(descendantsOf1.map((d) => d.id)).toContain("2");

			const descendantsOf3 = index.descendantsCache.get("3") || [];
			expect(descendantsOf3.map((d) => d.id)).toContain("2");
		});
	});

	describe("indexedSearch", () => {
		it("should find entries by tokens across fields", () => {
			const index = buildSearchIndex(mockEntries);

			// Search for "auth" - matches name and tag in entry 1
			const results = indexedSearch(index, "auth");
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe("1");

			// Search for "typescript" - matches tech-stack in entry 1 and 3
			const tsResults = indexedSearch(index, "typescript");
			expect(tsResults).toHaveLength(2);
			const tsIds = tsResults.map((r) => r.id);
			expect(tsIds).toContain("1");
			expect(tsIds).toContain("3");
		});

		it("should handle multi-word query", () => {
			const index = buildSearchIndex(mockEntries);
			const results = indexedSearch(index, "auth database");
			expect(results).toHaveLength(2);
		});

		it("should return empty for no match", () => {
			const index = buildSearchIndex(mockEntries);
			const results = indexedSearch(index, "nonexistent");
			expect(results).toHaveLength(0);
		});
	});

	describe("indexedFilterByTags", () => {
		it("should filter by single tag", () => {
			const index = buildSearchIndex(mockEntries);
			const results = indexedFilterByTags(index, ["auth"]);
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe("1");
		});

		it("should filter by multiple tags", () => {
			const index = buildSearchIndex(mockEntries);
			const results = indexedFilterByTags(index, ["auth", "ui"]);
			expect(results).toHaveLength(2);
		});
	});

	describe("indexedGetCausalChain", () => {
		it("should return full causal chain", () => {
			const logIndex = buildIndex(mockEntries);
			// 1 -> 2, 3 -> 2
			// Causal chain for 2 should be [1, 3, 2] (order might vary for ancestors)
			const chain = indexedGetCausalChain(logIndex.graph, "2", mockEntries);
			const chainIds = chain.map((c) => c.id);

			expect(chainIds).toContain("1");
			expect(chainIds).toContain("3");
			expect(chainIds).toContain("2");
		});

		it("should handle entry with no causes or effects", () => {
			const soloEntry: LogEntry = {
				id: "solo",
				name: "Solo",
				problem: "P",
				"created-at": "T",
			};
			const logIndex = buildIndex([soloEntry]);
			const chain = indexedGetCausalChain(logIndex.graph, "solo", [soloEntry]);
			expect(chain).toHaveLength(1);
			expect(chain[0].id).toBe("solo");
		});

		it("should return empty if entryId not found in entries list", () => {
			const logIndex = buildIndex(mockEntries);
			const chain = indexedGetCausalChain(
				logIndex.graph,
				"nonexistent",
				mockEntries,
			);
			expect(chain).toHaveLength(0);
		});
	});

	describe("updateIndex", () => {
		it("should rebuild index with new entries", () => {
			const initialIndex = buildIndex([mockEntries[0]]);
			const newEntries = [mockEntries[0], mockEntries[1]];
			const updated = updateIndex(initialIndex, newEntries);

			expect(updated.entries).toHaveLength(2);
			expect(updated.search.byId.has("2")).toBe(true);
		});
	});

	describe("getIndexStatistics", () => {
		it("should return correct statistics", () => {
			const logIndex = buildIndex(mockEntries);
			const stats = getIndexStatistics(logIndex);

			expect(stats.totalEntries).toBe(3);
			expect(stats.graphNodes).toBe(3);
			expect(stats.ancestorsCached).toBe(3);
			expect(stats.descendantsCached).toBe(3);
			expect(stats.nameTokens).toBeGreaterThan(0);
		});
	});
});
