# llm-lean-log-cli

> 💻 CLI tool for llm-lean-log - Logging for LLMs, but we cut the fat.

## 🚀 Installation

```bash
bun add -g llm-lean-log-cli
```

## 💻 Usage

```bash
# List all log entries
llm-lean-log list ./logs/example.csv

# Show statistics
llm-lean-log stats ./logs/example.csv

# View detailed entry at index
llm-lean-log view ./logs/example.csv 0

# Search logs
llm-lean-log search ./logs/example.csv "query"

# Filter by tags
llm-lean-log tags ./logs/example.csv tag1 tag2

# Add a new log entry
llm-lean-log add ./logs/example.csv "Fix bug" --tags=bug,fix --problem="Problem description"
```

## Ask AI agent (LLMs) to write a log

> use llm-lean-log-cli to save last chat logs / talk above

## Ask AI agent (LLMs) to read a log

> read last chat logs from "./logs/example.csv" and tell me what should I do next

Example LLMs's response:

```text
Based on the last entry in ./logs/example.csv and the current state of your repository, here is what you should do next:

### Current Status

The last task completed was "Make llm-lean-log packages public". This involved:

- Updating package.json for both llm-lean-log-core and llm-lean-log-cli with repository info, files, and publishConfig.
- Adding LICENSE and README.md files.
- Configuring the CLI as an executable.
- Creating the guide at docs/public.md.

### Recommended Next Steps

1. Perform a Dry Run
Before pushing to NPM, ensure that the files being packaged are correct. Run this from the root:

...
```

## 📖 About

`llm-lean-log` is a format for logging that is optimized for LLM token usage, using a simple CSV-based structure.

For more information, see the [main repository](https://github.com/loclv/llm-lean-log).

## 📄 License

MIT
