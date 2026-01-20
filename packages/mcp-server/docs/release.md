# Release MCP Server

```bash
zig version
# 0.15.2

zig run scripts/release.zig
```

Read more at `scripts/release.zig`.

## After release

```bash
bun i -g l-log-mcp-server
l-log-mcp-server
```

Press Ctrl+C to stop the server.
