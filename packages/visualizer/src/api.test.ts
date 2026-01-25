import { describe, expect, it, mock } from "bun:test";

// Import the function after mocking
const { fetchDiffByLogId } = await import("./utils");

describe("fetchDiffByLogId", () => {
	it("should fetch diff content successfully", async () => {
		// Mock global fetch with proper Response interface
		const mockFetch = mock(() =>
			Promise.resolve({
				ok: true,
				text: () => Promise.resolve("diff content"),
			}),
		);
		global.fetch = mockFetch as unknown as typeof fetch;

		const result = await fetchDiffByLogId("test-uuid");
		expect(result).toBe("diff content");
		expect(mockFetch).toHaveBeenCalledWith("/api/diff/test-uuid");
	});

	it("should return null when response is not ok", async () => {
		// Mock global fetch for not ok response
		const mockFetch = mock(() =>
			Promise.resolve({
				ok: false,
			}),
		);
		global.fetch = mockFetch as unknown as typeof fetch;

		const result = await fetchDiffByLogId("test-uuid");
		expect(result).toBeNull();
	});

	it("should return null when fetch fails", async () => {
		// Mock console.error to capture the error
		const mockConsoleError = mock();
		const originalConsoleError = console.error;
		console.error = mockConsoleError;

		// Mock fetch to throw error
		const mockFetch = mock(() => Promise.reject(new Error("Network error")));
		global.fetch = mockFetch as unknown as typeof fetch;

		const result = await fetchDiffByLogId("test-uuid");
		expect(result).toBeNull();
		expect(mockConsoleError).toHaveBeenCalledWith(
			"Failed to fetch diff:",
			new Error("Network error"),
		);

		// Restore console.error
		console.error = originalConsoleError;
	});
});
