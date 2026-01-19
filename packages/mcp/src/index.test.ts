import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { registerMemoryMcpHandlers } from "./index";

describe("MCP Handlers", () => {
	const testLogPath = path.resolve(process.cwd(), "test-handlers.csv");

	const setup = () => {
		fs.writeFileSync(
			testLogPath,
			"name,problem,solution,tags,created-at\nTask 1,Prob 1,Sol 1,tag1,2024-01-01\nTask 2,Prob 2,Sol 2,tag2,2024-01-02\n",
		);

		const resources = new Map<string, Function>();
		const tools = new Map<string, Function>();
		const prompts = new Map<string, Function>();

		const mockServer = {
			registerResource: (
				uri: string,
				_schema: any,
				options: any,
				handler: Function,
			) => {
				resources.set(uri, handler || options); // Adjust based on overloads
			},
			registerTool: (name: string, _schema: any, handler: Function) => {
				tools.set(name, handler);
			},
			registerPrompt: (name: string, _schema: any, handler: Function) => {
				prompts.set(name, handler);
			},
		} as any;

		return { mockServer, resources, tools, prompts };
	};

	test("should handle recent-logs resource", async () => {
		const { mockServer, resources } = setup();
		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = resources.get("recent-logs");
		if (!handler) {
			throw new Error("recent-logs handler not found");
		}

		expect(handler).toBeDefined();

		const result = await handler({ href: "memory://recent" });
		expect(result.contents[0].text).toContain("Task 1");
		expect(result.contents[0].text).toContain("Task 2");

		fs.unlinkSync(testLogPath);
	});

	test("should handle last-log resource", async () => {
		const { mockServer, resources } = setup();
		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = resources.get("last-log");
		if (!handler) {
			throw new Error("last-log handler not found");
		}

		const result = await handler({ href: "memory://last" });
		expect(result.contents[0].text).toContain("Task 2");
		expect(result.contents[0].text).toContain("Problem: Prob 2");

		fs.unlinkSync(testLogPath);
	});

	test("should handle last-log resource with no entries", async () => {
		const { mockServer, resources } = setup();
		fs.writeFileSync(testLogPath, "name,problem,solution,tags,created-at\n");
		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = resources.get("last-log");
		if (!handler) {
			throw new Error("last-log handler not found");
		}

		const result = await handler({ href: "memory://last" });
		expect(result.contents[0].text).toBe("No log entries found.");

		fs.unlinkSync(testLogPath);
	});

	test("should respect RECENT_LOGS_LIMIT in recent-logs", async () => {
		const { mockServer, resources } = setup();
		let content = "name,problem,solution,tags,created-at\n";
		for (let i = 1; i <= 60; i++) {
			content += `Task ${i},Prob ${i},Sol ${i},tag,2024-01-${i.toString().padStart(2, "0")}\n`;
		}
		fs.writeFileSync(testLogPath, content);

		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = resources.get("recent-logs");
		if (!handler) {
			throw new Error("recent-logs handler not found");
		}
		const result = await handler({ href: "memory://recent" });
		const lines = result.contents[0].text.split("\n");

		// Limit is 50
		expect(lines.length).toBe(50);
		// Should be reverse chronological: 60...11
		expect(lines[0]).toContain("Task 60");
		expect(lines[49]).toContain("Task 11");

		fs.unlinkSync(testLogPath);
	});

	test("should handle log-stats resource", async () => {
		const { mockServer, resources } = setup();
		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = resources.get("log-stats");
		if (!handler) {
			throw new Error("log-stats handler not found");
		}
		const result = await handler({ href: "memory://stats" });
		const stats = JSON.parse(result.contents[0].text);
		expect(stats.totalEntries).toBe(2);
		expect(stats.uniqueTags).toContain("tag1");

		fs.unlinkSync(testLogPath);
	});

	test("should handle log-stats resource with empty logs", async () => {
		const { mockServer, resources } = setup();
		fs.writeFileSync(testLogPath, "name,problem,solution,tags,created-at\n");
		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = resources.get("log-stats");
		if (!handler) {
			throw new Error("log-stats handler not found");
		}
		const result = await handler({ href: "memory://stats" });
		const stats = JSON.parse(result.contents[0].text);
		expect(stats.totalEntries).toBe(0);
		expect(stats.lastEntry).toBeNull();
		expect(stats.uniqueTags.length).toBe(0);

		fs.unlinkSync(testLogPath);
	});

	test("should handle search_logs tool", async () => {
		const { mockServer, tools } = setup();
		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = tools.get("search_logs");
		if (!handler) {
			throw new Error("search_logs handler not found");
		}
		const result = await handler({ query: "Task 1" });

		const data = JSON.parse(result.content[0].text);
		expect(data.length).toBe(1);
		expect(data[0].name).toBe("Task 1");

		fs.unlinkSync(testLogPath);
	});

	test("should handle search_logs tool with no matches", async () => {
		const { mockServer, tools } = setup();
		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = tools.get("search_logs");
		if (!handler) {
			throw new Error("search_logs handler not found");
		}
		const result = await handler({ query: "NonExistent" });

		const data = JSON.parse(result.content[0].text);
		expect(data.length).toBe(0);

		fs.unlinkSync(testLogPath);
	});

	test("should handle get_task_history tool", async () => {
		const { mockServer, tools } = setup();
		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = tools.get("get_task_history");
		if (!handler) {
			throw new Error("get_task_history handler not found");
		}
		const result = await handler({ taskName: "Task 2" });

		const data = JSON.parse(result.content[0].text);
		expect(data.length).toBe(1);
		expect(data[0].name).toBe("Task 2");

		fs.unlinkSync(testLogPath);
	});

	test("should handle recent_work prompt", async () => {
		const { mockServer, prompts } = setup();
		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = prompts.get("recent_work");
		if (!handler) {
			throw new Error("recent_work handler not found");
		}
		const result = await handler();
		expect(result.messages[0].content.text).toContain("Task 1");
		expect(result.messages[0].content.text).toContain("Task 2");

		fs.unlinkSync(testLogPath);
	});

	test("should respect RECENT_WORK_LIMIT in recent_work", async () => {
		const { mockServer, prompts } = setup();
		let content = "name,problem,solution,tags,created-at\n";
		for (let i = 1; i <= 25; i++) {
			content += `Task ${i},Prob ${i},Sol ${i},tag,2024-01-${i.toString().padStart(2, "0")}\n`;
		}
		fs.writeFileSync(testLogPath, content);

		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = prompts.get("recent_work");
		if (!handler) {
			throw new Error("recent_work handler not found");
		}
		const result = await handler();
		const lines = result.messages[0].content.text
			.split("\n")
			.filter((l: string) => l.startsWith("- "));

		// Limit is 20
		expect(lines.length).toBe(20);
		// Should be reverse chronological: 25...6
		expect(lines[0]).toContain("Task 25");
		expect(lines[19]).toContain("Task 6");

		fs.unlinkSync(testLogPath);
	});

	test("should reflect file changes after calling refreshCache", async () => {
		const { mockServer, resources } = setup();
		const refresh = registerMemoryMcpHandlers(mockServer, testLogPath);
		await refresh();

		const statsHandler = resources.get("log-stats");
		if (!statsHandler) {
			throw new Error("log-stats handler not found");
		}

		const result1 = await statsHandler({ href: "memory://stats" });
		expect(JSON.parse(result1.contents[0].text).totalEntries).toBe(2);

		// Manually append to file
		fs.appendFileSync(testLogPath, "Task 3,Prob 3,Sol 3,tag3,2024-01-03\n");

		// Refresh
		await refresh();

		const result2 = await statsHandler({ href: "memory://stats" });
		expect(JSON.parse(result2.contents[0].text).totalEntries).toBe(3);

		fs.unlinkSync(testLogPath);
	});
	test("should handle learned prompt", async () => {
		const { mockServer, prompts } = setup();
		fs.writeFileSync(
			testLogPath,
			"name,problem,solution,tags,created-at\n" +
				"Bug Task,It crashes,Fix it,bug,2024-01-01\n" +
				"Regular Task,New feature,Done,,2024-01-02\n" +
				"Error Task,Found error,Resolved,fix,2024-01-03\n",
		);
		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = prompts.get("learned");
		if (!handler) {
			throw new Error("learned handler not found");
		}
		const result = await handler();
		const text = result.messages[0].content.text;

		expect(text).toContain("Problem: It crashes");
		expect(text).toContain("Problem: Found error");
		expect(text).not.toContain("Problem: New feature");

		fs.unlinkSync(testLogPath);
	});

	test("should respect limit in learned prompt", async () => {
		const { mockServer, prompts } = setup();
		let content = "name,problem,solution,tags,created-at\n";
		for (let i = 1; i <= 15; i++) {
			content += `Bug ${i},Crash ${i},Fixed ${i},bug,2024-01-${i.toString().padStart(2, "0")}\n`;
		}
		fs.writeFileSync(testLogPath, content);

		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = prompts.get("learned");
		if (!handler) {
			throw new Error("learned handler not found");
		}
		const result = await handler();
		const text = result.messages[0].content.text;
		const occurrences = (text.match(/Problem: /g) || []).length;

		// Limit is 10
		expect(occurrences).toBe(10);
		// Should be the last 10 (Bug 6 to Bug 15)
		expect(text).toContain("Problem: Crash 15");
		expect(text).toContain("Problem: Crash 6");
		expect(text).not.toContain("Problem: Crash 5");

		fs.unlinkSync(testLogPath);
	});

	test("should handle up prompt", async () => {
		const { mockServer, prompts } = setup();
		fs.writeFileSync(
			testLogPath,
			"name,problem,solution,tags,created-at\n" +
				"Yesterday Task 1,Prob 1,Sol 1,tag1,2024-01-01T10:00:00Z\n" +
				"Today Task 2,Prob 2,Sol 2,tag2,2024-01-02T10:00:00Z\n" +
				"Today Task 3,Prob 3,Sol 3,tag3,2024-01-02T11:00:00Z\n",
		);
		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = prompts.get("up");
		if (!handler) {
			throw new Error("up handler not found");
		}
		const result = await handler();
		const text = result.messages[0].content.text;

		expect(text).toContain("Today Task 2");
		expect(text).toContain("Today Task 3");
		expect(text).toContain("Yesterday Task 1");
		expect(text).toContain("2024-01-02");

		fs.unlinkSync(testLogPath);
	});

	test("should handle up prompt with no entries", async () => {
		const { mockServer, prompts } = setup();
		fs.writeFileSync(testLogPath, "name,problem,solution,tags,created-at\n");
		await registerMemoryMcpHandlers(mockServer, testLogPath)();

		const handler = prompts.get("up");
		if (!handler) {
			throw new Error("up handler not found");
		}
		const result = await handler();
		expect(result.messages[0].content.text).toBe(
			"What did I do last time and what's next?",
		);

		fs.unlinkSync(testLogPath);
	});
});
