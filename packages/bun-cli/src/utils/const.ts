export const VERSION = "0.2.14";

/**
 * Help text for LLMs in CSV format
 */
export const helpText = `l-log CLI - Usage: l-log <command> [log-file] [options]

command,options,description
list|ls,"--compact|-c,--human",List all log entries
stats,--human,Show log statistics
view <index>,"--last,--human",View detailed entry at index
search <query>,--human,Search logs by name/problem/solution
tags <tag1> [tag2],--human,Filter logs by tags
add <name>,"--tags=<tags>,--problem=<text>,--solution=<text>,--action=<text>,--files=<files>,--tech-stack=<tech>,--model=<name>,--cause=<text>,--causeIds=<ids>,--effectIds=<ids>,--created-at=<time>,--updated-at=<time>,--created-by-agent=<name>,--diff|--no-diff",Add a new log entry
g-rule|global-rule,,Add global agent rule in ~/.agents/rules/l-log-rules.md
rule|local-rule,,Add local agent rule in .agents/rules/llm-lean-log.md
help|-h|--help,--human,Show this help message
export md|markdown|obsidian,"--vault=<path>,--path=<path>,--out=<path>",Export logs to Markdown files (Obsidian style)
export jsonl|json-lines,"--out=<path>,--path=<path>,--file=<path>",Export logs to JSON Lines format
-v|-V|--version,,Show version number

examples:
l-log list ./logs/example.csv
l-log stats
l-log view 0
l-log view --last
l-log search "memory"
l-log tags error api
l-log add ./logs/chat.csv "Task name" --tags="tag1,tag2" --problem="Detailed problem description" --solution="Detailed solution" --action="Action taken" --files="file1.ts,file2.ts" --tech-stack="bun,ts" --created-by-agent="Antigravity"
l-log add g-rule
l-log export md ./logs/chat.csv --vault=./my-vault
l-log export jsonl ./logs/chat.csv --out=./logs/export.jsonl
`;

export const helpTextForHuman = `l-log CLI

Usage: l-log <command> [log-file] [options]

Commands:
  list, ls | List all log entries
    --compact, -c | Show compact view
    --human | Show human-readable output (with colors)
  
  stats | Show log statistics
    --human | Show human-readable output (with colors)
  
  view <index> | View detailed entry at index
    --last | Show the last log entry
    --human | Show human-readable output (with colors)
  
  search <query> | Search logs by name, problem, or solution
    --human | Show human-readable output (with colors)
  
  tags <tag1> [tag2] | Filter logs by tags
    --human | Show human-readable output (with colors)
  
  add <name> | Add a new log entry
    --tags=<tags> | Comma-separated tags, wrap with double quotes if multiple tags
    --problem=<text> | Problem description
    --solution=<text> | Solution description
    --action=<text> | Action taken
    --files=<files> | Comma-separated files paths, wrap with double quotes if multiple files
    --tech-stack=<tech> | Comma-separated tech stack, wrap with double quotes if multiple tech stack
    --model=<name> | Model name
    --cause=<text> | Cause description
    --causeIds=<ids> | Comma-separated cause log row UUIDs, wrap with double quotes if multiple cause log row UUIDs
    --effectIds=<ids> | Comma-separated effect log row UUIDs, wrap with double quotes if multiple effect log row UUIDs
    --last-commit-short-sha=<sha> | Last git commit short SHA
    --created-at=<time> | Creation time (ISO 8601 formatted string)
    --updated-at=<time> | Update time (ISO 8601 formatted string)
    --created-by-agent=<name> | Agent model name
    --diff | Save git diff file (default: true)
    --no-diff | Skip saving git diff file

  g-rule | Add global agent rule to ~/.agents/rules/l-log-rules.md
  rule | Add local agent rule to .agents/rules/llm-lean-log.md
  
  help, -h, --help | Show this help message
    --human | Show human-readable output (default for terminal)
  
  export md | Export logs to Markdown files (Obsidian style)
    --vault=<path> | Path to Markdown vault (e.g. Obsidian)

  export jsonl | Export logs to JSON Lines format
    --out=<path> | Output file path

  -v, -V, --version | Show version number

Examples for LLMs:
  l-log list ./logs/example.csv
  l-log stats
  l-log view 0
  l-log view --last
  l-log search "memory"
  l-log tags error api
  l-log add ./logs/chat.csv "Task name" --tags="tag1,tag2" --problem="Detailed problem description" --solution="Detailed solution" --action="Action taken" --files="file1.ts,file2.ts" --tech-stack="bun,ts" --created-by-agent="Antigravity"
  l-log g-rule
  l-log export md ./logs/chat.csv --vault=./my-vault
  l-log export jsonl ./logs/chat.csv --out=./logs/export.jsonl
`;

export const agentRule = `---
trigger: always_on
---

# Common rules for LLM agent

Whenever you finish a task or change codes, always log your work using the l-log bash command (llm-lean-log-cli package) with the following format:

\`l-log add ./logs/chat.csv "<Task Name>" --tags="<tags>" --problem="<problem>" --solution="<solution>" --action="<action>" --files="<files>" --tech-stack="<tech>" --cause="<cause>" --created-by-agent="<agent-name>"\`

Note: \`--last-commit-short-sha\` is optional and will be auto-populated by the CLI if not provided.

Before run:

- Install the l-log CLI if not already installed: \`bun add -g llm-lean-log-cli\`.
- If need, run CLI help command: \`l-log -h\` for more information.
- log path: \`./logs/chat.csv\`.
`;
