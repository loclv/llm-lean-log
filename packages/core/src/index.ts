/**
 * llm-lean-log - Logging for LLMs, but we cut the fat.
 *
 * A CSV-based logging format optimized for LLM token usage.
 */

export {
	csvRowToLogEntry,
	csvToLogEntries,
	logEntriesToCSV,
	logEntriesToCSVMinimal,
	logEntryToCSVRow,
} from "./csv-utils";
export {
	buildGraph,
	findShortestPath,
	formatIds,
	getAncestors,
	getCausalChain,
	getDescendants,
	getGraphStatistics,
	getStronglyConnectedComponents,
	hasCycles,
	parseIds,
	reasoningSearch,
} from "./graph-utils";
export {
	buildGraphIndex,
	buildIndex,
	buildSearchIndex,
	getIndexStatistics,
	indexedFilterByTags,
	indexedGetAncestors,
	indexedGetCausalChain,
	indexedGetDescendants,
	indexedSearch,
	updateIndex,
} from "./indexer";
export type { GraphIndex, LogIndex, SearchIndex } from "./indexer";
export {
	addLogEntry,
	createLogEntry,
	filterByTags,
	loadLogs,
	saveLogs,
	searchLogs,
	updateLogEntry,
} from "./logger";
export type { LogEntry } from "./types";
