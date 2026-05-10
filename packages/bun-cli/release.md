# Release CLI

```bash
zig version
# 0.16.0

mkdir -p build
# Build the script.
zig build-exe scripts/release.zig -femit-bin=build/release

# Update version in `package.json`.
zig run scripts/release.zig

# Run the script.
./build/release

# Build the package.
bun run build

# Publish to npm.
bun publish
```

Read more at `scripts/release.zig`.

## After release

```bash
bun i -g bl-log
l-log -v
```
