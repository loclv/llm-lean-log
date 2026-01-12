# llm-lean-log-core

> 📦 Core library for llm-lean-log - Logging for LLMs, but we cut the fat.

This package contains the core logic for parsing, saving, and visualizing logs in the `llm-lean-log` format.

## 🚀 Installation

```bash
bun add llm-lean-log-core
```

## 📦 Usage

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

## 📄 License

MIT
