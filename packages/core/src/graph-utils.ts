/**
 * Graph utilities for reasoning-based retrieval over log entries
 * Supports Directed Acyclic Graph (DAG) and Directed cyclic Graph structures
 */

import type { LogEntry } from "./types";

/**
 * Parse comma-separated IDs into an array
 */
export function parseIds(ids?: string): string[] {
	if (!ids) return [];
	return ids
		.split(",")
		.map((id) => id.trim())
		.filter(Boolean);
}

/**
 * Convert array of IDs to comma-separated string
 */
export function formatIds(ids: string[]): string {
	return ids.join(",");
}

/**
 * Build adjacency list from log entries for graph traversal
 */
export function buildGraph(
	entries: LogEntry[],
): Map<string, { causes: string[]; effects: string[] }> {
	const graph = new Map<string, { causes: string[]; effects: string[] }>();

	// Initialize all nodes
	for (const entry of entries) {
		graph.set(entry.id, { causes: [], effects: [] });
	}

	// Build edges
	for (const entry of entries) {
		const causeIds = parseIds(entry.causeIds);
		const effectIds = parseIds(entry.effectIds);

		const node = graph.get(entry.id);
		if (node) {
			node.causes = causeIds;
			node.effects = effectIds;
		}
	}

	return graph;
}

/**
 * Get all ancestors (causes) of a log entry using DFS
 */
export function getAncestors(
	entries: LogEntry[],
	entryId: string,
	visited: Set<string> = new Set(),
): LogEntry[] {
	const graph = buildGraph(entries);
	const ancestors: LogEntry[] = [];
	const entryMap = new Map(entries.map((e) => [e.id, e]));

	function dfs(id: string): void {
		if (visited.has(id)) return;
		visited.add(id);

		const node = graph.get(id);
		if (!node) return;

		for (const causeId of node.causes) {
			const causeEntry = entryMap.get(causeId);
			if (causeEntry && !ancestors.includes(causeEntry)) {
				ancestors.push(causeEntry);
			}
			dfs(causeId);
		}
	}

	dfs(entryId);
	return ancestors;
}

/**
 * Get all descendants (effects) of a log entry using DFS
 */
export function getDescendants(
	entries: LogEntry[],
	entryId: string,
	visited: Set<string> = new Set(),
): LogEntry[] {
	const graph = buildGraph(entries);
	const descendants: LogEntry[] = [];
	const entryMap = new Map(entries.map((e) => [e.id, e]));

	function dfs(id: string): void {
		if (visited.has(id)) return;
		visited.add(id);

		const node = graph.get(id);
		if (!node) return;

		for (const effectId of node.effects) {
			const effectEntry = entryMap.get(effectId);
			if (effectEntry && !descendants.includes(effectEntry)) {
				descendants.push(effectEntry);
			}
			dfs(effectId);
		}
	}

	dfs(entryId);
	return descendants;
}

/**
 * Get the full causal chain (both ancestors and descendants) of a log entry
 */
export function getCausalChain(
	entries: LogEntry[],
	entryId: string,
): LogEntry[] {
	const ancestors = getAncestors(entries, entryId);
	const descendants = getDescendants(entries, entryId);
	const currentEntry = entries.find((e) => e.id === entryId);

	return [
		...ancestors.reverse(), // Show ancestors in chronological order
		...(currentEntry ? [currentEntry] : []),
		...descendants, // Show descendants in chronological order
	];
}

/**
 * Find log entries that are on the shortest path between two entries
 */
export function findShortestPath(
	entries: LogEntry[],
	fromId: string,
	toId: string,
): LogEntry[] {
	const graph = buildGraph(entries);
	const entryMap = new Map(entries.map((e) => [e.id, e]));

	// BFS to find shortest path
	const queue: { id: string; path: string[] }[] = [
		{ id: fromId, path: [fromId] },
	];
	const visited = new Set<string>([fromId]);

	while (queue.length > 0) {
		const { id, path } = queue.shift()!;

		if (id === toId) {
			return path
				.map((pathId) => {
					const entry = entryMap.get(pathId);
					return entry || null;
				})
				.filter((entry): entry is LogEntry => entry !== null);
		}

		const node = graph.get(id);
		if (!node) continue;

		for (const neighbor of [...node.causes, ...node.effects]) {
			if (!visited.has(neighbor)) {
				visited.add(neighbor);
				queue.push({ id: neighbor, path: [...path, neighbor] });
			}
		}
	}

	return [];
}

/**
 * Detect if the graph contains cycles
 * Only follows causeIds (backward in time) to detect actual temporal cycles
 */
export function hasCycles(entries: LogEntry[]): boolean {
	const graph = buildGraph(entries);
	const visited = new Set<string>();
	const recursionStack = new Set<string>();

	function hasCycle(id: string): boolean {
		if (recursionStack.has(id)) return true;
		if (visited.has(id)) return false;

		visited.add(id);
		recursionStack.add(id);

		const node = graph.get(id);
		if (node) {
			// Check for self-loop in causes
			if (node.causes.includes(id)) {
				return true;
			}

			// Only follow causes (backward in time) to detect temporal cycles
			for (const neighbor of node.causes) {
				if (hasCycle(neighbor)) return true;
			}
		}

		recursionStack.delete(id);
		return false;
	}

	for (const entry of entries) {
		if (!visited.has(entry.id) && hasCycle(entry.id)) {
			return true;
		}
	}

	return false;
}

