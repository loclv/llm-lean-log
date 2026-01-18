# l-log-mcp-server

The standalone MCP (Model Context Protocol) server for `llm-lean-log`. It allows AI agents to search and access your coding task history.

## Installation

### Global Installation (Recommended)

Install globally using `bun`:

```bash
bun i -g l-log-mcp-server
```

### From Source

```bash
cd packages/mcp-server
bun i
bun run build
```

## Quick Start Configuration

After installing globally, you can get the configuration snippets for your favorite AI client by running:

```bash
l-log-mcp-server --config
```

### OpenCode Configuration

Add this to your `~/.opencode.json`:

```json
{
  "mcp": {
    "llm-memory": {
      "type": "local",
      "command": ["l-log-mcp-server"],
      "environment": {
        "LLM_LOG_PATH": "/absolute/path/to/your/logs/chat.csv"
      }
    }
  }
}
```

### Claude Desktop Configuration

Add this to your `claude_config.json`:

```json
{
  "mcpServers": {
    "llm-memory": {
      "command": "l-log-mcp-server",
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

### Postinstall

The package includes a `postinstall` script to streamline the setup process for new users.

Why it's needed: Setting up an MCP server requires specific configuration (like environment variables and command paths) that can be easily overlooked. The postinstall script provides an immediate, copy-pasteable configuration snippet tailored for your client (like OpenCode) right after installation.

How it runs: This script is triggered automatically by your package manager (`bun`, `npm`, or `yarn`) immediately after the global or local installation of `l-log-mcp-server` finishes.

Example output during installation:

```text
✨ l-log-mcp-server summary:
To use this with OpenCode, add the following to your ~/.opencode.json:
{
  "mcp": {
    "llm-memory": {
      "type": "local",
      "command": [
        "l-log-mcp-server"
      ],
      "environment": {
        "LLM_LOG_PATH": "/absolute/path/to/your/logs/chat.csv"
      }
    }
  }
}

Note: Replace /absolute/path/to/your/logs/chat.csv with the actual path to your chat.csv file.
You can also get this config anytime by running: l-log-mcp-server --config
```

---

For more details about the core logic, see [mcp/README.md](../mcp/README.md).
