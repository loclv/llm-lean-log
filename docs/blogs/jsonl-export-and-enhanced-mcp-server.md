# JSONL Export and Enhanced MCP Server - Major Updates to llm-lean-log

Date: May 10, 2026
We're excited to announce significant enhancements to the llm-lean-log project, including new JSONL export functionality and a dramatically improved MCP server with 6 new powerful tools!

## JSONL Export Functionality

### What's New?
- JSONL Export Commands: Both CLI packages now support `export jsonl` and `export json-lines` commands
- Flexible Output Options: Use `--out`, `--path`, or `--file` flags to specify your output destination
- Core JSONL Utilities: New `llm-lean-log-core` functions for converting logs to/from JSONL format
- Machine-Readable Format: Perfect for programmatic processing and data analysis

### Usage Examples
```bash
# Basic JSONL export
l-log export jsonl ./logs/chat.csv --out=output.jsonl

# Using alias
l-log export json-lines ./logs/chat.csv --path=output.jsonl

# Using file flag
l-log export jsonl ./logs/chat.csv --file=output.jsonl
```

### Why JSONL?
JSONL (JSON Lines) format is ideal for:
- Stream processing of large log files
- Integration with data analysis tools
- Machine learning pipelines
- Programmatic log processing

## Enhanced MCP Server - Now with 8 Tools!

The llm-memory MCP server has been supercharged with 6 new tools, expanding from 2 to 8 total tools for comprehensive log analysis and context retrieval.

### New Tools Added

#### 1. get_logs_by_tags(tags)
Filter logs by specific tags like `['bug', 'fix', 'api']`. Perfect for finding all entries related to specific categories.

#### 2. get_logs_by_date_range(startDate, endDate)
Filter logs by date range. Ideal for analyzing work within specific time periods or tracking project progress.

#### 3. get_logs_by_agent(agent)
Filter logs by the agent/LLM that created them. Track work by specific AI agents (claude, gpt, cascade, etc.).

#### 4. get_problem_patterns()
Analyze common problem patterns in your log history. Identifies recurring issues like "error", "timeout", "connection", etc.

#### 5. get_solution_suggestions(problem)
Get solution suggestions based on similar problems. Returns top 5 most relevant solutions from past issues.

#### 6. get_log_statistics()
Get detailed statistics about your log history, including entries by agent, tags, problem types, and solution types.

### Complete Tool List
1. `search_logs(query)` - Search log history
2. `get_task_history(taskName)` - Get task-related entries
3. `get_logs_by_tags(tags)` - Filter by tags
4. `get_logs_by_date_range(startDate, endDate)` - Filter by date range
5. `get_logs_by_agent(agent)` - Filter by agent
6. `get_problem_patterns()` - Analyze patterns
7. `get_solution_suggestions(problem)` - Get suggestions
8. `get_log_statistics()` - Get statistics

## Enhanced Capabilities

### Better Context Retrieval
AI agents can now:
- Filter logs by multiple criteria (tags, dates, agents)
- Analyze patterns to identify common issues
- Get intelligent solution suggestions
- Access comprehensive statistics

### Improved Developer Experience
- More granular log filtering
- Pattern recognition for recurring issues
- Solution recommendations based on history
- Detailed analytics and insights

## Technical Improvements

### Comprehensive Testing
- Added unit tests for all JSONL functionality
- Enhanced test coverage for CLI packages
- Validated error handling and edge cases

### Documentation Updates
- Updated README files across all packages
- Enhanced MCP server documentation
- Added usage examples and best practices

## Getting Started

### Update Your Packages
```bash
# Update to latest versions
bun update llm-lean-log-cli
bun update bl-log
bun update l-log-mcp-server
```

### Try JSONL Export
```bash
# Export your logs to JSONL
l-log export jsonl ./logs/chat.csv --out=my-logs.jsonl
```

### Enhanced MCP Configuration
The MCP server automatically includes all new tools. Just restart your AI client to access the enhanced capabilities.

## What's Next?

We're continuously improving llm-lean-log based on your feedback. Future updates will focus on:
- More export formats
- Advanced analytics features
- Enhanced pattern recognition
- Better integration with development workflows

## Feedback and Contributions

We'd love to hear how you're using these new features! Share your experiences, report issues, or contribute to the project on GitHub.
Tags: #jsonl #export #mcp #tools #enhancement #llm-lean-log
