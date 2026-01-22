# Release CLI

```bash
zig version
# 0.15.2

# Update version in `package.json`.
zig run scripts/release.zig

# Build the script.
zig build-exe scripts/release.zig -femit-bin=build/release

# Run the script.
./build/release
```

Read more at `scripts/release.zig`.

## After release

```bash
bun i -g llm-lean-log-cli
l-log -v
```