/**
 * Get strongly connected components (cycles) in the graph
 * Only follows causeIds (backward in time) to detect actual temporal cycles
 */
export function getStronglyConnectedComponents(
	entries: LogEntry[],
): LogEntry[][] {
	const graph = buildGraph(entries);
	const entryMap = new Map(entries.map((e) => [e.id, e]));
	const components: LogEntry[][] = [];

	// Check for self-loops first
	for (const entry of entries) {
		const node = graph.get(entry.id);
		if (node?.causes.includes(entry.id)) {
			components.push([entry]);
		}
	}

	// Find actual cycles (multiple nodes) - only follow causes
	const visited = new Set<string>();

	function dfs(id: string, path: string[], allPaths: string[][]): void {
		if (visited.has(id)) return;

		path.push(id);

		const node = graph.get(id);
		if (node) {
			for (const neighbor of node.causes) {
				if (path.includes(neighbor)) {
					// Found a cycle
					const cycleStart = path.indexOf(neighbor);
					const cycle = path.slice(cycleStart);
					allPaths.push([...cycle]);
				} else if (!visited.has(neighbor)) {
					dfs(neighbor, [...path], allPaths);
				}
			}
		}
	}

	const allCycles: string[][] = [];
	for (const entry of entries) {
		if (!visited.has(entry.id)) {
			dfs(entry.id, [], allCycles);
			// Mark all nodes in cycles as visited
			allCycles.forEach((cycle) => {
				cycle.forEach((id) => {
					visited.add(id);
				});
			});
		}
	}

	// Convert cycles to LogEntry arrays, removing duplicates
	const uniqueCycles = new Set<string>();
	for (const cycle of allCycles) {
		if (cycle.length > 1) {
			const cycleKey = cycle.sort().join(",");
			if (!uniqueCycles.has(cycleKey)) {
				uniqueCycles.add(cycleKey);
				components.push(
					cycle
						.map((id) => {
							const entry = entryMap.get(id);
							return entry || null;
						})
						.filter((entry): entry is LogEntry => entry !== null),
				);
			}
		}
	}

	return components;
}

/**
 * Check if an entry has a self-loop (points to itself)
 */
function _hasSelfLoop(entries: LogEntry[], entryId: string): boolean {
	const entry = entries.find((e) => e.id === entryId);
	if (!entry) return false;

	const causeIds = parseIds(entry.causeIds);
	const effectIds = parseIds(entry.effectIds);

	return causeIds.includes(entryId) || effectIds.includes(entryId);
}

/**
 * Reasoning-based retrieval: find entries relevant to a query considering causal relationships
 */
export function reasoningSearch(
	entries: LogEntry[],
	query: string,
	maxDepth: number = 3,
): LogEntry[] {
	const lowerQuery = query.toLowerCase();

	// Find direct matches
	const directMatches = entries.filter((entry) => {
		return (
			entry.name.toLowerCase().includes(lowerQuery) ||
			entry.problem?.toLowerCase().includes(lowerQuery) ||
			entry.solution?.toLowerCase().includes(lowerQuery) ||
			entry.files?.toLowerCase().includes(lowerQuery) ||
			entry["tech-stack"]?.toLowerCase().includes(lowerQuery)
		);
	});

	// Get causal context for each match
	const relevantEntries = new Set<LogEntry>(directMatches);

	for (const match of directMatches) {
		const ancestors = getAncestors(entries, match.id).slice(0, maxDepth);
		const descendants = getDescendants(entries, match.id).slice(0, maxDepth);

		ancestors.forEach((e) => {
			relevantEntries.add(e);
		});
		descendants.forEach((e) => {
			relevantEntries.add(e);
		});
	}

	return Array.from(relevantEntries);
}

/**
 * Get entry statistics including graph metrics
 */
export function getGraphStatistics(entries: LogEntry[]) {
	const graph = buildGraph(entries);
	const cycles = getStronglyConnectedComponents(entries);

	let totalEdges = 0;
	let maxDegree = 0;
	const degrees: number[] = [];

	for (const [_id, node] of graph) {
		const degree = node.causes.length + node.effects.length;
		totalEdges += degree;
		maxDegree = Math.max(maxDegree, degree);
		degrees.push(degree);
	}

	const avgDegree = degrees.length > 0 ? totalEdges / degrees.length : 0;

	return {
		totalNodes: entries.length,
		totalEdges: totalEdges / 2, // Each edge counted twice (once as cause, once as effect)
		hasCycles: hasCycles(entries),
		cyclesCount: cycles.length,
		maxDegree,
		avgDegree: Math.round(avgDegree * 100) / 100,
	};
}
