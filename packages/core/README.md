# llm-lean-log-core

>📦 Core library for llm-lean-log - Logging for LLMs, but we cut the fat.
`llm-lean-log` is a format for logging that is optimized for LLM token usage, using a simple CSV-based structure.

For more information, see the [main repository](https://github.com/loclv/llm-lean-log).
This package contains the core logic for parsing, saving, and visualizing logs in the `llm-lean-log` format.

## 🚀 Installation

```bash
bun add llm-lean-log-core
```

## 📦 Usage

### Managing Logs

```typescript
import { loadLogs, addLogEntry, saveLogs } from "llm-lean-log-core";

// Load logs
let entries = await loadLogs("logs.csv");

// Add an entry
entries = addLogEntry(entries, {
  name: "My Log",
  problem: "Something happened",
  tags: "tag1,tag2"
});

// Save logs
await saveLogs("logs.csv", entries);
```

### Visualizing Logs

```typescript
import { visualizeTable, visualizeEntry } from "llm-lean-log-core";

// Get LLM-optimized CSV output (omits empty columns)
const llmTable = visualizeTable(entries, { llm: true });

// Get Human-friendly formatted output (with colors and boxes)
const humanEntry = visualizeEntry(entries[0], { colors: true });
```

### Advanced CSV Export

```typescript
import { logEntriesToCSVMinimal } from "llm-lean-log-core";

// Export entries to CSV, automatically removing columns that are empty for all rows
const minimalCsv = logEntriesToCSVMinimal(entries);
```

### JSONL Export

```typescript
import { 
  logEntriesToJSONL, 
  saveLogsToJSONL, 
  loadLogsFromJSONL,
  jsonlToLogEntries 
} from "llm-lean-log-core";

// Convert entries to JSONL format (one JSON object per line)
const jsonlContent = logEntriesToJSONL(entries);

// Save entries to JSONL file
await saveLogsToJSONL("logs.jsonl", entries);

// Load entries from JSONL file
const loadedEntries = await loadLogsFromJSONL("logs.jsonl");

// Parse JSONL string back to entries
const parsedEntries = jsonlToLogEntries(jsonlContent);
```

## 📄 License

MIT
