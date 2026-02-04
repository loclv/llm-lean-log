# CSV Log Viewer

A VSCode extension to view CSV log files with the same beautiful UI as the LLM Lean Log Visualizer.

## Features

- View CSV files in a beautiful, dark-themed interface
- Search across all log fields (name, problem, solution, tags, files, tech-stack, cause)
- Sort logs by date (newest/oldest)
- Auto-load CSV files when opened in VSCode
- Right-click context menu to open CSV files
- Same UI/UX patterns as the LLM Lean Log Visualizer

## Installation

### From VSIX Package

1. Download the `.vsix` package from releases
2. Run: `code --install-extension vscode-csv-viewer-*.vsix`

### From Source

```bash
cd packages/vscode-csv-viewer
bun run compile
```

## Development

### Running in VSCode

1. Open the extension folder in VSCode
2. Press `F5` to launch the Extension Development Host
3. The extension will be activated in a new VSCode window

### Commands

- `CSV Viewer: Open CSV Log File` - Open a CSV file manually
- Right-click on any `.csv` file in the explorer and select "Open CSV Log File"

### Building

```bash
bun run compile    # Compile TypeScript
bun run lint       # Run ESLint
bun run package    # Create VSIX package

# use Bun build-in test runner
bun test
```

## File Structure

```text
vscode-csv-viewer/
├── package.json           # Extension manifest
├── tsconfig.json         # TypeScript configuration
├── src/
│   ├── extension.ts      # Extension entry point
│   ├── utils.ts          # CSV parsing utilities
│   ├── utils.test.ts     # Unit tests
│   ├── CsvViewerWebviewProvider.ts  # Webview provider
│   └── test/
│       ├── index.ts      # Test runner
│       └── runTest.ts    # Test runner
└── media/
    ├── styles.css        # Webview styles
    └── script.js          # Webview script
```

## Supported CSV Format

The extension expects CSV files with the following columns:

| Column | Required | Description |
|--------|----------|-------------|
| id | Yes | Unique identifier (UUID) |
| name | Yes | Log entry name |
| problem | Yes | Description of the problem |
| solution | No | Description of the solution |
| action | No | Command or action taken |
| files | No | Modified files (comma-separated) |
| tech-stack | No | Technologies used (comma-separated) |
| tags | No | Tags (comma-separated) |
| cause | No | Root cause of the problem |
| created-at | Yes | Creation timestamp |
| model | No | AI model used |
| created-by-agent | No | Agent that created the log |

## TODO

- add icon

## License

MIT
