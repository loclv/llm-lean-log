# Changelog - CLI Tool

All notable changes to the `llm-lean-log-cli` package will be documented in this file.

## [0.2.8] - 2026-01-22

### Added

- **Release Automation**: Added Zig-based release script (`scripts/release.zig`) for automated version management
  - Automatic version increment in `package.json`
  - Version synchronization with TypeScript constants
  - Automated build and test validation
  - Git commit and tag creation with semantic versioning
  - Integration with npm publishing workflow

- **Git Integration**: Enhanced `last-commit-short-sha` field with automatic population
  - Auto-populates git short SHA when not explicitly provided via `--last-commit-short-sha` flag
  - Uses `git rev-parse --short HEAD` command to retrieve current commit SHA
  - Gracefully handles non-git repositories and git command failures
  - Maintains backward compatibility with manual SHA specification

### Changed

- **Release Process**: Enhanced release workflow with comprehensive automation
  - Version bumping now handled programmatically
  - Consistent commit message formatting (`chore: release mcp-server-v{version}`)
  - Automated tag creation and pushing to GitHub

## [0.2.7] - 2026-01-18

### Changed

- **Dependency Management**: Updated build to include `llm-lean-log-core` in bundle and removed peer dependency on `typescript`

## [0.2.6] - 2026-01-18

### Fixed

- **Build Configuration**: Fixed __require error in bundled CLI by using external dependencies
- **Package Import**: Replaced JSON import with fs-based reading to avoid bundling issues
- **Dependency Management**: Updated build to exclude llm-lean-log-core from bundle

### Changed

- **Build Process**: Now uses --external flag for core dependency

## [0.2.4] - 2026-01-18

### Changed

- **Build Optimization**: Improved build script to output a single bundled file

| Option | Before | After |
|--------|--------|-------|
| Output | `--outdir dist` (directory) | `--outfile dist/index.js` (single file) |
| Target | `--target node` | `--target node` |
| Minify | ❌ | `--minify` ✅ |
| Size | ~1.6MB | **~1.14MB** |

### Added

- **LLM-Optimized Help Output**: Default help output is now in CSV format for better LLM consumption
  - Added `--human` flag to show human-readable format for help command
  - CSV format includes columns: `command`, `options`, `description` for easy parsing

- `cause` field support added to CLI commands

## [0.2.2] - 2026-01-14

### Changed

- **Help Text Updates**: Enhanced CLI help documentation with improved parameter descriptions
  - Updated `--files` parameter description to "Comma-separated files paths"
  - Updated `--causeIds` and `--effectIds` to specify "Comma-separated cause/effect log row UUIDs"
  - Restored "Examples for LLMs:" section title for clarity
  - Added comprehensive example with all available parameters including UUIDs and commit SHA
  - Maintained `[log-file]` parameter in usage for backward compatibility

## [0.2.0] - 2026-01-14

### ⚠️ BREAKING CHANGES

- **Dependency Update**: Updated core dependency to explicit version `^0.2.0` for proper publishing

### Changed

- **Release Process**: Now follows enhanced release workflow with CHANGELOG.md integration
- Updated dependency on `llm-lean-log-core` to version 0.2.0

## [0.1.8] - 2026-01-14

### Fixed

- Fixed required fields and expanded test coverage
- Improved documentation and CLI help output

## [0.1.7] - 2026-01-14

### Improved

- Removed custom UUID generation
- Added more unit tests for CLI commands

## [0.1.6] - 2026-01-13

### Fixed

- Fixed bug for output for LLMs
- Added `start` script to `package.json`

## [0.1.5] - 2026-01-13

### Added

- Added `last-commit-short-sha` to log entries
- Added `created-by-agent` to log entries
- Support for more columns in the CSV output

### Changed

- CLI tool name updated from `llml` to `l-log`

## [0.1.4] - 2026-01-12

### Changed

- Shortened CLI command from `llm-lean-log` to `llml`

## [0.1.3] - 2026-01-12

### Added

- Syntax highlighting for terminal output

## [0.1.2] - 2026-01-12

### Improved

- Documentation and version updates

## [0.1.1] - 2026-01-12

### Changed

- Package name standardized to `llm-lean-log-cli`

## [0.1.0] - 2026-01-12

### Added

- Initial release of the CLI tool
- Commands for adding, viewing, and searching logs
- Support for Bun execution
