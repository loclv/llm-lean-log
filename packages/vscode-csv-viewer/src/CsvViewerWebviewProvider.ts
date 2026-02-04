import { type LogEntry } from "llm-lean-log-core";
import * as vscode from "vscode";
import { parseCsvContent } from "./utils";

/**
 * Webview provider for the CSV Log Viewer
 */
export class CsvViewerWebviewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = "csvViewer.logsView";
	private view?: vscode.WebviewView;
	private data: LogEntry[] = [];
	private currentFilePath: string = "";

	constructor(private readonly extensionUri: vscode.Uri) {}

	/**
	 * Sets the data to be displayed in the webview
	 */
	public setData(data: LogEntry[], filePath: string): void {
		this.data = data;
		this.currentFilePath = filePath;
		this.updateWebview();
	}

	/**
	 * Shows the webview
	 */
	public show(): void {
		this.view?.show(true);
	}

	/**
	 * Resolves the webview
	 */
	resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	): void {
		this.view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri],
		};

		webviewView.webview.html = this.getHtmlForWebview();

		webviewView.webview.onDidReceiveMessage((message) => {
			this.handleWebviewMessage(message);
		});

		this.postData();
	}

	/**
	 * Updates the webview with current data
	 */
	private updateWebview(): void {
		this.postData();
	}

	/**
	 * Posts current data to the webview if it is available.
	 */
	private postData(): void {
		if (!this.view) return;

		this.view.webview.postMessage({
			type: "setData",
			data: this.data,
			filePath: this.currentFilePath,
		});
	}

	/**
	 * Handles messages from the webview
	 */
	private handleWebviewMessage(message: {
		type: string;
		data?: unknown;
	}): void {
		switch (message.type) {
			case "ready":
				this.postData();
				break;
			case "loadCsv": {
				const payload = message.data as { fileName?: string; content?: string };
				const content = payload?.content ?? "";
				const parsedData = parseCsvContent(content);

				if (parsedData.length > 0) {
					this.setData(parsedData, payload?.fileName ?? "CSV");
				} else {
					vscode.window.showErrorMessage(
						"No valid log entries found in the CSV file.",
					);
				}
				break;
			}
			case "openFile":
				vscode.commands.executeCommand("csvViewer.openFile");
				break;
			case "clear":
				this.data = [];
				this.updateWebview();
				break;
		}
	}

	/**
	 * Generates the HTML for the webview
	 */
	private getHtmlForWebview(): string {
		const stylesUri = this.view?.webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, "media", "styles.css"),
		);
		const scriptUri = this.view?.webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, "media", "script.js"),
		);

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>CSV Log Viewer</title>
	<link rel="stylesheet" href="${stylesUri}">
</head>
<body>
	<div id="app">
		<div class="empty-state" id="emptyState">
			<div class="upload-icon">
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
					<polyline points="17 8 12 3 7 8"></polyline>
					<line x1="12" y1="3" x2="12" y2="15"></line>
				</svg>
			</div>
			<h2>Upload your log file</h2>
			<p>Drag and drop your .csv file here, or click to browse</p>
			<div class="empty-actions">
				<label class="btn btn-primary" id="emptyUploadLabel">
					<input id="emptyFileInput" type="file" accept=".csv" style="display: none;" />
					Select CSV File
				</label>
				<button id="openFileBtn" class="btn btn-secondary">Open CSV File</button>
			</div>
		</div>
		<div class="content" id="content" style="display: none;">
			<div class="header">
				<h1 id="fileName">CSV Log Viewer</h1>
				<div class="search-bar">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
					<input type="text" id="searchInput" placeholder="Search logs by name, problem, solution, tags, files, tech-stack, cause">
				</div>
				<div class="actions">
					<button id="sortBtn" class="btn btn-secondary" title="Toggle sort order">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 5v14"></path>
							<path d="M19 12l-7 7-7-7"></path>
						</svg>
						<span id="sortLabel">Newest</span>
					</button>
					<label class="btn btn-secondary" id="uploadLabel" title="Upload CSV">
						<input id="uploadInput" type="file" accept=".csv" style="display: none;" />
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
							<polyline points="17 8 12 3 7 8"></polyline>
							<line x1="12" y1="3" x2="12" y2="15"></line>
						</svg>
						Upload
					</label>
					<button id="clearBtn" class="btn btn-secondary" title="Clear logs">
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="3 6 5 6 21 6"></polyline>
							<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
						</svg>
						Clear
					</button>
				</div>
			</div>
			<div class="stats" id="stats"></div>
			<div class="logs-container" id="logsContainer"></div>
		</div>
	</div>
	<script src="${scriptUri}"></script>
</body>
</html>`;
	}

	/**
	 * Disposes the provider
	 */
	public dispose(): void {
		this.view = undefined;
	}
}
