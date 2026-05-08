# External Integrations Guide

This document outlines the technical approach for integrating `llm-lean-log` with external knowledge management tools like Notion, Obsidian, and others.

## 1. Core Architecture: The Sync Engine

To support multiple platforms, we should implement a generic sync layer in `packages/core`:
- State Tracking: A local file (e.g., `.log-sync.json`) to track which CSV rows have been successfully synced to which platforms and their external IDs.
- Transformers: Functions that convert a `LogEntry` into the specific format required by the target platform (Markdown, Notion JSON, etc.).

## 2. Markdown Integration (Generic / Obsidian style)

Markdown is the universal format for knowledge management. The goal is to turn each log entry into a searchable, linkable note that works with Obsidian, Logseq, and other tools.

### Implementation Path:
- CLI Command: `l-log export md --vault /path/to/vault`
- File Structure:
  - Store logs in a dedicated folder: `Logs/LLM/`.
  - Filename format: `YYYY-MM-DD-task-name.md`.
- Content Format:
  - Use YAML Frontmatter for metadata:
    ```yaml
    ---
    id: uuid-123
    tags: [refactor, zig]
    tech-stack: [zig, cli]
    created-at: 2026-05-08
    ---
    ```
  - Use Internal Links for Cause/Effect:
    - `causeIds: ["uuid-001"]` becomes `Cause: [[2026-05-07-previous-task]]`.
- Automation: A file watcher that automatically updates the vault when `chat.csv` changes.

## 3. Notion Integration (Database)

Notion provides a powerful API for structured databases.

### Implementation Path:
- CLI Command: `l-log sync notion`
- Configuration: Requires `NOTION_TOKEN` and `NOTION_DATABASE_ID`.
- Property Mapping:
  | CSV Column | Notion Property Type |
  |---|---|
  | `name` | Title |
  | `tags` | Multi-select |
  | `problem` | Rich Text / Page Content |
  | `solution` | Rich Text / Page Content |
  | `created-at` | Date |
  | `id` | Text (Unique ID) |
- Handling Updates: The sync tool checks if a Notion page with the same `id` exists. If yes, it updates it; if no, it creates a new one.

## 4. Generic Webhook / API Integration

For tools like Slack, Discord, or custom internal dashboards:
- Webhook Support: `l-log` can send a POST request with the log data whenever a new entry is added.
- JSON Export: A standard command `l-log export json` to pipe data into other scripts.

## 5. Next Steps for Implementation

1. Phase 1: Implement `l-log export md` as it's the easiest to build (just file writing).
2. Phase 2: Create the sync state tracking logic to support incremental updates.
3. Phase 3: Build the Notion integration using the `@notionhq/client` library.
