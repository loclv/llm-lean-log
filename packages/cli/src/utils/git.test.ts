import { describe, expect, it, mock, spyOn } from "bun:test";
import { EventEmitter } from "node:events";
import { getLastCommitShortSha } from "./git";

// Create a mock for stdout/stderr
class MockStream extends EventEmitter {
	setEncoding() {}
	pause() {}
	resume() {}
}

const mockSpawn = mock(() => {
	const mockProcess: any = new EventEmitter();
	mockProcess.stdout = new MockStream();
	mockProcess.stderr = new MockStream();
	return mockProcess;
});

// Mock child_process
mock.module("node:child_process", () => ({
	spawn: mockSpawn,
}));

describe("git utilities", () => {
	describe("getLastCommitShortSha", () => {
		it("should return a short SHA when git succeeds", async () => {
			mockSpawn.mockImplementation(() => {
				const p: any = new EventEmitter();
				p.stdout = new MockStream();
				p.stderr = new MockStream();
				setTimeout(() => {
					p.stdout.emit("data", Buffer.from("abc1234\n"));
					p.emit("close", 0);
				}, 10);
				return p;
			});

			const sha = await getLastCommitShortSha();
			expect(sha).toBe("abc1234");
		});

		it("should return undefined and log error when git fails with stderr", async () => {
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
			mockSpawn.mockImplementation(() => {
				const p: any = new EventEmitter();
				p.stdout = new MockStream();
				p.stderr = new MockStream();
				setTimeout(() => {
					p.stderr.emit("data", Buffer.from("fatal: not a git repository"));
					p.emit("close", 128);
				}, 10);
				return p;
			});

			const sha = await getLastCommitShortSha();
			expect(sha).toBeUndefined();
			expect(consoleSpy).toHaveBeenCalledWith(
				"[git] error: fatal: not a git repository",
			);
			consoleSpy.mockRestore();
		});

		it("should return undefined when git fails without stderr", async () => {
			mockSpawn.mockImplementation(() => {
				const p: any = new EventEmitter();
				p.stdout = new MockStream();
				p.stderr = new MockStream();
				setTimeout(() => {
					p.emit("close", 1);
				}, 10);
				return p;
			});

			const sha = await getLastCommitShortSha();
			expect(sha).toBeUndefined();
		});

		it("should return undefined when git spawn fails (on error)", async () => {
			mockSpawn.mockImplementation(() => {
				const p: any = new EventEmitter();
				p.stdout = new MockStream();
				p.stderr = new MockStream();
				setTimeout(() => {
					p.emit("error", new Error("spawn ENOENT"));
				}, 10);
				return p;
			});

			const sha = await getLastCommitShortSha();
			expect(sha).toBeUndefined();
		});
	});
});
