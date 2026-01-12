# How to publish

You can now publish the packages by running the following commands from the root:

```bash
# Publish core first
cd packages/core
bun publish

# Then publish cli
cd ../cli
bun publish
```

Note: You may need to update the version in `package.json` before publishing.

Once published, users will be able to install the CLI globally:

```bash
bun add -g llm-lean-log-cli
llm-lean-log --help
```
