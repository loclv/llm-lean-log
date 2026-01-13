# llm-lean-log

> 📝 Logging for LLMs, but we cut the fat.

`llm-lean-log` is a format for logging that is optimized for LLMs token usage, cause and effect relationships based on CSV Data.

## ❌ Problems

- 🐥 `markdown` is not optimized for LLMs token usage, only for human readability.
- 🐥 `json` is not optimized for LLMs token usage, only for machine readability.
- 🐥 Best performance of LLMs token usage. This is pure tabular data, so CSV is smaller than `TOON` for flat tables. Refer to <https://github.com/toon-format/toon?tab=readme-ov-file#when-not-to-use-toon>.
- 🐥 There are many best practices for system logging, but they are not optimized for LLMs token usage and missing data structure for understanding the context of the log chat.
  - For example, log level WARNING is using for system logger, but what LLMs need to know?
- 🐥 Clean, predictable and simple format for LLMs to read past seasons of logs.
- 🐥 When LLMs write logs, should be use by a CLI tool to save logs, so LLMs no need to edit CSV file itself and it's saving time, tokens and energy.
  - 🌳 We need a efficient way to save logs for LLMs.
- 🐥 When human read CSV logs, I want a tool to view long CSV logs in a more human-friendly way.
  - 🌳 We need a efficient way to read logs for humans.
- 🌳 A local first, full control data storage for logs, documents of project, not dependent on external services like Cursor, Windsurf, TUI client, etc.
- 🐥 Very long, long and long conversation history, but LLMs can summarize it in a few words and save important information only.
  - 🌳 Do not save all conversation history, only save important information.
