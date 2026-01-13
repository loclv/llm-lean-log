# 📦 Release

This project uses GitHub Actions to automate releases. To create a new release:

1. Update the version in `package.json` files.
2. Tag the commit with the new version:

   ```bash
   git tag v0.1.x
   git push origin v0.1.x
   ```

3. GitHub Actions will automatically create a GitHub Release with auto-generated release notes.

## Upgrade

```bash
bun i -g llm-lean-log-cli
# confirm
l-log -v

bun i -g l-log-vis
# confirm
l-log-vis
```
