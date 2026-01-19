---
trigger: always_on
---

# Common rules for LLM agent

Whenever you finish a task or change codes, always log your work using the l-log bash command (llm-lean-log-cli package) with the following format:

`l-log add ./logs/chat.csv "<Task Name>" --tags="<tags>" --problem="<problem>" --solution="<solution>" --action="<action>" --files="<files>" --tech-stack="<tech>" --last-commit-short-sha="<short-sha>" --created-by-agent="<agent-name>"`

Before run:

- Install the l-log CLI if not already installed: `bun add -g llm-lean-log-cli`.
- If need, run CLI help command: `l-log -h` for more information.
- Get the git short sha of the last commit by running: `git rev-parse --short HEAD`.
- log path: `./logs/chat.csv`.

## When use `console.log` / `console.warn` / `console.error`

Use `\n` to separate multiple lines of text if need.
