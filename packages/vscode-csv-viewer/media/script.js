/**
 * CSV Log Viewer Webview Script
 *
 * This file is the client-side JavaScript for the VSCode CSV viewer extension.
 * It handles the user interface and data presentation in the webview panel.
 *
 * Purpose: Provides interactive viewing of CSV log entries with search, sorting,
 * and filtering capabilities within VSCode's embedded webview.
 *
 * Used when: A user opens a CSV file through the VSCode extension command
 * "llm-lean-log.view-csv" which launches a webview panel containing this script.
 *
 * Key features:
 * - File upload/drag-drop functionality for CSV files
 * - Real-time search filtering across all log fields
 * - Chronological sorting (newest/oldest)
 * - Renders structured log cards with syntax highlighting
 * - Communicates with VSCode extension via postMessage API
 */

let currentData = [];
let filteredData = [];
let searchTerm = "";
let sortOrder = "desc";
let isDragging = false;

const vscode = acquireVsCodeApi();

document.addEventListener("DOMContentLoaded", () => {
	document.getElementById("openFileBtn")?.addEventListener("click", () => {
		vscode.postMessage({ type: "openFile" });
	});

	const emptyFileInput = document.getElementById("emptyFileInput");
	const uploadInput = document.getElementById("uploadInput");
	const emptyState = document.getElementById("emptyState");

	const onFileSelected = (file) => {
		if (!file) return;
		if (!(file.type === "text/csv" || file.name?.endsWith(".csv"))) {
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const content = typeof reader.result === "string" ? reader.result : "";
			vscode.postMessage({
				type: "loadCsv",
				data: {
					fileName: file.name,
					content,
				},
			});
		};
		reader.readAsText(file);
	};

	emptyFileInput?.addEventListener("change", (e) => {
		const file = e.target?.files?.[0];
		onFileSelected(file);
	});

	uploadInput?.addEventListener("change", (e) => {
		const file = e.target?.files?.[0];
		onFileSelected(file);
	});

	const setDragging = (dragging) => {
		isDragging = dragging;
		if (!emptyState) return;
		if (isDragging) emptyState.classList.add("dragging");
		else emptyState.classList.remove("dragging");
	};

	// Drag and drop support on the empty state
	emptyState?.addEventListener("dragover", (e) => {
		e.preventDefault();
		setDragging(true);
	});

	emptyState?.addEventListener("dragleave", () => {
		setDragging(false);
	});

	emptyState?.addEventListener("drop", (e) => {
		e.preventDefault();
		setDragging(false);
		const file = e.dataTransfer?.files?.[0];
		onFileSelected(file);
	});

	document.getElementById("searchInput")?.addEventListener("input", (e) => {
		searchTerm = e.target.value.toLowerCase();
		filterAndRender();
	});

	document.getElementById("sortBtn")?.addEventListener("click", () => {
		sortOrder = sortOrder === "desc" ? "asc" : "desc";
		document.getElementById("sortLabel").textContent =
			sortOrder === "desc" ? "Newest" : "Oldest";
		filterAndRender();
	});

	document.getElementById("clearBtn")?.addEventListener("click", () => {
		vscode.postMessage({ type: "clear" });
	});

	vscode.postMessage({ type: "ready" });
});

window.addEventListener("message", (event) => {
	const message = event.data;

	switch (message.type) {
		case "setData":
			currentData = message.data || [];
			filteredData = [...currentData];
			if (currentData.length === 0) {
				showEmpty();
			} else {
				document.getElementById("fileName").textContent =
					`CSV Log Viewer - ${getFileName(message.filePath)}`;
				showContent();
				filterAndRender();
			}
			break;
	}
});

function showContent() {
	document.getElementById("emptyState").style.display = "none";
	document.getElementById("content").style.display = "block";
}

function showEmpty() {
	document.getElementById("content").style.display = "none";
	document.getElementById("emptyState").style.display = "flex";
}

function getFileName(filePath) {
	const parts = filePath.split("/");
	return parts[parts.length - 1] || "Unknown";
}

function filterAndRender() {
	filteredData = currentData.filter((log) => {
		if (!searchTerm) return true;
		return (
			log.name?.toLowerCase().includes(searchTerm) ||
			log.problem?.toLowerCase().includes(searchTerm) ||
			log.solution?.toLowerCase().includes(searchTerm) ||
			log.tags?.toLowerCase().includes(searchTerm) ||
			log.files?.toLowerCase().includes(searchTerm) ||
			log["tech-stack"]?.toLowerCase().includes(searchTerm) ||
			log.cause?.toLowerCase().includes(searchTerm)
		);
	});

	const sortedData = [...filteredData].sort((a, b) => {
		const timeA = new Date(a["created-at"] || 0).getTime();
		const timeB = new Date(b["created-at"] || 0).getTime();
		return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
	});

	renderLogs(sortedData);
	updateStats();
}

