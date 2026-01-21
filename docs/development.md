# Development Guide

This guide provides detailed information for developing llm-lean-log.

## Setup

### Prerequisites

- Bun 1.3.5 or higher
- Git
- Node.js types: `bun-types` (included as devDependency)

### Installation

```bash
# Clone repository
git clone https://github.com/loclv/llm-lean-log.git
cd llm-lean-log

# Install dependencies
bun i
```

## Project Structure

This is a monorepo using Bun workspaces:

```text
llm-lean-log/
├── packages/
│   ├── core/              # Core library (CSV utilities, logging)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── logger.ts
│   │   │   ├── csv-utils.ts
│   │   │   ├── indexer.ts
│   │   │   ├── visualizer.ts
│   │   │   ├── graph-utils.ts
│   │   │   └── *.test.ts
│   │   ├── package.json
│   │   └── README.md
│   ├── cli/               # CLI application
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── *.test.ts
│   │   ├── package.json
│   │   └── README.md
│   ├── visualizer/        # React-based web visualizer
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── components/
│   │   │   ├── index.css
│   │   │   └── *.test.ts
│   │   ├── package.json
│   │   └── README.md
│   ├── mcp/               # MCP server core logic
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   └── mcp-server/        # Standalone MCP server
│       ├── src/
│       │   └── index.ts
│       ├── docs/
│       │   └── config-for-opencode.md
│       ├── package.json
│       └── README.md
├── docs/                  # Documentation
├── .github/              # GitHub workflows and templates
├── AGENTS.md             # Guide for AI agents
├── CONTRIBUTING.md        # Contribution guidelines
├── README.md             # Main README
├── package.json          # Root package.json
├── biome.json            # Biome configuration
├── tsconfig.json         # TypeScript configuration
└── bunfig.toml          # Bun configuration
```

## Available Commands

### Root Commands

```bash
# Install dependencies
bun i

# Run all tests
bun test

# Run specific test file
bun test packages/core/src/logger.test.ts

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Format code
bun run fmt

# Lint code
bun run lint

# Type checking
bun run type
```

### Package-Specific Commands

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

### Workspace Commands

```bash
# Run commands in specific package
bun run --filter llm-lean-log-core test
bun run --filter llm-lean-log-cli build
bun run --filter l-log-vis dev
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bugfix-name
```

### 2. Make Changes

Follow the code style guidelines in [CONTRIBUTING.md](../CONTRIBUTING.md).

### 3. Test Your Changes

```bash
# Run all tests
bun test

# Run specific test file
bun test packages/core/src/logger.test.ts

# Run tests in watch mode (for development)
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### 4. Format and Lint

```bash
# Format code
bun run fmt

# Lint code
bun run lint

# Type check
bun run type
```

### 5. Run Manual Testing

```bash
# Test CLI
bun run cli list
bun run cli add "Test log" --tags=test --problem="Testing"
bun run cli view --last

# Test visualizer
bun run web:dev

# Test MCP server
bun run mcp:dev
```

### 6. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
# or
git commit -m "fix: fix bug description"
```

### 7. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Building Packages

### CLI Package

The CLI package is bundled with Bun:

```bash
cd packages/cli
bun build src/index.ts --outdir ./dist --target bun
```

### MCP Server Package

The MCP server is also bundled:

```bash
cd packages/mcp-server
bun build src/index.ts --outdir ./dist --target bun
```

### Visualizer Package

The visualizer uses Vite for development:

```bash
cd packages/visualizer
bun run dev      # Development
bun run build     # Production build
```

## Testing

### Test Structure

Test files are named `*.test.ts` and placed in the same directory as the source file they test.

Example:

```text
packages/core/src/
├── logger.ts
├── logger.test.ts
├── csv-utils.ts
├── csv-utils.test.ts
└── ...
```

### Writing Tests

Use `bun:test` framework:

```typescript
import { describe, expect, it } from "bun:test";

describe("functionName", () => {
  it("should handle normal case", () => {
    // Test implementation
    expect(result).toBe(expected);
  });

  it("should handle errors", () => {
    // Error test implementation
    expect(() => {
      throw new Error("test");
    }).toThrow("test");
  });
});
```

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test packages/core/src/logger.test.ts

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Run tests with coverage and save to file
bun run test:coverage:w
```

## Code Quality

### Formatting

Project uses Biome for code formatting:

```bash
# Format code
bun run fmt

# Check formatting without writing
bun x biome format --check .
```

Configuration: `biome.json`

### Linting

```bash
# Lint code
bun run lint

# Lint specific file
bun x biome lint packages/core/src/logger.ts
```

### Type Checking

```bash
# Type check all packages
bun run type

# Type check specific package
bun run --filter llm-lean-log-core type
```

## Publishing Packages

### Publishing Core

```bash
cd packages/core
bun publish
```

### Publishing CLI

```bash
cd packages/cli
bun publish
```

### Publishing Visualizer

```bash
cd packages/visualizer
bun publish
```

### Publishing MCP

```bash
cd packages/mcp
bun publish
```

### Publishing MCP Server

```bash
cd packages/mcp-server
bun publish
```

Note: You may need to update the version in `package.json` before publishing.

See `docs/public.md` for more details.

## Development Tools

### Recommended VS Code Extensions

Install from `.vscode/extensions.json`:

- `DavidAnson.vscode-markdownlint` - Markdown linting
- `biomejs.biome` - Code formatting and linting
- `oven-sh.bun` - Bun runtime support
- `jeff-hykin.better-csv-syntax` - CSV syntax highlighting
- `YoavBls.pretty-ts-errors` - Pretty TypeScript errors
- `ReprEng.csv` - CSV support

### Git Hooks

Consider using git hooks to ensure code quality before committing:

```bash
# Pre-commit hook example (scripts/pre-commit.sh)
#!/bin/bash
bun run fmt
bun run lint
bun test
```

## Troubleshooting

### Dependencies Issues

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun i
```

### Test Failures

```bash
# Run tests in verbose mode
bun test --verbose

# Run specific test
bun test packages/core/src/logger.test.ts:10
```

### Type Errors

```bash
# Check types in verbose mode
bun run --filter llm-lean-log-core type --noEmit
```

### Build Failures

```bash
# Clean build artifacts
rm -rf packages/*/dist
# Rebuild
bun run build
```

## Additional Resources

- [Main README](../README.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [AGENTS.md](../AGENTS.md)
- [AI Agents Integration](./ai-agents.md)
- [Project Structure](./project-strcture.md)
