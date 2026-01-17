# @llm-lean-log/memory-mcp

An MCP server that exposes your `llm-lean-log` history as a queryable memory for LLMs.

## Installation

This package is part of the `llm-lean-log` monorepo.

To run it locally:

```bash
cd packages/memory-mcp
bun i
bun run src/index.ts
```

## Configuration for Claude Desktop

Add this to your `claude_config.json`:

```json
{
  "mcpServers": {
    "llm-memory": {
      "command": "bun",
      "args": [
        "/absolute/path/to/llm-lean-log/packages/memory-mcp/src/index.ts"
      ],
      "env": {
        "LLM_LOG_PATH": "/absolute/path/to/your/logs/chat.csv"
      }
    }
  }
}
```

## Features

### Resources

- `memory://recent`: View the last 50 log entries.
- `memory://stats`: View statistics about your logs.

### Tools

- `search_logs(query)`: Search for specific topics or errors in your history.
- `get_task_history(taskName)`: Get all logs related to a specific task.

### Prompts

- `summarize_recent_work`: A prompt template to summarize recent activities.
