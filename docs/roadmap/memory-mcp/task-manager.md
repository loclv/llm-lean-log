# Memory MCP Task Manager

## Phase 1: Scaffolding & Setup

- [x] **Initialize Package**
  - Create `packages/mcp`.
  - `bun init` and configure `tsconfig.json`.
  - Install necessary dependencies: `@modelcontextprotocol/sdk`, `zod`.
- [ ] **Basic MCP Server**
  - Create `src/index.ts` with a basic STDIO transport server.
  - Verify connectivity with an MCP inspector or client.

## Phase 2: core Library (Log Access)

- [ ] **CSV Reader Utility**
  - Implement a robust CSV parser (or reuse coreUtils if available).
  - Handle standard `llm-lean-log` schema columns.
  - Ensure robust handling of multi-line content in CSV cells.
- [ ] **Data Access Layer**
  - `getLastNEntries(n: number)`
  - `searchEntries(query: string)`
  - `getEntriesByTask(taskName: string)`

## Phase 3: MCP Features Implementation

- [ ] **Resources**
  - [ ] Implement `memory://recent` (Latest logs).
  - [x] Implement `memory://stats` (Aggregated stats).
- [ ] **Tools**
  - [ ] `search_logs`: Argument `query` (string).
  - [ ] `filter_logs`: Arguments `tag`, `problem`, `date`.
- [ ] **Prompts**
  - [ ] `summarize_session`: Argument `session_id`.

## Phase 4: Advanced Features

- [ ] **Summarization Engine**: Logic to condense multiple log rows into a narrative summary.
- [ ] **Caching/Indexing**: In-memory cache for CSV data to improve search speed on large files.
- [ ] **Real-time**: Support for `notifications/resources/updated` when `chat.csv` changes.

## Phase 5: Documentation & Release

- [x] Write `README.md` for `packages/mcp` with installation instructions.
- [ ] Add configuration examples for Claude Desktop `claude_config.json`.
- [ ] Integration smoke test: Verify `llm-lean-log` data appears correctly in the client.
