/**
 * Indexing system for efficient retrieval of log entries
 * Provides fast search and graph-based queries
 */

import { buildGraph, parseIds } from "./graph-utils";
import type { LogEntry } from "./types";

/**
 * Search index for fast text search
 */
export interface SearchIndex {
	byName: Map<string, LogEntry[]>;
	byProblem: Map<string, LogEntry[]>;
	bySolution: Map<string, LogEntry[]>;
	byTags: Map<string, LogEntry[]>;
	byFiles: Map<string, LogEntry[]>;
	byTechStack: Map<string, LogEntry[]>;
	byId: Map<string, LogEntry>;
}

/**
 * Graph index for fast causal relationship queries
 */
export interface GraphIndex {
	graph: Map<string, { causes: string[]; effects: string[] }>;
	ancestorsCache: Map<string, LogEntry[]>;
	descendantsCache: Map<string, LogEntry[]>;
}

/**
 * Combined index for all operations
 */
export interface LogIndex {
	search: SearchIndex;
	graph: GraphIndex;
	entries: LogEntry[];
}

/**
 * Tokenize text into searchable terms
 */
function tokenize(text: string): string[] {
	if (!text) return [];

	return text
		.toLowerCase()
		.replace(/[^\w\s]/g, " ")
		.split(/\s+/)
		.filter((word) => word.length > 2); // Only keep words longer than 2 chars
}

/**
 * Build search index from log entries
 */
export function buildSearchIndex(entries: LogEntry[]): SearchIndex {
	const index: SearchIndex = {
		byName: new Map(),
		byProblem: new Map(),
		bySolution: new Map(),
		byTags: new Map(),
		byFiles: new Map(),
		byTechStack: new Map(),
		byId: new Map(),
	};

	for (const entry of entries) {
		// Index by ID for direct lookup
		index.byId.set(entry.id, entry);

		// Index by name tokens
		const nameTokens = tokenize(entry.name);
		for (const token of nameTokens) {
			if (!index.byName.has(token)) {
				index.byName.set(token, []);
			}
			index.byName.get(token)?.push(entry);
		}

		// Index by problem tokens
		if (entry.problem) {
			const problemTokens = tokenize(entry.problem);
			for (const token of problemTokens) {
				if (!index.byProblem.has(token)) {
					index.byProblem.set(token, []);
				}
				index.byProblem.get(token)?.push(entry);
			}
		}

		// Index by solution tokens
		if (entry.solution) {
			const solutionTokens = tokenize(entry.solution);
			for (const token of solutionTokens) {
				if (!index.bySolution.has(token)) {
					index.bySolution.set(token, []);
				}
				index.bySolution.get(token)?.push(entry);
			}
		}

		// Index by tags
		if (entry.tags) {
			const tags = parseIds(entry.tags);
			for (const tag of tags) {
				const normalizedTag = tag.toLowerCase().trim();
				if (!index.byTags.has(normalizedTag)) {
					index.byTags.set(normalizedTag, []);
				}
				index.byTags.get(normalizedTag)?.push(entry);
			}
		}

		// Index by files
		if (entry.files) {
			const files = parseIds(entry.files);
			for (const file of files) {
				const normalizedFile = file.toLowerCase().trim();
				if (!index.byFiles.has(normalizedFile)) {
					index.byFiles.set(normalizedFile, []);
				}
				index.byFiles.get(normalizedFile)?.push(entry);
			}
		}

		// Index by tech stack
		if (entry["tech-stack"]) {
			const techStack = parseIds(entry["tech-stack"]);
			for (const tech of techStack) {
				const normalizedTech = tech.toLowerCase().trim();
				if (!index.byTechStack.has(normalizedTech)) {
					index.byTechStack.set(normalizedTech, []);
				}
				index.byTechStack.get(normalizedTech)?.push(entry);
			}
		}
	}

	return index;
}

/**
 * Build graph index with caching for efficient traversal
 */
