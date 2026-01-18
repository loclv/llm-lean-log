#!/usr/bin/env bun

/**
 * CLI tool for llm-lean-log
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { main } from "./utils/cli";

// use node.js modules for better compatibility
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
	readFileSync(join(__dirname, "../package.json"), "utf8"),
);

if (import.meta.main) {
	main(pkg.version).catch((error) => {
		console.error("Error:", error.message);
		process.exit(1);
	});
}
