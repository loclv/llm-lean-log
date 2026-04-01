# l-log-mcp-server

The standalone MCP (Model Context Protocol) server for `llm-lean-log`. It allows AI agents to search and access your coding task history.

## MCP server with llm-lean-log

The pairing looks like:

```text
LLM runtime
-[use CLI to write log]->
llm-lean-log (token-cheap, structured CSV)
->
mcp-server
<-[use MCP to read log]->
LLM runtime
```

`llm-lean-log` become MCP memory, which gives you:

- auditability (what did the model think last week?)
- debugging (why did it choose X?)
- analytics (token burn, drift, behavior change)
- training data for fine-tuning or evals

## How to use?

1. Install globally: `bun i -g l-log-mcp-server`.
2. Add the configuration to your AI client's config file.
3. Restart your AI client to pick up the new configuration.

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
      "command": ["l-log-mcp-server"]
    }
  }
}
```

`LLM_LOG_PATH` environment variable is not required, it's automatically set to the path of your logs file inside your project by default.
If you want to use a different path, you can set it in the environment section:

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

Read more at: [docs/config-for-opencode.md](docs/config-for-opencode.md)

### Claude Desktop / Claude Code Configuration

Add this to your `claude_config.json` (Desktop) or `.claude/settings.json` (Code):

```json
{
  "mcpServers": {
    "llm-memory": {
      "command": "l-log-mcp-server"
    }
  }
}
```

`LLM_LOG_PATH` environment variable is not required, it's automatically set to the path of your logs file inside your project by default.

### Windsurf Configuration

Add this to your Windsurf global settings file at "/Users/user/.codeium/windsurf/mcp_config.json":

```json
{
  "mcpServers": {
    "llm-memory": {
      "command": "l-log-mcp-server"
    }
  }
}
```

## Features / usesage

### Resources

- `memory://recent`: View the last 50 log entries from the project history.
- `memory://stats`: View statistics about your logs (total entries, last entry date, unique tags).
- `memory://last`: View the very last log entry from the project history.

Example User Prompts:

- "Show me the last 50 log entries to see what I've been working on recently"
- "What are my project statistics? How many entries do I have and what tags have I used?"
- "What was the very last thing I worked on?"
- "up"
- "recent_work"
- "learned"

### Tools

- `search_logs(query)`: Search the log history for past problems, solutions, or topics.
- `get_task_history(taskName)`: Get all log entries related to a specific task name.

Example User Prompts:

- "Search my logs for 'database migration' using llm-memory MCP to see how I handled similar issues before"
- "Find all entries related to 'authentication system' using llm-memory MCP to understand the development history"
- "Look up any past 'build errors' using llm-memory MCP to see common solutions"
- "Look up how I solved 'TypeScript compilation errors' using llm-memory MCP in the past"

### Prompts

- `up`: A prompt for daily standup meetings - "What did I do last time and what's next?"
- `recent_work`: A prompt template to summarize recent activities based on logs.
- `learned`: Review past mistakes and lessons learned to avoid repeating them.

Example User Prompts:

- "up from llm-memory mcp"
- "recent_work from llm-memory"
- "learned from llm-memory"
- "Help me with my daily standup - what did I do last time and what's next?"
- "Summarize what I've been working on recently"
- "Based on my past mistakes, what should I be careful about in this project?"

### Postinstall

The package includes a `postinstall` script to streamline the setup process for new users.

Why it's needed: Setting up an MCP server requires specific configuration (like environment variables and command paths) that can be easily overlooked. The postinstall script provides an immediate, copy-paste-able configuration snippet tailored for your client (like OpenCode) right after installation.

How it runs: This script is triggered automatically by your package manager (`bun`, `npm`, or `yarn`) immediately after the global or local installation of `l-log-mcp-server` finishes.

Example output during installation:

```text
l-log-mcp-server summary:
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

### CLI Usage

```bash
l-log-mcp-server --help
```

### Install from source

```bash
cd packages/mcp-server
bun i
bun run build
```

## Skills / Rules Sample

To help AI agents understand and use this MCP server effectively, you can add the following to your agent's rules or skills configuration:

### Sample Agent Rule (e.g., `.agent/rules/llm-memory.md`)

```markdown
# LLM Memory MCP Server

This project uses `llm-memory` MCP server to maintain a history of development tasks.

## Context Retrieval

Use MCP server tools:

- `search_logs(query)` - Find how problems were solved
- `get_task_history(taskName)` - See feature progression

## Resources

- `memory://recent` - View the last 8 log entries
- `memory://last` - View the very last log entry with full details
- `memory://stats` - View statistics about your logs

## Prompts

- `recent_work` - Overview of recent work
- `up` - Daily standup context
- `learned` - Review past mistakes

## Work Logging

Always log your work after completing a task using the l-log CLI.
```

### Sample OpenCode Skill (e.g., `~/.opencode/skills/llm-memory.md`)

```markdown
---
description: Search and retrieve past development task history
---

Use the llm-memory MCP server to:

- Search for past solutions: `search_logs("error message or topic")`
- Get task history: `get_task_history("feature-name")`
- View recent work: access `memory://recent` resource
- Review lessons learned: use `learned` prompt

When encountering an error, first search logs to see if this problem was solved before.
```

---

For more details about the core logic, see [mcp/README.md](../mcp/README.md).