export function buildGraphIndex(entries: LogEntry[]): GraphIndex {
	const graph = buildGraph(entries);
	const _entryMap = new Map(entries.map((e) => [e.id, e]));

	// Pre-compute ancestors and descendants for all nodes
	const ancestorsCache = new Map<string, LogEntry[]>();
	const descendantsCache = new Map<string, LogEntry[]>();

	for (const entry of entries) {
		ancestorsCache.set(entry.id, getAncestors(entries, entry.id));
		descendantsCache.set(entry.id, getDescendants(entries, entry.id));
	}

	return {
		graph,
		ancestorsCache,
		descendantsCache,
	};
}

/**
 * Get ancestors using cached index
 */
function getAncestors(entries: LogEntry[], entryId: string): LogEntry[] {
	const graph = buildGraph(entries);
	const ancestors: LogEntry[] = [];
	const entryMap = new Map(entries.map((e) => [e.id, e]));
	const visited = new Set<string>();

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
 * Get descendants using cached index
 */
function getDescendants(entries: LogEntry[], entryId: string): LogEntry[] {
	const graph = buildGraph(entries);
	const descendants: LogEntry[] = [];
	const entryMap = new Map(entries.map((e) => [e.id, e]));
	const visited = new Set<string>();

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
 * Build complete index for all operations
 */
export function buildIndex(entries: LogEntry[]): LogIndex {
	return {
		search: buildSearchIndex(entries),
		graph: buildGraphIndex(entries),
		entries,
	};
}

/**
 * Fast search using the index
 */
export function indexedSearch(index: SearchIndex, query: string): LogEntry[] {
	const tokens = tokenize(query);
	const results = new Set<LogEntry>();

	for (const token of tokens) {
		// Search in all indexes
		const nameResults = index.byName.get(token) || [];
		const problemResults = index.byProblem.get(token) || [];
		const solutionResults = index.bySolution.get(token) || [];
		const tagResults = index.byTags.get(token) || [];
		const fileResults = index.byFiles.get(token) || [];
		const techResults = index.byTechStack.get(token) || [];

		[
			...nameResults,
			...problemResults,
			...solutionResults,
			...tagResults,
			...fileResults,
			...techResults,
		].forEach((entry) => {
			results.add(entry);
		});
	}

	return Array.from(results);
}

/**
 * Fast tag filtering using the index
 */
export function indexedFilterByTags(
	index: SearchIndex,
	tags: string[],
): LogEntry[] {
	const results = new Set<LogEntry>();

	for (const tag of tags) {
		const normalizedTag = tag.toLowerCase().trim();
		const tagResults = index.byTags.get(normalizedTag) || [];
		tagResults.forEach((entry) => {
			results.add(entry);
		});
	}

	return Array.from(results);
}

/**
 * Get ancestors using cached graph index
 */
export function indexedGetAncestors(
	index: GraphIndex,
	entryId: string,
): LogEntry[] {
	return index.ancestorsCache.get(entryId) || [];
}

/**
 * Get descendants using cached graph index
 */
export function indexedGetDescendants(
	index: GraphIndex,
	entryId: string,
): LogEntry[] {
	return index.descendantsCache.get(entryId) || [];
}

/**
 * Get causal chain using cached graph index
 */
export function indexedGetCausalChain(
	index: GraphIndex,
	entryId: string,
	entries: LogEntry[],
): LogEntry[] {
	const ancestors = indexedGetAncestors(index, entryId);
	const descendants = indexedGetDescendants(index, entryId);
	const currentEntry = entries.find((e) => e.id === entryId);

	return [
		...ancestors,
		...(currentEntry ? [currentEntry] : []),
		...descendants,
	];
}

/**
 * Update index when entries change
 */
export function updateIndex(
	_index: LogIndex,
	newEntries: LogEntry[],
): LogIndex {
	return buildIndex(newEntries);
}

/**
 * Get index statistics
 */
export function getIndexStatistics(index: LogIndex) {
	const { search, graph } = index;

	return {
		totalEntries: index.entries.length,
		nameTokens: search.byName.size,
		problemTokens: search.byProblem.size,
		solutionTokens: search.bySolution.size,
		tags: search.byTags.size,
		files: search.byFiles.size,
		techStack: search.byTechStack.size,
		graphNodes: graph.graph.size,
		ancestorsCached: graph.ancestorsCache.size,
		descendantsCached: graph.descendantsCache.size,
	};
}
