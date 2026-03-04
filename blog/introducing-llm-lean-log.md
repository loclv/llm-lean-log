# Introducing llm-lean-log: Token-Efficient Chat Logging for AI Agents

If you've ever worked with AI coding agents like Cursor, Windsurf, Claude Code, or OpenCode, you know how quickly conversations pile up. After weeks or months of back-and-forth with an AI assistant, you end up with thousands of lines of chat history—and trying to find that one solution from three weeks ago becomes a nightmare.

That's exactly the problem llm-lean-log was built to solve.

## The Problem with Current Approaches

Let me paint a familiar picture: You've been working on a project with an AI coding assistant for months. You've got hundreds of sessions logged, each containing problem descriptions, solutions, code changes, and explanations. Now you need to find that one bug fix from back when you were working on authentication.

What are your options?

1. Scroll through endless chat history - Painfully slow, and good luck finding the right context
2. Search the entire conversation - Works sometimes, but you're still wading through irrelevant messages
3. Export to Markdown/JSON - Creates massive files that cost a fortune in tokens when you feed them back to the AI

The core issue? Most logging tools were designed for humans to read, not for AI agents to process is great efficiently. Markdown for people but not good for token budgets. JSON is machine-readable but equally bloated.

## Enter llm-lean-log

`llm-lean-log` takes a fundamentally different approach. Instead of logging everything, it captures only what matters—in a format that's optimized for both storage and AI consumption.

Github: <https://github.com/loclv/llm-lean-log>

### The Secret Sauce: CSV with Cause-Effect Relationships

The key insight behind llm-lean-log is simple:

> structured tabular data is more token-efficient than free-form text

Here's what a typical log entry looks like:

```csv
id,name,tags,problem,solution,action,files,tech-stack,causeIds,created-at
auth-error-001,API Authentication Error,"error,api,auth",Users unable to login due to JWT token expiration,Added token refresh logic with refresh endpoint,"Updated auth.ts middleware and added refresh endpoint","src/middleware/auth.ts","typescript,express,jwt",,2026-01-13T14:52:58Z
```

Each field is intentional:

- id - Unique identifier for linking cause-effect relationships
- name - Short summary (what happened)
- tags - Categorization for filtering
- problem - What went wrong
- solution - How it was fixed
- action - Commands or steps taken
- files - What was modified
- tech-stack - Technologies involved
- causeIds/effectIds - Link to related logs (this is the game-changer!)

### The Cause-Effect Graph

The most powerful feature is the ability to link logs together. Each entry can reference `causeIds` (what led to this problem) and `effectIds` (what resulted from it). This creates a directed graph of your project history—perfect for understanding the context behind any change.

## How It Works

### For AI Agents

The workflow is designed to be seamless for AI agents:

```bash
# Save a log entry
l-log add ./logs/chat.csv "Fix JWT token expiration" \
  --tags="bug,auth,security" \
  --problem="Users getting logged out randomly" \
  --solution="Implemented token refresh with exponential backoff" \
  --files="src/middleware/auth.ts" \
  --tech-stack="typescript,express,jwt"
```

```bash
# Retrieve the last entry (efficient for AI)
l-log view ./logs/chat.csv --last

# Search across all logs
l-log search ./logs/chat.csv "authentication"
```

### For Humans

When you need to actually read the logs, there's a beautiful CLI and web visualizer:

```bash
# Human-friendly output with colors
l-log list ./logs/chat.csv --human

# Web-based graph visualization
l-log-vis ./logs/chat.csv
```

## Why This Matters

### Token Efficiency

The same information in llm-lean-log CSV format? Often much less. That means:

- Faster AI responses
- Lower API costs
- More context window for actual problem-solving

### Local-First

Your logs live in your project, not in some cloud service. No vendor lock-in, full control over your data.

### Built for AI Agents

The tool was designed from the ground up to be used by AI agents. The CLI is simple enough that you can instruct your favorite AI assistant to log its work automatically.

## Getting Started

```bash
# Install the CLI
bun add -g llm-lean-log-cli
# or with bun enviroment:
bun add -g bl-log
# expected: installed bl-log@0.2.11 with binaries:
#  - l-log (this means it is ready to use by `l-log` command, not package name)

# Add to your agent configuration (example for Cursor/Windsurf)
# In your .agent/rules/common.md:
# Whenever you finish a task, run:
# l-log add ./logs/chat.csv "<Task Name>" --tags="<tags>" --problem="<problem>"
```

## The Bigger Vision

llm-lean-log is more than just a logging tool—it's the beginning of a new way to track software development history. By capturing solutions (not just conversations) in a structured format, you're building a knowledge base that:

- Helps future AI agents understand your project's evolution
- Makes onboarding to new projects faster
- Creates a searchable archive of solutions

The cause-effect linking is particularly powerful. Imagine being able to ask: "What authentication problems have we had, and what were their downstream effects?" That's now possible with this graph-based approach.

## Conclusion

If you're serious about working with AI coding assistants, you need a way to capture and retrieve knowledge efficiently. llm-lean-log provides exactly that—a lean, mean, token-efficient logging machine that plays nicely with both AI agents and human developers.

Give it a try. Your future self will thank you when you're trying to remember why you made that change six months ago with multiple AI agents (claude, cursor, windsurf, opencode, kilocode, etc.).

---

*llm-lean-log: Logging for LLMs, but we cut the fat.*
