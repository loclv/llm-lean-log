# Release MCP Server

```bash
zig version
# 0.16

cd zig

# Build the script.
zig build-exe ../packages/mcp-server/scripts/release.zig -femit-bin=build/release

cd ../packages/mcp-server

# Update version in `package.json`.
zig run scripts/release.zig

# Run the script.
./build/release
```

Read more at `scripts/release.zig`.

## After release

```bash
bun i -g l-log-mcp-server
l-log-mcp-server
```

Press Ctrl+C to stop the server.
