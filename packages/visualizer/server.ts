import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Get project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../..");

/**
 * Simple API server to serve log files and diff content
 */
const server = Bun.serve({
	port: 5174,
	async fetch(req) {
		const url = new URL(req.url);
		const path = url.pathname;

		// CORS headers
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		};

		// Handle preflight requests
		if (req.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// Serve logs CSV file
			if (path === "/api/logs") {
				const logFile = Bun.file(join(projectRoot, "./logs/chat.csv"));
				if (await logFile.exists()) {
					return new Response(logFile, {
						headers: {
							"Content-Type": "text/csv",
							...corsHeaders,
						},
					});
				}
				return new Response("Logs file not found", {
					status: 404,
					headers: corsHeaders,
				});
			}

			// Serve diff file by UUID
			if (path.startsWith("/api/diff/")) {
				const logId = path.replace("/api/diff/", "");
				const diffPath = join(projectRoot, "./logs/diff", `${logId}.diff`);

				try {
					const diffFile = Bun.file(diffPath);
					if (await diffFile.exists()) {
						return new Response(diffFile, {
							headers: {
								"Content-Type": "text/plain",
								...corsHeaders,
							},
						});
					}
					return new Response("Diff file not found", {
						status: 404,
						headers: corsHeaders,
					});
				} catch (error) {
					console.error("Error reading diff file:", error);
					return new Response("Error reading diff file", {
						status: 500,
						headers: corsHeaders,
					});
				}
			}

			// List available diff files
			if (path === "/api/diffs") {
				try {
					const diffDir = join(projectRoot, "./logs/diff");
					const files = await readdir(diffDir);
					const diffFiles = files
						.filter((file) => file.endsWith(".diff"))
						.map((file) => file.replace(".diff", ""));

					return new Response(JSON.stringify(diffFiles), {
						headers: {
							"Content-Type": "application/json",
							...corsHeaders,
						},
					});
				} catch (error) {
					console.error("Error reading diff directory:", error);
					return new Response("Error reading diff directory", {
						status: 500,
						headers: corsHeaders,
					});
				}
			}

			// Health check
			if (path === "/api/health") {
				return new Response(JSON.stringify({ status: "ok" }), {
					headers: {
						"Content-Type": "application/json",
						...corsHeaders,
					},
				});
			}

			// 404 for other paths
			return new Response("Not found", {
				status: 404,
				headers: corsHeaders,
			});
		} catch (error) {
			console.error("Server error:", error);
			return new Response("Internal server error", {
				status: 500,
				headers: corsHeaders,
			});
		}
	},
});

console.log(`🚀 API Server running on http://localhost:${server.port}`);
console.log(`📁 Serving logs from: ${projectRoot}/logs`);
