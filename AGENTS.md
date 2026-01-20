# Project Rules for OpenCode

This project uses `llm-lean-log` to maintain a history of development tasks. As an AI agent working on this project, you must follow these rules:

## Build & Development Commands

### Project Structure

This is a monorepo with packages in `packages/*`. Use workspace commands:

```bash
# Install dependencies
bun i

# Build all packages
bun run build

# Run all tests
bun test

# Run specific test file
bun test packages/core/src/logger.test.ts

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch

# Format code
bun run fmt

# Lint code
bun run lint

# Type checking
bun run type
```

### Package-specific Commands

```bash
# Run CLI locally
bun run cli

# Run visualizer dev server
bun run web:dev

# Run MCP server in development
bun run mcp:dev

# Start MCP server
bun run mcp:start

# Run core package example
bun run example
```

## Work Logging

Whenever you finish a task or modify code, you must log your work using the `l-log` CLI.

Command Format: `l-log add ./logs/chat.csv "<Task Name>" --tags="<tags>" --problem="<problem>" --solution="<solution>" --action="<action>" --files="<files>" --tech-stack="<tech>" --last-commit-short-sha="<short-sha>" --cause="<cause>" --created-by-agent="OpenCode"`

Steps before logging:

1. Get the git short sha: `git rev-parse --short HEAD`
2. Ensure you are using the correct log path: `./logs/chat.csv`
3. Install CLI if needed: `bun add -g llm-lean-log-cli`

## Context Retrieval (MCP)

This project has an MCP server `llm-memory` configured. Use it to retrieve context from previous tasks:

- Use `search_logs(query)` to find how previous problems were solved
- Use `get_task_history(taskName)` to see the progression of a specific feature
- Use `recent_work` prompt to get an overview of what has been done recently
- Use `up` prompt for daily standup context
- Use `learned` prompt to review past mistakes

## Code Style Guidelines

### Imports & Dependencies

- Use `node:` prefix for Node.js built-in modules: `import { readFile } from "node:fs/promises"`
- Prefer absolute imports over relative imports when possible
- Use Bun's built-in APIs over external packages:
  - `Bun.file()` instead of `node:fs` for file operations
  - `bun:sqlite` instead of `better-sqlite3`
  - `Bun.serve()` instead of `express`
  - `bun:sqlite` for SQLite, `Bun.redis` for Redis, `Bun.sql` for Postgres

### Formatting & Style

- **Indentation**: Use tabs (configured in biome.json)
- **Quotes**: Use double quotes for strings
- **Line endings**: Use LF
- **Semicolons**: Required
- **Trailing commas**: Required in multi-line structures
- Run `bun run fmt` to format code automatically
- Run `bun run lint` to check style compliance

### TypeScript Conventions

- **Type annotations**: Always provide explicit return types for functions
- **Optional fields**: Use optional chaining (`?.`) when accessing potentially undefined properties
- **Error handling**: Use try-catch blocks with proper error logging
- **Generics**: Prefer explicit type parameters over implicit inference
- **Never use `any`**: Use `unknown` or proper typing instead

### Naming Conventions

- **Files**: kebab-case for filenames (`csv-utils.ts`, `logger.test.ts`)
- **Functions**: camelCase (`loadLogs`, `createLogEntry`)
- **Constants**: UPPER_SNAKE_CASE for exported constants (`CSV_HEADERS`)
- **Types**: PascalCase for interfaces/types (`LogEntry`, `CsvRow`)
- **Variables**: camelCase for local variables
- **Private functions**: Use descriptive names, no underscore prefix needed

### Function Documentation

Every function must have a JSDoc comment:

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

### Error Handling Patterns

- Always handle async operations with try-catch
- Log errors using `console.error()` with descriptive messages
- Return empty arrays or null values for graceful degradation
- Use proper TypeScript error types when available

### Testing Requirements

- Write unit tests for ALL new functions and bug fixes
- Test files: `*.test.ts` in same directory as source
- Use `bun:test` framework with `describe`, `test`, `expect`
- Test both happy path and error cases
- Coverage is enabled automatically - aim for high coverage

```typescript
import { describe, expect, test } from "bun:test";

describe("functionName", () => {
  test("should handle normal case", () => {
    // test implementation
  });

  test("should handle errors", () => {
    // error test implementation
  });
});
```

## Technical Preferences

### Runtime & Tooling

- **Use Bun exclusively** - no Node.js, npm, pnpm, or yarn
- Use `bun run` for scripts, `bun test` for testing, `bun i` for dependencies
- Use `bunx <package>` instead of `npx <package>`
- Bun automatically loads `.env` files - no dotenv needed

### Architecture Principles

- **Functional programming**: No classes or OOP patterns
- Pure functions preferred over methods with side effects
- Immutable data structures where possible
- Composition over inheritance
- Avoid mutation of function parameters

### Package Management

- This is a monorepo using Bun workspaces
- All dependencies go in root `package.json` unless package-specific
- Use `devDependencies` for build tools and testing frameworks
- For CLI packages: move core dependencies to `devDependencies` and bundle

### Frontend Guidelines

- Use Vanilla CSS unless Tailwind explicitly requested
- For React: prefer functional components with hooks
- Use CSS modules or styled-components for component-specific styles
- Ensure accessibility in all UI components

## Package-Specific Notes

### Core Package (`packages/core`)

- Contains CSV utilities and logger functions
- All functions must be pure and testable
- TypeScript types exported for other packages

### CLI Package (`packages/cli`)

- Entry point: `src/index.ts`
- Bundle with Bun, include all dependencies
- Test CLI commands with integration tests

### Visualizer Package (`packages/visualizer`)

- React-based web interface
- Uses Vite for development builds
- Import LogEntry type from core package

### MCP Server Package (`packages/mcp-server`)

- Standalone MCP server for LLM memory
- Uses `llm-lean-log-core` for data access
- Configure via `LLM_LOG_PATH` environment variable

## Git Workflow

- Main branch: `main`
- Use conventional commit messages when possible
- Always include git short SHA in log entries
- Run tests and lint before committing changes

Remember: This file is your guide. When in doubt, check existing code for patterns and follow the established conventions.