- 🌳 We need a reasoning-based, human-like retrieval over long documents (like <https://github.com/VectifyAI/PageIndex>).
  - Data can be Directed Acyclic Graph (<https://en.wikipedia.org/wiki/Directed_acyclic_graph>) or Directed cyclic Graph (<https://en.wikipedia.org/wiki/Directed_graph>). Cause and effect is link between nodes - chats.

## ✅ Solution

<img src="docs/imgs/graph.png" alt="Graph" width="256">

🪴 Create a simple, single, flat, CSV data format file for logs:

- 🌟 Headers are logger important fields:
  - `id`: log ID (required), UUID for unique identifier, used for Directed Graph, cause and effect.
  - `name`: main content of the log (short). (required)
  - `tags`: tags to categorize the log, comma separated. Example: `error,api,auth`. (optional)
  - `problem`: description of the problem, context of the log. (required)
  - `solution`: description of the solution, method to fix the problem. (optional)
  - `action`: run command, action (web search, etc.) that was taken to fix the problem. (optional)
    - running command format: `text {language}`\`code-block\``
      - Example of row value:

        ```text
        run bash`bun i`; then start dev server bash`bun dev`; update constants in "src/constants.ts": ts`const MY_CONSTANT = 'new value';`
        ```

      - Language is optional, but recommended for better parsing.
      - Why?
        - Better parsing and understanding of the code.
        - Learn from Markdown code blocks format, so humans can read and understand the code.
  - `files`: list of files that were modified, created, deleted or must be read (optional).
    - Example: `src/index.ts,src/constants.ts`
    - Why?
      - Better understanding of the code, context of the log.
    - Format: comma separated list of files.
  - `tech-stack`: list of technologies that were used (optional).
    - Example: `elysia,drizzle,sqlite,turso`
    - Why?
      - Better understanding of the code, context of the log.
    - Format: comma separated list of technologies.

  - `causeIds`: cause log ID of the log (optional).
    - Example: `UUID,UUID`
    - Why?
      - Better understanding of the log.
    - Format: comma separated list of other log IDs.

  - `effectIds`: effect log ID of the log (optional).
    - Example: `UUID,UUID`
    - Why?
      - Better understanding of the log.
    - Format: comma separated list of other log IDs.

  - `last-commit-short-sha`: last git commit short SHA of the log (optional).
    - Example: `a1b2c3d`
    - Why not updated git commit?
      - git commit is usually updated before when LLMs write logs.
    - Format: short SHA of the last commit.

  - `created-at`: when the log was created. (required).
    - Format: `YYYY-MM-DDTHH:mm:ssZ` (ISO 8601)
      - Example: `2025-10-15T12:34:56Z`
      - Readable for humans, machines and LLMs.
  - `updated-at`: when the log was updated (optional).
    - Format: `YYYY-MM-DDTHH:mm:ssZ` (ISO 8601)
      - Example: `2025-10-15T12:34:56Z`
      - Readable for humans, machines and LLMs.
  - `model`: model that was used (optional).
    - Example: `gpt-4o-mini`
  - `created-by-agent`: model that was used to create the log (optional).
    - Example: `gpt-4o-mini`
- Row:
  - Each row is a log entry.
  - No new lines, or use `\n`, just use comma - `,`, dot - `.`, semicolon - `;` to separate information.

## Another problems

CSV format is sometimes hard to read since it's not human-friendly, too long lines, no code-blocks support.

### Solution

Use `llm-lean-log-cli` CLI tool for viewing logs in a more human-friendly way.

```bash
bun add -g llm-lean-log-cli
```

## 💻 Usage

`llm-lean-log-cli`'s bin name is `l-log`.

For LLMs viewing logs (no need `--human` option, output is CSV format (+ auto-hide Metadata columns if empty)):

```bash
# List all log entries, output is CSV format
l-log list ./logs/example.csv
```

Expected output is CSV format for LLMs:

```text
id,name,tags,problem,solution,action,files,tech-stack,causeIds,created-at,model
auth-error-001,API Authentication Error,"error,api,auth",Users unable to login due to JWT token expiration not being handled correctly,Added token refresh logic with exponential backoff retry mechanism,Updated auth.ts middleware and added refresh endpoint,"src/middleware/auth.ts, src/routes/auth.routes.ts","typescript, express, jwt",,2026-01-13T14:52:58.681Z,claude-3.5-sonnet
db-investigation-002,Database Connection Pool Exhausted,"error,database,performance",Application crashes during high traffic due to database connection pool being exhausted,Increased pool size from 10 to 50 and added connection timeout handling,"Modified database.config.ts: ts`pool.max = 50, pool.idleTimeoutMillis = 30_000`",src/config/database.config.ts,"typescript, postgresql, node.js",auth-error-001,2026-01-13T14:52:58.681Z,gpt-4-turbo
...
```

```bash
# Show statistics
l-log stats ./logs/example.csv

# View detailed entry at index
l-log view ./logs/example.csv 0

# View the last log entry
l-log view ./logs/example.csv --last
```

Expected output is CSV format for LLMs:

```text
id,name,tags,problem,solution,action,files,tech-stack,causeIds,created-at,model
typescript-migration-006,TypeScript Migration Complete,"refactor,typescript,milestone",Codebase was in JavaScript making it hard to catch type errors,Migrated entire codebase to TypeScript with strict mode enabled,"Converted all .js files to .ts, added type definitions, configured tsconfig.json","tsconfig.json, package.json, src/**/*","typescript, node.js","auth-error-001,memory-leak-004,image-optimization-005",2026-01-13T14:52:58.681Z,gpt-4-turbo
```

```bash
# Search logs, output is CSV format
l-log search ./logs/example.csv "Database"

# Filter by tags, output is CSV format
l-log tags ./logs/example.csv error api

# Add a new log entry
l-log add ./logs/chat.csv "Fix bug" --tags=bug,fix --problem="Problem description"
```

For human users viewing logs with `--human` option:

```bash
# List all log entries
l-log list ./logs/example.csv --human
# Output: [Full beautiful table with colors and headers]

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

## 🍓 Ask AI agent (LLMs) to write a log

Before you ask AI agent (LLMs) to write a log, make sure to install `llm-lean-log-cli` CLI tool globally.

```bash
bun add -g llm-lean-log-cli
```

Ask LLMs to write a log by prompt:

> use `l-log add ./logs/chat.csv "Fix bug" --tags=bug,fix --problem="Problem description"` CLI tool to save last chat logs / talk above

Or simpler for user but less efficient for LLMs:

> use l-log CLI to save chat log above

Or:

> use l-log to save

## 🍓 Ask AI agent (LLMs) to read a log

Ask LLMs to read last log only by prompt (efficient for LLMs):

> run `l-log view ./logs/example.csv --last` CLI and read output

Ask LLMs to read all logs by prompt (less efficient for LLMs):

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

etc...

```

This is a efficient way to read logs for LLMs. Save time, tokens and energy. Because LLMs no need to read long CSV files before LLMs can write a log at the end of the log.

## 🐳 Visualizer for humans

Install `l-log-vis` (llm-lean-log-visualizer` package) globally:

```bash
bun add -g l-log-vis
```

Run visualizer:

```bash
l-log-vis ./logs/example.csv
# or
l-log-vis
```

## 🛠️ Development

- Added CLI tool for managing logs
- Added search and filter capabilities
- Added beautiful React-based Web Visualizer with code highlighting, view more at [Web Visualizer](./packages/visualizer/README.md).

To install dependencies:

```bash
bun i
```

### 🌈 Running the Application

🌱 Create example logs and run visualizer:

```bash
bun example
```

💻 CLI Usage:

```bash
# List all log entries
bun cli list

# List all log entries (compact view)
bun cli ls -c
```

```bash
# Show statistics
bun cli stats
```

Screenshots:

![CLI Stats](docs/imgs/bun-cli-stats.png)

```bash
# View detailed entry at index
bun cli view 0

# View the last log entry
bun cli view --last
```

Screenshots:

![CLI View](docs/imgs/bun-cli-view.png)

```bash
# Search logs by name, problem, or solution
bun cli search "memory"
```

Screenshots:

![CLI Search](docs/imgs/bun-cli-search.png)

```bash
# Filter logs by tags
bun cli tags error api
```

```bash
# Add a new log entry
bun cli add "Fix bug" --tags=bug,fix --problem="Bug description" --solution="Fixed the issue"
# expected: Log entry added successfully

# Show help
bun cli help
```

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## 📖 Additional information

- Publish docs: `./docs/publish.sh`
- Release docs: `./docs/release.sh`

### 💻 Use with VS Code base editor

- Install recommended extensions from `.vscode/extensions.json`, which includes:
  - `DavidAnson.vscode-markdownlint` - Markdown linting
  - `biomejs.biome` - Code formatting and linting
  - `oven-sh.bun` - Bun runtime support
  - `jeff-hykin.better-csv-syntax` - CSV syntax highlighting (with color coding)
  - `YoavBls.pretty-ts-errors` - Pretty TypeScript errors

## 📚 Coverage status

```text
----------------------------------|---------|---------|-------------------
File                              | % Funcs | % Lines | Uncovered Line #s
----------------------------------|---------|---------|-------------------
All files                         |   98.18 |   96.26 |
 packages/core/src/csv-utils.ts   |  100.00 |   99.29 | 
 packages/core/src/graph-utils.ts |   96.88 |   96.83 | 243,308-314
 packages/core/src/logger.ts      |  100.00 |   92.00 | 20,22-25
 packages/core/src/visualizer.ts  |   95.83 |   96.90 | 54-55,77-78,100-101,126-127,140-141
----------------------------------|---------|---------|-------------------
```

## TODO

- Improve visualizer web app for Directed Graph (show cause and effect).

## 📄 License

MIT
