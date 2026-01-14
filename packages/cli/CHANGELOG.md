# Changelog - CLI Tool

All notable changes to the `llm-lean-log-cli` package will be documented in this file.

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
