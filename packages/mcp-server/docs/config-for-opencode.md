# Configuration for OpenCode

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

## Setup Steps for OpenCode

1. Open your OpenCode configuration file (e.g., `~/.opencode.json`).
2. Add the `llm-memory` configuration inside the `mcp` object.
3. Modify the absolute paths to point to your local installation:
   - Command path: `/absolute/path/to/llm-lean-log/packages/mcp-server/src/index.ts`
   - Log path: `/absolute/path/to/your/logs/chat.csv`
4. Restart your OpenCode session.
5. Create or update `AGENTS.md` in your project root to provide instructions to the AI agent on how to use these tools:

```text
# Project Rules for OpenCode

This project uses `llm-lean-log` to maintain a history of development tasks. As an AI agent working on this project, you must follow these rules:

## Work Logging

Whenever you finish a task or modify code, you must log your work using the `l-log` CLI.

Command Format: `l-log add ./logs/chat.csv "<Task Name>" --tags="<tags>" --problem="<problem>" --solution="<solution>" --action="<action>" --files="<files>" --tech-stack="<tech>" --last-commit-short-sha="<short-sha>" --cause="<cause>" --created-by-agent="OpenCode"`

Steps before logging:

1. Get the git short sha: `git rev-parse --short HEAD`
2. Ensure you are using the correct log path: `./logs/chat.csv`

## Context Retrieval (MCP)

This project has an MCP server `llm-memory` configured. Use it to retrieve context from previous tasks:

- Use `search_logs(query)` to find how previous problems were solved.
- Use `get_task_history(taskName)` to see the progression of a specific feature.
- Use the `recent_work` prompt to get an overview of what has been done recently.

```
