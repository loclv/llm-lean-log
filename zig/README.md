# Zig version of llm-lean-log CLI

This is a Zig implementation of the `llm-lean-log` CLI tool. It is designed to be compatible with Zig 0.16.0 and provides a fast, lightweight alternative to the Bun version.

## Build

```bash
zig build
```

The executable will be located at `zig-out/bin/l-log`.

## Usage

```bash
./zig-out/bin/l-log <command> [log-file] [options]
```

### Commands

- add: Add a new log entry.
  - Usage: `l-log add [log-file] "Task Name" --problem="Description" --tags="tag1,tag2" ...`
- list (or ls): List all log entries.
  - Usage: `l-log list [log-file] [--compact]`
- stats: Show log statistics.
  - Usage: `l-log stats [log-file]`
- tags: List all unique tags.
  - Usage: `l-log tags [log-file]`
- search: Search logs for a query.
  - Usage: `l-log search [log-file] "query"`
- help: Show help message.
- version: Show version number.

## Features

- Proper CSV quoting and escaping.
- Automated UUID and ISO 8601 timestamp generation.
- Search across name, problem, and tags.
- Tag statistics and unique tag listing.
- Compact and detailed list views.
