# Release CLI

```bash
zig version
# 0.16.0

cd ../../zig
mkdir -p build
# Build the script.
zig build-exe ../packages/cli/scripts/release.zig -femit-bin=../packages/cli/build/release

# Run the script.
cd ../packages/cli
./build/release

# Build the package.
bun run build

# Publish to npm.
bun publish
```

Read more at `scripts/release.zig`.

## After release

```bash
bun i -g llm-lean-log-cli
l-log -v
```
