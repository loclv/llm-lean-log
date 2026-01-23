import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/**
 * Get the short SHA of the last git commit.
 * Returns undefined if not in a git repository or if git command fails.
 */
export async function getLastCommitShortSha(): Promise<string | undefined> {
	return new Promise((resolve) => {
		const git = spawn("git", ["rev-parse", "--short", "HEAD"]);

		let stdout = "";
		let stderr = "";

		git.stdout.on("data", (data) => {
			stdout += data.toString();
		});

		git.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		git.on("close", (code) => {
			if (code === 0 && stdout.trim()) {
				resolve(stdout.trim());
			} else {
				// Not in a git repository or git command failed
				if (stderr) {
					console.error(`[git] error: ${stderr}`);
				}
				resolve(undefined);
			}
		});

		git.on("error", () => {
			// Git is not installed or not accessible
			resolve(undefined);
		});
	});
}

/**
 * Generate git diff excluding lock files and save to specified file.
 * When folder of path is not exist, auto create folder.
 * @param outputPath - Path where the diff file will be saved
 * @returns Promise resolving to boolean indicating success
 */
export async function saveGitDiffExcludeLockFiles(
	outputPath: string,
): Promise<boolean> {
	return new Promise((resolve) => {
		// git diff command excluding lock files
		const git = spawn("git", [
			"diff",
			"--",
			".",
			":(exclude)*.lock",
			":(exclude)yarn.lock",
			":(exclude)package-lock.json",
		]);

		let stdout = "";
		let stderr = "";

		git.stdout.on("data", (data) => {
			stdout += data.toString();
		});

		git.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		git.on("close", async (code) => {
			if (code === 0) {
				try {
					// Ensure directory exists before writing file
					const dir = dirname(outputPath);
					await mkdir(dir, { recursive: true });
					await writeFile(outputPath, stdout, "utf8");
					resolve(true);
				} catch (error) {
					console.error("Error writing diff file:", error);
					resolve(false);
				}
			} else {
				// Git diff failed (might be no changes or not in git repo)
				if (stderr && !stderr.includes("working tree clean")) {
					console.error(`[git] diff error: ${stderr}`);
				}
				// else no changes or not in git repo
				// check if in git repo
				const gitRepo = await getLastCommitShortSha();
				if (!gitRepo) {
					console.error("[git] diff error: Not in a git repository");
					resolve(false);
				}
				// else no changes

				resolve(false);
				// No need to catch error, getLastCommitShortSha already handles it.
			}
		});

		git.on("error", () => {
			// Git is not installed or not accessible
			console.error("[git] diff error: Git is not installed or not accessible");
			resolve(false);
		});
	});
}
