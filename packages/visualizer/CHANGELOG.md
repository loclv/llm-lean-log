# Changelog - Web Visualizer

All notable changes to the `l-log-vis` package will be documented in this file.

## [0.2.7] - 2026-01-23

### Changed

- Refactored state management to use localStorage for persistence of uploaded logs
- Simplified CLI URL generation and improved robustness

### Added

- Vite proxy configuration for easier development of API-related features

## [0.2.6] - 2026-01-22

### Added

- `last-commit-short-sha` field viewing support

## [0.2.4] - 2026-01-18

### Added

- `cause` field support added to CLI commands

## [0.1.7] - 2026-01-13

### Fixed

- Fixed bug in LLM-focused output
- Improved UI responsiveness

## [0.1.6] - 2026-01-13

### Added

- Added support for new log fields: `tech-stack`, `created-by-agent`
- Support for cause and effect relationships visualization

### Changed

- Package renamed from `llml-vis` to `l-log-vis`

## [0.1.0] - 2026-01-12

### Added

- Initial release of the React-based Web Visualizer
- Modern, beautiful UI with code highlighting using Prism
- Framer Motion animations for smooth transitions
- Support for parsing local CSV log files
- CLI tool `l-log-vis` to launch the visualizer
