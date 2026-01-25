import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { getLogFolderPathFromLogFilePath, mkdirIfNotExists } from "./files";

describe("getLogFolderPathFromLogFilePath", () => {
	it("should return the directory name of a file path", () => {
		const result = getLogFolderPathFromLogFilePath("/path/to/logs/chat.csv");
		expect(result).toBe("/path/to/logs");
	});

	it("should handle relative paths", () => {
		const result = getLogFolderPathFromLogFilePath("./logs/chat.csv");
		expect(result).toBe("./logs");
	});

	it("should handle current directory files", () => {
		const result = getLogFolderPathFromLogFilePath("chat.csv");
		expect(result).toBe(".");
	});

	it("should handle nested directory paths", () => {
		const result = getLogFolderPathFromLogFilePath(
			"/very/deep/nested/path/to/file.csv",
		);
		expect(result).toBe("/very/deep/nested/path/to");
	});
});

describe("mkdirIfNotExists", () => {
	const testDir = "./test-temp-dir";

	afterEach(() => {
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true });
		}
	});

	it("should create directory if it doesn't exist", () => {
		expect(existsSync(testDir)).toBe(false);
		mkdirIfNotExists(testDir);
		expect(existsSync(testDir)).toBe(true);
	});

	it("should not throw error if directory already exists", () => {
		mkdirIfNotExists(testDir);
		expect(() => mkdirIfNotExists(testDir)).not.toThrow();
	});

	it("should create nested directories", () => {
		const nestedDir = `${testDir}/nested/deep`;
		expect(existsSync(nestedDir)).toBe(false);
		mkdirIfNotExists(nestedDir);
		expect(existsSync(nestedDir)).toBe(true);
	});
});
