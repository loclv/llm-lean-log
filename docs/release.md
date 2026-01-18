# 📦 Release

This project uses GitHub Actions to automate releases with CHANGELOG.md integration. To create a new release:

1. Update the version in `package.json` files.
2. Update CHANGELOG.md with the new version details:
   - Add a new section with the version number (e.g., `### v0.1.9`)
   - Include detailed changes, features, and fixes
   - Follow the existing format in the changelog
3. Tag and push the commit with the new version:

   ```bash
   git tag v0.1.9
   git push origin v0.1.9
   ```

4. GitHub Actions will automatically:
   - Extract the relevant changelog section from `CHANGELOG.md`
   - Create a GitHub Release with the changelog content
   - Generate additional release notes automatically

## Changelog Format

The release workflow parses `CHANGELOG.md` to find version-specific content:

- Looks for sections starting with `###` that contain version numbers
- Falls back to the latest entry if no version match is found
- Uses git commit message as final fallback if no changelog exists

## Upgrade

```bash
bun i -g llm-lean-log-cli
# confirm
l-log -v

bun i -g l-log-vis
# confirm
l-log-vis

bun i -g l-log-mcp-server
# confirm
l-log-mcp-server -v
```

## Additional Notes

I have updated `packages/cli/package.json` to move `llm-lean-log-core` and `typescript` from `dependencies` and `peerDependencies` to `devDependencies`. This ensures that bun build bundles `llm-lean-log-core` into the final executable and removes the dependency requirement.

Verified that `dist/index.js` does not contain `require("llm-lean-log-core")` after building, confirming it is bundled.
