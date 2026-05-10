# Release CLI

```bash
cd ../../zig
zig version
# 0.16.0

mkdir -p ../packages/bun-cli/build
# Build the script.
zig build-exe ../packages/bun-cli/scripts/release.zig -femit-bin=../packages/bun-cli/build/release

cd ../packages/bun-cli
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
bl-log -v
```
