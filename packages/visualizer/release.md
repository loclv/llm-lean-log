# Release

```bash
zig version
# 0.16.0

cd ../../zig

# Update version in `package.json`.
zig run ../packages/visualizer/scripts/release.zig

cd ../packages/visualizer

# Build the script.
zig build-exe scripts/release.zig -femit-bin=build/release

# Run the script.
./build/release
```

Read more at `scripts/release.zig`.

## After release

```bash
bun i -g l-log-visualizer
l-log-visualizer
```

Press Ctrl+C to stop the server.