function renderLogs(logs) {
	const container = document.getElementById("logsContainer");
	container.innerHTML = logs
		.map((log, index) => createLogCard(log, index))
		.join("");
}

function createLogCard(log, index) {
	const tags = parseTags(log.tags);
	const codeInfo = extractCode(log.action);
	const createdAt = formatDate(log["created-at"]);

	return `
		<div class="log-card" style="animation: fadeIn 0.4s ease-out forwards; animation-delay: ${index * 0.05}s;">
			<div class="log-header">
				<h3>${escapeHtml(log.name || "Untitled")}</h3>
				${tags.length > 0 ? `<div class="tags">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
			</div>

			<div class="log-grid">
				<div class="log-section">
					<div class="log-section-label problem">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
						Problem
					</div>
					<p>${escapeHtml(log.problem || "")}</p>
				</div>

				<div class="log-section">
					<div class="log-section-label solution">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
						Solution
					</div>
					<p>${escapeHtml(log.solution || "")}</p>
				</div>
			</div>

			${
				log.cause
					? `
				<div class="log-section">
					<div class="log-section-label cause">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
						Cause
					</div>
					<p>${escapeHtml(log.cause)}</p>
				</div>
			`
					: ""
			}

			${
				log.action
					? `
				<div class="log-section">
					<div class="log-section-label action">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
						Action
					</div>
					<p>${codeInfo ? `${escapeHtml(log.action.replace(`${codeInfo.language}\`${codeInfo.code}\``, ""))}<pre style="background: var(--bg-tertiary); padding: 0.5rem; border-radius: 6px; overflow-x: auto; margin-top: 0.25rem;"><code>${escapeHtml(codeInfo.code)}</code></pre>` : escapeHtml(log.action)}</p>
				</div>
			`
					: ""
			}

			${
				log.files
					? `
				<div class="files-section">
					<div class="files-label">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
						Files
					</div>
					<div class="files-list">
						${log.files
							.split(",")
							.map((f) => f.trim())
							.filter(Boolean)
							.map(
								(file) =>
									`<span class="file-badge">${escapeHtml(file.trim())}</span>`,
							)
							.join("")}
					</div>
				</div>
			`
					: ""
			}

			${
				log["tech-stack"]
					? `
				<div class="tech-stack-section">
					<div class="tech-stack-label">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
						Tech Stack
					</div>
					<div class="tech-stack-list">
						${log["tech-stack"]
							.split(",")
							.map((t) => t.trim())
							.filter(Boolean)
							.map(
								(tech) =>
									`<span class="tech-badge">${escapeHtml(tech.trim())}</span>`,
							)
							.join("")}
					</div>
				</div>
			`
					: ""
			}

			<div class="log-meta">
				<div class="log-meta-left">
					${
						log.model
							? `
						<div class="meta-item">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
							${escapeHtml(log.model)}
						</div>
					`
							: ""
					}
					${
						log["created-by-agent"]
							? `
						<div class="meta-item">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
							${escapeHtml(log["created-by-agent"])}
						</div>
					`
							: ""
					}
					${
						log["last-commit-short-sha"]
							? `
						<div class="meta-item">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg>
							${escapeHtml(log["last-commit-short-sha"])}
						</div>
					`
							: ""
					}
				</div>
				<div class="log-date">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
					${createdAt}
				</div>
			</div>
		</div>
	`;
}

function parseTags(tags) {
	if (!tags) return [];
	return tags
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean);
}

function formatDate(dateStr) {
	if (!dateStr) return "";
	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) {
		return dateStr;
	}
	return (
		date.toLocaleDateString() +
		" " +
		date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
	);
}

function extractCode(text) {
	if (!text) return null;
	const codeRegex = /^([a-z]+)`([\s\S]*)`$/i;
	const match = text.match(codeRegex);
	if (match) {
		return { language: match[1].toLowerCase(), code: match[2].trim() };
	}
	const inlineRegex = /([a-z]+)`([^`]+)`/i;
	const inlineMatch = text.match(inlineRegex);
	if (inlineMatch) {
		return {
			language: inlineMatch[1].toLowerCase(),
			code: inlineMatch[2].trim(),
		};
	}
	return null;
}

function escapeHtml(text) {
	if (!text) return "";
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

function updateStats() {
	const statsEl = document.getElementById("stats");
	statsEl.textContent = `Showing ${filteredData.length} of ${currentData.length} entries`;
}

if (typeof module !== 'undefined') {
	module.exports = {
		showContent,
		showEmpty,
		getFileName,
		filterAndRender,
		renderLogs,
		createLogCard,
		parseTags,
		formatDate,
		extractCode,
		escapeHtml,
		updateStats,
		setState: (state) => {
			if (state.currentData) currentData = state.currentData;
			if (state.filteredData) filteredData = state.filteredData;
			if (state.searchTerm !== undefined) searchTerm = state.searchTerm;
			if (state.sortOrder) sortOrder = state.sortOrder;
		},
		getState: () => ({ currentData, filteredData, searchTerm, sortOrder })
	};
}
