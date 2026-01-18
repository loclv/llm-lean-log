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
add <name>,"--tags=<tags>,--problem=<text>,--solution=<text>,--action=<text>,--files=<files>,--tech-stack=<tech>,--model=<name>,--cause=<text>,--causeIds=<ids>,--effectIds=<ids>,--last-commit-short-sha=<sha>,--created-at=<time>,--updated-at=<time>,--created-by-agent=<name>",Add a new log entry
help|-h|--help,--human,Show this help message
-v|-V|--version,,Show version number

examples
l-log list ./logs/example.csv
l-log stats
l-log view 0
l-log view --last
l-log search "memory"
l-log tags error api
l-log add ./logs/chat.csv "Fix bug" --tags=bug,fix --problem="Bug description" --files="file1.ts,src/file2.ts" --tech-stack="ts,react" --cause="" --causeIds="721ace2b-5e73-4901-bef9-97de16bf170f" --last-commit-short-sha="a1b2c3d" --model="gpt-4o"
`;

export const helpTextForHuman = `l-log CLI

Usage: l-log <command> [log-file] [options]

Commands:
  list, ls              List all log entries
    --compact, -c       Show compact view
    --human             Show human-readable output (with colors)
  
  stats                 Show log statistics
    --human             Show human-readable output (with colors)
  
  view <index>          View detailed entry at index
    --last              Show the last log entry
    --human             Show human-readable output (with colors)
  
  search <query>        Search logs by name, problem, or solution
    --human             Show human-readable output (with colors)
  
  tags <tag1> [tag2]    Filter logs by tags
    --human             Show human-readable output (with colors)
  
  add <name>            Add a new log entry
    --tags=<tags>       Comma-separated tags, wrap with double quotes if multiple tags
    --problem=<text>    Problem description
    --solution=<text>   Solution description
    --action=<text>     Action taken
    --files=<files>     Comma-separated files paths, wrap with double quotes if multiple files
    --tech-stack=<tech> Comma-separated tech stack, wrap with double quotes if multiple tech stack
    --model=<name>      Model name
    --cause=<text>      Cause description
    --causeIds=<ids>    Comma-separated cause log row UUIDs, wrap with double quotes if multiple cause log row UUIDs
    --effectIds=<ids>   Comma-separated effect log row UUIDs, wrap with double quotes if multiple effect log row UUIDs
    --last-commit-short-sha=<sha> Last git commit short SHA
    --created-at=<time> Creation time (ISO 8601 formatted string)
    --updated-at=<time> Update time (ISO 8601 formatted string)
    --created-by-agent=<name> Agent model name
  
  help, -h, --help      Show this help message
    --human             Show human-readable output (default for terminal)
  
  -v, -V, --version     Show version number

Examples for LLMs:
  l-log list ./logs/example.csv
  l-log stats
  l-log view 0
  l-log view --last
  l-log search "memory"
  l-log tags error api
  l-log add ./logs/chat.csv "Fix bug" --tags=bug,fix --problem="Bug description" --files="file1.ts,src/file2.ts" --tech-stack="ts,react" --cause="" --causeIds="721ace2b-5e73-4901-bef9-97de16bf170f" --last-commit-short-sha="a1b2c3d" --model="gpt-4o"
`;
