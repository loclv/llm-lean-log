# CHANGELOG - l-log-mcp-server

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
