#!/usr/bin/env bun
import { join, resolve } from "node:path";

const PORT = process.env.PORT || 5174;
const distPath = resolve(import.meta.dirname, "..", "dist");
const csvPath = process.argv[2];

if (csvPath) {
	const isExists = await Bun.file(csvPath).exists();

	if (!isExists) {
		console.error(`File not found: ${csvPath}`);
		process.exit(1);
	}
}

/**
 * Serves the llml-vis.
 */
const server = Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url);

		// API to get the CSV content
		if (url.pathname === "/api/logs") {
			if (csvPath) {
				const content = await Bun.file(csvPath).text();
				return new Response(content, {
					headers: { "Content-Type": "text/csv" },
				});
			}
			return new Response("", { status: 404 });
		}

		// Static file serving
		let path = url.pathname;
		if (path === "/") path = "/index.html";

		const filePath = join(distPath, path);
		const file = Bun.file(filePath);

		if (await file.exists()) {
			return new Response(file as unknown as BodyInit);
		}

		// Fallback to index.html for SPA routing
		return new Response(
			Bun.file(join(distPath, "index.html")) as unknown as BodyInit,
		);
	},
});

console.log(`\n🌈 llml-vis running at: http://localhost:${server.port}`);
if (csvPath) {
	console.log(`📊 Visualizing: ${csvPath}`);
}

// Open browser
const openCmd =
	process.platform === "win32"
		? "start"
		: process.platform === "darwin"
			? "open"
			: "xdg-open";

// run:
// ```bash
// bun run src/cli ../../logs/example.csv
// ```
// to open browser
Bun.spawn([openCmd, `http://localhost:${server.port}`]);
