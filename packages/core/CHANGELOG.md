# Changelog - Core Library

All notable changes to the `llm-lean-log-core` package will be documented in this file.

## [0.1.7] - 2026-01-14

### Fixed

- Fixed required fields validation in `csv-utils.ts`
- Expanded test coverage for CSV utility functions
- Improved `.gitignore` patterns for multi-package environment

### Improved

- Removed custom UUID generation in favor of more standard approaches

## [0.1.6] - 2026-01-13

### Fixed

- Fixed bug in CSV output specifically for LLM-focused usage
- Improved CSV formatting for better consistency

## [0.1.5] - 2026-01-13

### Added

- Added more data fields for logs: `last-commit-short-sha`, `created-by-agent`
- Support for cause and effect relationships based on CSV data (`causeIds`, `effectIds`)
- Enhanced CSV parsing to correctly handle fields containing newlines

### Improved

- Standardized field names (e.g., `log-created-agent` to `created-by-agent`)
- Added more unit tests for core functionality

## [0.1.4] - 2026-01-12

### Added

- Detection and syntax highlighting for code blocks in text
- Shorter CLI convenience methods

## [0.1.3] - 2026-01-12

### Added

- First stable release of syntax highlighting support

## [0.1.2] - 2026-01-12

### Improved

- Documentation updates and version alignment

## [0.1.1] - 2026-01-12

### Changed

- Package name standardized to `llm-lean-log-core`

## [0.1.0] - 2026-01-12

### Added

- Initial release of the core library
- CSV-based logging format optimized for LLM token usage
- Support for Bun monorepo structure
