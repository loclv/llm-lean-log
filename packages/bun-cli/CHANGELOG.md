# Changelog - Bun CLI Tool

All notable changes to the `bl-log` package will be documented in this file.

## [0.2.14] - 2026-05-11

### Improvements

- Update rules, skills's command explanation and README.md

## [0.2.12] - 2026-05-10

### Added

- JSONL Export: Added `export jsonl` command to export logs to JSONL format
- JSONL Export: Added `export json-lines` alias for the export command
- JSONL Export: Added support for `--out`, `--path`, and `--file` flags to specify output file path
- JSONL Export: Enhanced export capabilities with machine-readable JSONL format for programmatic processing

## [0.2.11] - 2026-03-01

### Added

- Git Diff Control: Added `--diff` flag to explicitly enable saving git diff file
- Git Diff Control: Added `--no-diff` flag to `add` command to skip saving git diff file
- Git Diff Control: Check if git diff is empty before saving, if it is, skip saving

## [0.2.10] - 2026-02-25

### Added

- initial project for bun only cli tool
