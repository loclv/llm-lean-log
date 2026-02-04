/**
 * Main extension entry point for CSV Log Viewer
 */
import * as vscode from "vscode";
import { CsvViewerWebviewProvider } from "./CsvViewerWebviewProvider";
import { parseCsvContent } from "./utils";

let csvViewerProvider: CsvViewerWebviewProvider | undefined;

/**
 * Activates the extension
 */
export function activate(context: vscode.ExtensionContext): void {
	const provider = new CsvViewerWebviewProvider(context.extensionUri);
	csvViewerProvider = provider;

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			CsvViewerWebviewProvider.viewType,
			provider,
		),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("csvViewer.openFile", async () => {
			const uri = await vscode.window.showOpenDialog({
				canSelectMany: false,
				filters: { "CSV Files": ["csv"] },
				openLabel: "Open CSV File",
			});

			if (uri?.[0]) {
				try {
					const document = await vscode.workspace.openTextDocument(uri[0]);
					const content = document.getText();
					const parsedData = parseCsvContent(content);

					if (parsedData.length > 0) {
						provider.setData(parsedData, uri[0].fsPath);
						provider.show();
					} else {
						vscode.window.showErrorMessage(
							"No valid log entries found in the CSV file.",
						);
					}
				} catch (error) {
					vscode.window.showErrorMessage(
						`Failed to open CSV file: ${error instanceof Error ? error.message : "Unknown error"}`,
					);
				}
			}
		}),
	);

	vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor) {
			const document = editor.document;
			if (document.fileName.endsWith(".csv")) {
				const content = document.getText();
				const parsedData = parseCsvContent(content);

				if (parsedData.length > 0) {
					provider.setData(parsedData, document.fileName);
				}
			}
		}
	});
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
	csvViewerProvider?.dispose();
}
