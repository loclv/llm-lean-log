---
trigger: always_on
---

# Common rules for LLM agent

Whenever you finish a task, always log your work using the l-log tool (llm-lean-log-cli package).

Use the following format:

```bash
l-log add ./logs/chat.csv "<Task Name>" --tags="<tags>" --problem="<problem>" --solution="<solution>" --action="<action>" --files="<files>" --tech-stack="<tech>" --last-commit-short-sha="<short-sha>" --created-by-agent="<agent-name>"
```

More info: <https://github.com/loclv/llm-lean-log>.