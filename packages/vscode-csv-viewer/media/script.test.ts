import { beforeEach, describe, expect, it } from "bun:test";
import { Window } from "happy-dom";

const window = new Window();
// @ts-expect-error
global.window = window;
// @ts-expect-error
global.document = window.document;
// @ts-expect-error
global.acquireVsCodeApi = () => ({
	postMessage: () => {},
	setState: () => {},
	getState: () => ({}),
});
// @ts-expect-error
global.FileReader = window.FileReader;

const script = require("./script.js");

describe("media/script.js", () => {
	describe("Pure Functions", () => {
		describe("getFileName", () => {
			it("should extract filename from path", () => {
				expect(script.getFileName("/path/to/file.csv")).toBe("file.csv");
			});
			it("should return Unknown if empty", () => {
				expect(script.getFileName("")).toBe("Unknown");
			});
		});

		describe("escapeHtml", () => {
			it("should escape special characters", () => {
				const input = '<script>alert("xss")</script>';
				const output = script.escapeHtml(input);
				expect(output).toContain("&lt;script&gt;");
				expect(output).toContain("\"");
			});
			it("should return empty string for null/undefined", () => {
				expect(script.escapeHtml(null)).toBe("");
			});
		});

		describe("parseTags", () => {
			it("should parse comma-separated tags", () => {
				expect(script.parseTags(" tag1, tag2 ")).toEqual(["tag1", "tag2"]);
			});
			it("should return empty array for invalid inputs", () => {
				expect(script.parseTags("")).toEqual([]);
			});
		});

		describe("extractCode", () => {
			it("should extract code block", () => {
				const res = script.extractCode("js`console.log('hi')`");
				expect(res).toEqual({ language: "js", code: "console.log('hi')" });
			});
			it("should return null for no match", () => {
				expect(script.extractCode("plain text")).toBeNull();
			});
		});

		describe("formatDate", () => {
			it("should format date string", () => {
				const res = script.formatDate("2023-01-01T12:00:00Z");
				expect(res).toContain("2023");
			});
		});
	});

	describe("DOM & State Logic", () => {
		beforeEach(() => {
			document.body.innerHTML = `
                <div id="emptyState" style="display: flex;"></div>
                <div id="content" style="display: none;"></div>
                <div id="fileName"></div>
                <div id="logsContainer"></div>
                <div id="stats"></div>
                <div id="sortLabel">Oldest</div>
                <input id="searchInput" type="text" />
            `;
			script.setState({
				currentData: [],
				filteredData: [],
				searchTerm: "",
				sortOrder: "desc",
			});
		});

		describe("showContent / showEmpty", () => {
			it("showContent should toggle display styles", () => {
				script.showContent();
				expect(document.getElementById("emptyState")?.style.display).toBe(
					"none",
				);
				expect(document.getElementById("content")?.style.display).toBe("block");
			});
			it("showEmpty should toggle display styles", () => {
				script.showContent();
				script.showEmpty();
				expect(document.getElementById("content")?.style.display).toBe("none");
				expect(document.getElementById("emptyState")?.style.display).toBe(
					"flex",
				);
			});
		});

		describe("renderLogs", () => {
			it("should render log cards", () => {
				const logs = [{ name: "Log 1" }, { name: "Log 2" }];
				script.renderLogs(logs);
				const container = document.getElementById("logsContainer");
				expect(container?.children.length).toBe(2);
			});
		});

		describe("filterAndRender", () => {
			const testData = [
				{ name: "Apple", "created-at": "2023-01-01T10:00:00Z" },
				{ name: "Banana", "created-at": "2023-01-02T10:00:00Z" },
			];
			beforeEach(() => {
				script.setState({
					currentData: testData,
					filteredData: testData,
					searchTerm: "",
					sortOrder: "asc",
				});
			});

			it("should filter by search term", () => {
				script.setState({ searchTerm: "banana" });
				script.filterAndRender();
				const container = document.getElementById("logsContainer");
				expect(container?.innerHTML).toContain("Banana");
			});

			it("should sort data (desc)", () => {
				script.setState({ sortOrder: "desc", searchTerm: "" });
				script.filterAndRender();
				const container = document.getElementById("logsContainer");
				const firstCard = container?.firstElementChild;
				expect(firstCard?.innerHTML).toContain("Banana");
			});
		});

		describe("updateStats", () => {
			it("should update stats text", () => {
				script.setState({
					currentData: [1, 2, 3],
					filteredData: [1],
				});
				script.updateStats();
				const stats = document.getElementById("stats");
				expect(stats?.textContent).toBe("Showing 1 of 3 entries");
			});
		});
	});
});
