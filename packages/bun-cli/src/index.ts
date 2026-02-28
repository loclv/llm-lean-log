#!/usr/bin/env bun

/**
 * CLI tool for llm-lean-log
 */

import { argv } from "bun";
import { main } from "./utils/cli";
import { VERSION } from "./utils/const";

if (import.meta.main) {
	main(VERSION, argv.slice(2)).catch((error) => {
		console.error("Error:", error.message);
		process.exit(1);
	});
}
