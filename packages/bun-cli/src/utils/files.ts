import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const getLogFolderPathFromLogFilePath = (logFile: string): string => {
	return dirname(logFile);
};

export const mkdirIfNotExists = (path: string): void => {
	try {
		if (!existsSync(path)) {
			mkdirSync(path, { recursive: true });
		}
	} catch (error) {
		console.error(
			`Failed to create directory: ${error instanceof Error ? error.message : String(error)}`,
		);
		throw error;
	}
};
