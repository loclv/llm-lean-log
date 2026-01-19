# MCP server with llm-lean-log

The pairing looks like:

```text
LLM runtime
-[use CLI to write log]->
llm-lean-log (token-cheap, structured CSV)
->
mcp-server
<-[use MCP to read log]->
LLM runtime
```

`llm-lean-log` become MCP memory, which gives you:

- auditability (what did the model think last week?)
- debugging (why did it choose X?)
- analytics (token burn, drift, behavior change)
- training data for fine-tuning or evals

It turns "logs" into "memory".
