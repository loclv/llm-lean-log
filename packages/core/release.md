# Core Release Process

This package uses a Zig script to automate the release process.

## Prerequisites

- [Zig](https://ziglang.org/download/) installed and in your PATH.

## Usage

Run the release script from the `packages/core` directory:

```bash
# Update version, build, test, commit, and tag.
zig run scripts/release.zig

# Or build the script for faster execution.
mkdir -p build
zig build-exe scripts/release.zig -femit-bin=build/release

# Run the built script.
./build/release
```

The script will:
1. Increment the patch version in `package.json`.
2. Run `bun run build`.
3. Run `bun test`.
4. Git add `package.json`.
5. Git commit with `chore: release core-vX.X.X`.
6. Git tag with `core-vX.X.X`.
7. Push to `origin main` and push the new tag.
