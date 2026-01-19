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

## Technical Preferences

- Use **Bun** instead of Node.js (`bun run`, `bux`, `bun i`).
- Follow **functional programming** principles (no classes/OOP where possible).
- Always include **unit tests** for new features or bug fixes.
- Use **Vanilla CSS** for styling unless Tailwind is explicitly requested.
- Write **comments** for every function.
