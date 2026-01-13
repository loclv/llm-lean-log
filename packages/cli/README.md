# llm-lean-log-cli

> 💻 CLI tool for llm-lean-log - Logging for LLMs, but we cut the fat.

`llm-lean-log` is a format for logging that is optimized for LLM token usage, using a simple CSV-based structure.

For more information, see the [main repository](https://github.com/loclv/llm-lean-log).

## 🚀 Installation

```bash
bun add -g llm-lean-log-cli
```

## 💻 Usage

For LLMs viewing logs (default output is structured CSV):

```bash
# List all log entries (returns CSV, omits empty columns)
l-log list ./logs/example.csv

# Show statistics
l-log stats ./logs/example.csv

# View detailed entry at index (returns minimal CSV)
l-log view ./logs/example.csv 0

# View the last log entry
l-log view ./logs/example.csv --last

# Search logs (returns CSV)
l-log search ./logs/example.csv "query"

# Filter by tags (returns CSV)
l-log tags ./logs/example.csv tag1 tag2

# Add a new log entry
l-log add ./logs/example.csv "Fix bug" --tags=bug,fix --problem="Problem description"
```

For human users viewing logs:

```bash
# List all log entries
l-log list ./logs/example.csv --human

# Show statistics
l-log stats ./logs/example.csv --human

# View detailed entry at index
l-log view ./logs/example.csv 0 --human

# Search logs
l-log search ./logs/example.csv "query" --human

# Filter by tags
l-log tags ./logs/example.csv tag1 tag2 --human

# Add a new log entry
l-log add ./logs/example.csv "Fix bug" --tags=bug,fix --problem="Problem description"
```

## Ask AI agent (LLMs) to write a log

> use `l-log` to save last chat logs / talk above

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

## 📖 Additional information

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

### 💻 Use with VS Code base editor

- Install recommended extensions from `.vscode/extensions.json`, which includes:
  - `DavidAnson.vscode-markdownlint` - Markdown linting
  - `biomejs.biome` - Code formatting and linting
  - `oven-sh.bun` - Bun runtime support
  - `jeff-hykin.better-csv-syntax` - CSV syntax highlighting (with color coding)
  - `YoavBls.pretty-ts-errors` - Pretty TypeScript errors

## 📄 License

MIT
