# CHANGELOG - l-log-mcp-server

## [0.2.0] - 2026-05-10

### Added

- 🚀 NEW: Enhanced MCP server with 6 new powerful tools for comprehensive log analysis
- 🏷️ NEW: `get_logs_by_tags(tags)` - Filter logs by specific tags (e.g., ['bug', 'fix', 'api'])
- 📅 NEW: `get_logs_by_date_range(startDate, endDate)` - Filter logs by date range
- 🤖 NEW: `get_logs_by_agent(agent)` - Filter logs by the agent/LLM that created them
- 🔍 NEW: `get_problem_patterns()` - Analyze common problem patterns in log history
- 💡 NEW: `get_solution_suggestions(problem)` - Get solution suggestions based on similar problems
- 📊 NEW: `get_log_statistics()` - Get detailed statistics about log history
- 🧪 NEW: Comprehensive unit tests for all new data-access functions (12 tests, 74 assertions)
- 📖 NEW: Updated help text and documentation for all 8 tools (was 2)

### Changed

- Enhanced Capabilities: Expanded from 2 to 8 total MCP tools for better context retrieval
- Improved Documentation: Updated README with new tool examples and usage patterns
- Better Developer Experience: Added pattern recognition, solution suggestions, and detailed analytics

### Fixed

- 🔧 FIX: Added proper re-exports in index.ts for testing compatibility
- 🔧 FIX: Resolved import issues for new data-access functions
- 🔧 FIX: Fixed TypeScript compilation errors for new function exports

## [0.1.11] - 2026-01-22

### Changed

- Package Structure: CLI source code moved from core package to dedicated CLI package
- Improved package separation and modularity across the monorepo

## [0.1.6] - 2026-01-19

### Changed

- 📖 DOC: update npm page URL

### Added

- 📦 NEW: Add Biome linter/formatter as dev dependency
- 📦 NEW: Add unit tests for MCP prompts and improve test coverage
- 📦 NEW: add `learned` prompt for MCP

## [0.1.1] - 2026-01-19

### Added

- Added `postinstall` script to display configuration examples for OpenCode and Claude Desktop immediately after installation.
- Added `--config` (or `-c`) CLI flag to output configuration snippets on demand.
- Added `--help` (or `-h`) CLI flag for usage instructions.
- Added `--version` (or `-v` or `-V`) CLI flag for version information.
- Added automated file existence check for `LLM_LOG_PATH` with helpful warning messages.
- Added `tsconfig.json` to the package for better build and type declaration management.

### Changed

- Improved build process with automated shebang injection and execution permissions.
- Updated documentation with global installation guides and new features.

## [0.1.0] - 2026-01-18

- Initial release of the standalone MCP server.
