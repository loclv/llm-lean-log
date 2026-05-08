# Project Improvement Ideals

This document outlines the long-term vision and specific ideals to improve the `llm-lean-log` ecosystem. These ideas focus on performance, developer experience, AI integration, and data visualization.

## 1. Performance & Core Infrastructure

- **Zero-Dependency Zig CLI**: Complete the Zig port to provide ultra-fast, cross-platform binary logging. This eliminates the need for Node/Bun runtime for basic logging operations.
- **Binary/Compressed Storage Backend**: Support an optional compressed format (e.g., SQLite or a custom binary format) while maintaining CSV as the primary exchange format.
- **Streaming & Memory Efficiency**: Implement streaming CSV parsing for both the CLI and Visualizer to handle logs with tens of thousands of entries without performance degradation.
- **Schema Evolution**: Define a formal versioned schema for the CSV format to ensure backward compatibility as new fields are added.

## 2. Visualizer & User Experience (UX)

- **Interactive Graph View**: Visualize the progression of tasks as a directed acyclic graph (DAG), showing dependencies between different features and bug fixes.
- **Time-Travel Navigation**: A timeline-based UI that allows users to "scrub" through the project history and see how the codebase changed over time.
- **Local-First Capabilities**: Use the Web File System Access API to allow the visualizer to read and write local `.csv` files directly without needing a local dev server.
- **Rich Analytics Dashboard**: Statistics on token usage, most frequent "causes" of bugs, and agent productivity metrics.
- **Theme Engine**: Support for fully customizable themes (beyond dark/light mode) to match different developer environments.

## 3. AI & Context Integration

- **Automated Standup Generator**: An MCP tool or CLI command that summarizes recent work into a concise daily standup report (What was done, blockers, next steps).
- **Commit Hook Automation**: Automatically generate log entries from Git commits, using LLMs to extract structured data (problem, solution, tech-stack) from commit messages.
- **Proactive Context Suggestion**: The MCP server should suggest relevant past logs when a developer starts a new task that resembles previous work.
- **Agent Coordination**: Better support for multiple agents working on the same repository, including conflict resolution and "agent identity" tracking.

## 4. Ecosystem & Tooling

- **IDE Extensions**: Native extensions for VS Code and Cursor to add log entries via a sidebar or command palette, reducing context switching.
- **Notion/Obsidian Sync**: Bi-directional sync with popular knowledge management tools. See the [Integrations Guide](./roadmap/integrations.md) for technical details.
- **CI/CD Integration**: Automatically log build failures or test results into the project log for better auditability of "what went wrong."
- **Export Formats**: Support for exporting logs to Markdown, JSONL (for fine-tuning), and PDF reports.
