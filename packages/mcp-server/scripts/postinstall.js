#!/usr/bin/env node

const pkg = {
	mcp: {
		"llm-memory": {
			type: "local",
			command: ["l-log-mcp-server"],
			environment: {
				LLM_LOG_PATH: "/absolute/path/to/your/logs/chat.csv",
			},
		},
	},
};

console.log("\x1b[32m%s\x1b[0m", "\n✨ l-log-mcp-server summary:");
console.log(
	"\x1b[36m%s\x1b[0m",
	"To use this with OpenCode, add the following to your ~/.opencode.json:",
);
console.log("\x1b[90m%s\x1b[0m", JSON.stringify(pkg, null, 2));
console.log(
	"\x1b[33m%s\x1b[0m",
	"\nNote: Replace /absolute/path/to/your/logs/chat.csv with the actual path to your chat.csv file.",
);
console.log(
	"\x1b[36m%s\x1b[0m",
	"You can also get this config anytime by running: l-log-mcp-server --config\n",
);
