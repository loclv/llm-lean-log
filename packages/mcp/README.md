# l-log-mcp

An MCP server that exposes your `llm-lean-log` history as a queryable memory for LLMs.

## Installation

This package is part of the `llm-lean-log` monorepo.

To run the standalone server locally:

```bash
cd packages/mcp-server
bun i
bun run src/index.ts
```

### Quick Test

To verify your setup, run the server with a test log file:

```bash
LLM_LOG_PATH="/path/to/your/chat.csv" bun run src/index.ts
```

The server should start without errors and show available resources and tools.

## Configuration for Claude Desktop

Important: The MCP server requires the `LLM_LOG_PATH` environment variable to point to your chat log file.

Add this to your `claude_config.json`:

```json
{
  "mcpServers": {
    "llm-memory": {
      "command": "bun",
      "args": [
        "/absolute/path/to/llm-lean-log/packages/mcp-server/src/index.ts"
      ],
      "env": {
        "LLM_LOG_PATH": "/absolute/path/to/your/logs/chat.csv"
      }
    }
  }
}
```

## Configuration for OpenCode

Important: The MCP server requires the `LLM_LOG_PATH` environment variable to point to your chat log file.

Add this to your `opencode.json` or `.opencode.json` (usually located at `~/.opencode.json` or in your project root):

```json
{
  "mcp": {
    "llm-memory": {
      "type": "local",
      "command": [
        "bun",
        "/absolute/path/to/llm-lean-log/packages/mcp-server/src/index.ts"
      ],
      "environment": {
        "LLM_LOG_PATH": "/absolute/path/to/your/logs/chat.csv"
      }
    }
  }
}
```

### Setup Steps for OpenCode

1. Open your OpenCode configuration file (e.g., `~/.opencode.json`).
2. Add the `llm-memory` configuration inside the `mcp` object.
3. Modify the absolute paths to point to your local installation:
   - Command path: `/absolute/path/to/llm-lean-log/packages/mcp-server/src/index.ts`
   - Log path: `/absolute/path/to/your/logs/chat.csv`
4. Restart your OpenCode session.
5. Create or update `AGENTS.md` in your project root to provide instructions to the AI agent on how to use these tools (see the [AGENTS.md](../../AGENTS.md) file for an example):

```text
# Project Rules for OpenCode

This project uses `llm-lean-log` to maintain a history of development tasks. As an AI agent working on this project, you must follow these rules:

## Work Logging

Whenever you finish a task or modify code, you must log your work using the `l-log` CLI.

Command Format: `l-log add ./logs/chat.csv "<Task Name>" --tags="<tags>" --problem="<problem>" --solution="<solution>" --action="<action>" --files="<files>" --tech-stack="<tech>" --cause="<cause>" --created-by-agent="OpenCode"`

Ensure log path: `./logs/chat.csv`

## Context Retrieval (MCP)

This project has an MCP server `llm-memory` configured. Use it to retrieve context from previous tasks:

- Use `search_logs(query)` to find how previous problems were solved.
- Use `get_task_history(taskName)` to see the progression of a specific feature.
- Use the `recent_work` prompt to get an overview of what has been done recently.
- Use the `learned` prompt to review past mistakes and lessons learned to avoid repeating them.
- Use the `up` prompt to get an overview of what has been done recently.

```

## Features

### Resources

- `memory://recent`: View the last 8 log entries.
- `memory://last`: View the very last log entry with full details.
- `memory://stats`: View statistics about your logs.

### Tools

- `search_logs(query)`: Search for specific topics or errors in your history.
- `get_task_history(taskName)`: Get all logs related to a specific task.

### Prompts

- `recent_work`: A prompt template to summarize recent activities.
- `learned`: Review past mistakes and lessons learned to avoid repeating them.

## Test the MCP server

```bash
LLM_LOG_PATH="/absolute/path/to/your/logs/chat.csv" bun run src/index.ts
```

Test the MCP server by trying to run it with a simple JSON-RPC request:

```bash
 echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0"}}}' | bun src/index.ts
```

Expected response:

```txt
Starting MCP server with log path: ./logs/chat.csv
MCP Server is running on stdio
{"result":{"protocolVersion":"2024-11-05","capabilities":{"resources":{"listChanged":true},"tools":{"listChanged":true},"prompts":{"listChanged":true}},"serverInfo":{"name":"l-log-mcp-server","version":"0.1.0"}},"jsonrpc":"2.0","id":1}
```

Test the tools/list endpoint:

```bash
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}' | bun src/index.ts
```

Expected response:

```txt
Starting MCP server with log path: ./logs/chat.csv
MCP Server is running on stdio
{"result":{"tools":[{"name":"search_logs","description":"Search the log history for past problems, solutions, or topics.","inputSchema":{"$schema":"http://json-schema.org/draft-07/schema#","type":"object","properties":{"query":{"type":"string","description":"The search query (e.g. 'build error', 'database migration')"}},"required":["query"]},"execution":{"taskSupport":"forbidden"}},{"name":"get_task_history","description":"Get all log entries related to a specific task name.","inputSchema":{"$schema":"http://json-schema.org/draft-07/schema#","type":"object","properties":{"taskName":{"type":"string","description":"The exact or partial task name to filter by."}},"required":["taskName"]},"execution":{"taskSupport":"forbidden"}}]},"jsonrpc":"2.0","id":2}
```

Ask `search_logs "CSV parsing"`:

Expected response:

```text
I'll search the logs for "CSV parsing" to find relevant entries.

Found 2 log entries containing "CSV parsing":
1. Implement Memory MCP (2026-01-17T16:28:57.632Z)
- Tags: mcp, implementation, feature
- Problem: Need to implement the Memory MCP server as per the roadmap
- Solution: Created packages/memory-mcp, implemented basic server with Resources (recent, stats), Tools (search_logs, get_task_history), and Prompts (recent_work). Used llm-lean-log-core for CSV parsing
- Files: packages/memory-mcp/package.json, packages/memory-mcp/src/index.ts, packages/memory-mcp/src/data-access.ts, packages/memory-mcp/README.md
- Tech Stack: bun, typescript, mcp-sdk
- Agent: Antigravity
2. Verify CSV Column Order (2026-01-17T16:25:58.250Z)
- Tags: test, core, typescript
- Problem: Need to ensure CSV parsing handles arbitrary column orders and gracefully handles schema changes (missing/extra columns)
- Solution: Added order-of-col.test.ts with tests for scrambled headers, missing columns, and extra columns
- Files: packages/core/src/order-of-col.test.ts
- Tech Stack: typescript, bun-test
- Agent: Antigravity
The CSV parsing functionality is primarily implemented in the llm-lean-log-core package and used by the Memory MCP server for data access.
```

## Troubleshooting

### Common Issues

Server fails to start:

- Ensure `LLM_LOG_PATH` is set and points to a valid CSV file
- Check that the file path is absolute, not relative

Path not found errors:

- Use absolute paths in configuration files
- On macOS/Linux, paths start with `/Users/...` or `/home/...`
- On Windows, use forward slashes or escaped backslashes

Permission denied:

- Ensure the log file is readable by the user running the MCP server
- Check directory permissions for the log file location

No resources/tools available:

- Verify the server started successfully (check console output)
- Ensure the MCP client is properly configured to connect to the server
