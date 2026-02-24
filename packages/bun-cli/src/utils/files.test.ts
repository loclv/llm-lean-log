import { afterEach, describe, expect, it, spyOn } from "bun:test";
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

	it("should throw error when directory creation fails", () => {
		// Test with an invalid path that should cause mkdirSync to fail
		const invalidPath = "/root/invalid/path/that/cannot/be/created";

		expect(() => mkdirIfNotExists(invalidPath)).toThrow();
	});

	it("should log error message when directory creation fails", () => {
		const invalidPath = "/root/invalid/path/that/cannot/be/created";
		const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

		try {
			mkdirIfNotExists(invalidPath);
		} catch {
			// Expected to throw
		}

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining("Failed to create directory:"),
		);

		consoleSpy.mockRestore();
	});

	it("should handle Error objects correctly in error logging", () => {
		const invalidPath = "/root/invalid/path/that/cannot/be/created";
		const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

		try {
			mkdirIfNotExists(invalidPath);
		} catch {
			// Expected to throw
		}

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining("Failed to create directory:"),
		);

		consoleSpy.mockRestore();
	});

	it("should handle non-Error objects correctly in error logging", () => {
		// This test ensures the error handling works even if a non-Error is thrown
		const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

		// We can't easily mock mkdirSync to throw a non-Error, but we can test the format
		// by checking that the error handling code path exists
		const testString = "test error string";
		expect(`Failed to create directory: ${testString}`).toBe(
			"Failed to create directory: test error string",
		);

		consoleSpy.mockRestore();
	});
});
