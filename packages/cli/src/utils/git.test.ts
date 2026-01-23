import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { EventEmitter } from "node:events";
import { getLastCommitShortSha, saveGitDiffExcludeLockFiles } from "./git";

// Create a mock for stdout/stderr
class MockStream extends EventEmitter {
	setEncoding() {}
	pause() {}
	resume() {}
}

// Type alias for mock process
type MockProcess = EventEmitter & {
	stdout: MockStream;
	stderr: MockStream;
};

const mockSpawn = mock(() => {
	const mockProcess: MockProcess = new EventEmitter() as MockProcess;
	mockProcess.stdout = new MockStream();
	mockProcess.stderr = new MockStream();
	return mockProcess;
});

// Mock child_process
mock.module("node:child_process", () => ({
	spawn: mockSpawn,
}));

// Mock fs/promises
const mockMkdir = mock(() => Promise.resolve());
const mockWriteFile = mock(() => Promise.resolve());

mock.module("node:fs/promises", () => ({
	mkdir: mockMkdir,
	writeFile: mockWriteFile,
}));

// Mock node:path
mock.module("node:path", () => ({
	dirname: (path: string) => {
		const parts = path.split("/");
		return parts.slice(0, -1).join("/");
	},
}));

describe("git utilities", () => {
	describe("getLastCommitShortSha", () => {
		it("should return a short SHA when git succeeds", async () => {
			mockSpawn.mockImplementation(() => {
				const p: MockProcess = new EventEmitter() as MockProcess;
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
				const p: MockProcess = new EventEmitter() as MockProcess;
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
				const p: MockProcess = new EventEmitter() as MockProcess;
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
				const p: MockProcess = new EventEmitter() as MockProcess;
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

	describe("saveGitDiffExcludeLockFiles", () => {
		beforeEach(() => {
			mockMkdir.mockClear();
			mockWriteFile.mockClear();
		});

		it("should save git diff successfully when git diff succeeds", async () => {
			const diffContent = "diff --git a/file.txt b/file.txt\n+new content";
			mockSpawn.mockImplementation(() => {
				const p: MockProcess = new EventEmitter() as MockProcess;
				p.stdout = new MockStream();
				p.stderr = new MockStream();
				setTimeout(() => {
					p.stdout.emit("data", Buffer.from(diffContent));
					p.emit("close", 0);
				}, 10);
				return p;
			});

			const result = await saveGitDiffExcludeLockFiles("logs/diff/test.diff");

			expect(result).toBe(true);
			expect(mockMkdir).toHaveBeenCalledWith("logs/diff", { recursive: true });
			expect(mockWriteFile).toHaveBeenCalledWith(
				"logs/diff/test.diff",
				diffContent,
				"utf8",
			);
		});

		it("should return false when git diff fails with error", async () => {
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
			let callCount = 0;
			mockSpawn.mockImplementation(() => {
				const p: MockProcess = new EventEmitter() as MockProcess;
				p.stdout = new MockStream();
				p.stderr = new MockStream();

				callCount++;
				setTimeout(() => {
					if (callCount === 1) {
						// First call is for git diff - should fail with error
						p.stderr.emit("data", Buffer.from("fatal: not a git repository"));
						p.emit("close", 128);
					} else {
						// Second call is for git rev-parse - should fail (not in git repo)
						p.emit("close", 128);
					}
				}, 10);
				return p;
			});

			const result = await saveGitDiffExcludeLockFiles("logs/diff/test.diff");

			expect(result).toBe(false);
			expect(consoleSpy).toHaveBeenCalledWith(
				"[git] diff error: Not in a git repository",
			);
			expect(mockMkdir).not.toHaveBeenCalled();
			expect(mockWriteFile).not.toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it("should return false when working tree is clean (no changes)", async () => {
			let callCount = 0;
			mockSpawn.mockImplementation(() => {
				const p: MockProcess = new EventEmitter() as MockProcess;
				p.stdout = new MockStream();
				p.stderr = new MockStream();

				callCount++;
				setTimeout(() => {
					if (callCount === 1) {
						// First call is for git diff - should fail with "working tree clean"
						p.stderr.emit("data", Buffer.from("working tree clean"));
						p.emit("close", 1);
					} else {
						// Second call is for git rev-parse - should succeed
						p.stdout.emit("data", Buffer.from("abc1234\n"));
						p.emit("close", 0);
					}
				}, 10);
				return p;
			});

			const result = await saveGitDiffExcludeLockFiles("logs/diff/test.diff");

			expect(result).toBe(false);
			expect(mockMkdir).not.toHaveBeenCalled();
			expect(mockWriteFile).not.toHaveBeenCalled();
		});

		it("should return false when git spawn fails", async () => {
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
			mockSpawn.mockImplementation(() => {
				const p: MockProcess = new EventEmitter() as MockProcess;
				p.stdout = new MockStream();
				p.stderr = new MockStream();
				setTimeout(() => {
					p.emit("error", new Error("spawn ENOENT"));
				}, 10);
				return p;
			});

			const result = await saveGitDiffExcludeLockFiles("logs/diff/test.diff");

			expect(result).toBe(false);
			expect(consoleSpy).toHaveBeenCalledWith(
				"[git] diff error: Git is not installed or not accessible",
			);
			expect(mockMkdir).not.toHaveBeenCalled();
			expect(mockWriteFile).not.toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it("should return false when mkdir fails", async () => {
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
			const diffContent = "diff --git a/file.txt b/file.txt\n+new content";

			mockSpawn.mockImplementation(() => {
				const p: MockProcess = new EventEmitter() as MockProcess;
				p.stdout = new MockStream();
				p.stderr = new MockStream();
				setTimeout(() => {
					p.stdout.emit("data", Buffer.from(diffContent));
					p.emit("close", 0);
				}, 10);
				return p;
			});

			mockMkdir.mockRejectedValue(new Error("Permission denied"));

			const result = await saveGitDiffExcludeLockFiles("logs/diff/test.diff");

			expect(result).toBe(false);
			expect(consoleSpy).toHaveBeenCalledWith(
				"Error writing diff file:",
				expect.any(Error),
			);
			expect(mockWriteFile).not.toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it("should return false when writeFile fails", async () => {
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
			const diffContent = "diff --git a/file.txt b/file.txt\n+new content";

			mockSpawn.mockImplementation(() => {
				const p: MockProcess = new EventEmitter() as MockProcess;
				p.stdout = new MockStream();
				p.stderr = new MockStream();
				setTimeout(() => {
					p.stdout.emit("data", Buffer.from(diffContent));
					p.emit("close", 0);
				}, 10);
				return p;
			});

			mockWriteFile.mockRejectedValue(new Error("Disk full"));

			const result = await saveGitDiffExcludeLockFiles("logs/diff/test.diff");

			expect(result).toBe(false);
			expect(consoleSpy).toHaveBeenCalledWith(
				"Error writing diff file:",
				expect.any(Error),
			);
			expect(mockMkdir).toHaveBeenCalledWith("logs/diff", { recursive: true });
			consoleSpy.mockRestore();
		});
	});
});
