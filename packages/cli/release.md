# Release CLI

```bash
zig version
# 0.16.0

cd ../../zig
mkdir -p build
# Build the script.
zig build-exe ../packages/cli/scripts/release.zig -femit-bin=../packages/cli/build/release

# Update version in `packages/cli/package.json`.
zig run ../packages/cli/scripts/release.zig

# Run the script.
../packages/cli/build/release
```

Read more at `scripts/release.zig`.

## After release

```bash
bun i -g llm-lean-log-cli
l-log -v
```
