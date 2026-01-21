import { spawn } from "node:child_process";

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
