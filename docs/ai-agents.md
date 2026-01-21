# AI Agents Integration

This project is designed to work seamlessly with various AI-powered coding assistants and agents. You can use it with Cursor, Windsurf, Claude Code, OpenCode, or any other LLM client.

## Quick Start

1. Install the CLI tool globally:

```bash
bun add -g llm-lean-log-cli
```

2. Configure your AI agent rules (see below)

3. Optionally, set up the MCP server for context retrieval (see MCP section)

## Configuring AI Agents

### OpenCode

Create or update `AGENTS.md` in your project root to provide instructions to the AI agent:

```text
# Project Rules for OpenCode

This project uses llm-lean-log to maintain a history of development tasks. As an AI agent working on this project, you must follow these rules:

## Work Logging

Whenever you finish a task or modify code, you must log your work using the l-log CLI:

l-log add ./logs/chat.csv "<Task Name>" --tags="<tags>" --problem="<problem>" --solution="<solution>" --action="<action>" --files="<files>" --tech-stack="<tech>" --cause="<cause>" --created-by-agent="OpenCode"

Steps before logging:
1. Get the git short sha: git rev-parse --short HEAD
2. Ensure log path: ./logs/chat.csv

## Context Retrieval (MCP)

This project has an MCP server llm-memory configured. Use it to retrieve context from previous tasks:
- Use search_logs(query) to find how previous problems were solved
- Use get_task_history(taskName) to see the progression of a specific feature
- Use recent_work to get an overview of what has been done recently
- Use up for daily standup context
- Use learned to review past mistakes and lessons learned
```

For MCP integration with OpenCode, see the [MCP section](#mcp-server-integration) below.

### Windsurf

Create `.windsurf/rules/common.md`:

```text
---
trigger: always_on
---

# Common rules for LLM agent

Whenever you finish a task or change codes, always log your work using the l-log bash command (llm-lean-log-cli package) with the following format:

l-log add ./logs/chat.csv "<Task Name>" --tags="<tags>" --problem="<problem>" --solution="<solution>" --action="<action>" --files="<files>" --tech-stack="<tech>" --created-by-agent="<agent-name>"

Before logging:

- Install the l-log CLI if not already installed: bun add -g llm-lean-log-cli
- Get the git short sha: git rev-parse --short HEAD
- log path: ./logs/chat.csv

Note:

- you can use MCP server llm-memory to retrieve context from previous tasks. See [MCP section](#mcp-server-integration) below.
- For more info you can run `l-log -h`.
```

### Claude Code / Claude Desktop

Create `.claude/settings.json` or add to `claude_config.json`:

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

Then add instructions in your project's `AGENTS.md` (similar to OpenCode example above).

## MCP Server Integration

The MCP server allows AI agents to query your coding task history for context.

### Installation

Install the MCP server globally:

```bash
bun add -g l-log-mcp-server
```

### Configuration

Run this command to get configuration snippets for your AI client:

```bash
l-log-mcp-server --config
```

### Available Features

#### Resources

- memory://recent: View the last 50 log entries from the project history
- memory://stats: View statistics about your logs (total entries, last entry date, unique tags)
- memory://last: View the very last log entry from the project history

#### Tools

- search_logs(query): Search the log history for past problems, solutions, or topics
- get_task_history(taskName): Get all log entries related to a specific task name

#### Prompts

- up: A prompt for daily standup meetings - "What did I do last time and what's next?"
- recent_work: A prompt template to summarize recent activities based on logs
- learned: Review past mistakes and lessons learned to avoid repeating them

### Example Usage

After configuring the MCP server, you can ask your AI agent:

- "Show me the last 50 log entries to see what I've been working on recently"
- "What are my project statistics? How many entries do I have and what tags have I used?"
- "What was the very last thing I worked on?"
- "Search my logs for 'database migration' using llm-memory MCP to see how I handled similar issues before"
- "Find all entries related to 'authentication system' using llm-memory MCP to understand the development history"
- "Look up any past 'build errors' using llm-memory MCP to see common solutions"
- "up from llm-memory mcp"
- "recent_work from llm-memory"
- "learned from llm-memory"

## Asking AI Agents to Write Logs

You can use different levels of specificity when asking AI agents to write logs:

### Detailed (most efficient for LLMs)

> use `l-log add ./logs/chat.csv "Fix bug" --tags=bug,fix --problem="Problem description" --files="file1.ts,src/file2.ts" --tech-stack="elysia,drizzle,sqlite" --causeIds="uuid1,uuid2" --cause="<cause>" --created-by-agent="agent-name"` CLI tool to save last chat logs / talk above

### Simple

> use l-log CLI to save chat log above

### Minimal

> use l-log to save

### If Agent Forgets

If the AI agent forgets to write the log, you can remind it with:

> use l-log

## Asking AI Agents to Read Logs

### Efficient (recommended)

> run l-log view ./logs/example.csv --last CLI and read output

### Less Efficient

> read last chat logs from "./logs/example.csv" and tell me what should I do next

The efficient approach is better because the AI agent doesn't need to read the entire CSV file before it can write a new log entry. This saves time, tokens, and energy.

## Agent Rules Reference

### Functional Programming

Projects using llm-lean-log typically prefer a functional programming approach:

- Use functional programming approach
- Do not use classes, OOP design patterns, etc.

### Code Comments

Every function should have JSDoc comments:

```typescript
/**
 * Load existing logs from file
 * @param filePath - Path to the CSV file containing logs
 * @returns Promise resolving to array of log entries
 */
export async function loadLogs(filePath: string): Promise<LogEntry[]> {
  // implementation
}
```

### Unit Testing

After updating source code, update unit tests for those changes:

```typescript
import { describe, expect, it } from "bun:test";

describe("functionName", () => {
  it("should handle normal case", () => {
    // test
  });

  it("should handle errors", () => {
    // error test
  });
});
```

### Bun Usage

Default to using Bun instead of Node.js:

- Use bun run <file> instead of node <file> or ts-node <file>
- Use bun i instead of npm install or yarn install or pnpm install
- Use bun run <script> instead of npm run <script> or yarn run <script> or pnpm run <script>
- Use bunx instead of npx
- Bun automatically loads .env, so don't use dotenv

### Additional Bun APIs

- Bun.serve() for WebSockets, HTTPS, and routes. Don't use express.
- bun:sqlite for SQLite. Don't use better-sqlite3.
- Bun.redis for Redis. Don't use ioredis.
- Bun.sql for Postgres. Don't use pg or postgres.js.
- WebSocket is built-in. Don't use ws.
- Prefer Bun.file over node:fs's readFile/writeFile

## Troubleshooting

### MCP Server Issues

Server fails to start:

- Ensure LLM_LOG_PATH is set and points to a valid CSV file
- Check that the file path is absolute, not relative

Path not found errors:

- Use absolute paths in configuration files
- On macOS/Linux, paths start with /Users/... or /home/...
- On Windows, use forward slashes or escaped backslashes

Permission denied:

- Ensure the log file is readable by the user running the MCP server
- Check directory permissions for the log file location

No resources/tools available:

- Verify the server started successfully (check console output)
- Ensure the MCP client is properly configured to connect to the server

## Additional Resources

- [Main README](../README.md)
- [Project Structure](project-strcture.md)
- [MCP Server README](../packages/mcp-server/README.md)
- [AGENTS.md](../AGENTS.md) - Detailed guide for AI agents working on this project
