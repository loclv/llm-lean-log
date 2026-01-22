#!/usr/bin/env bun

/**
 * CLI tool for llm-lean-log
 */

import { main } from "./utils/cli";
import { VERSION } from "./utils/const";

if (import.meta.main) {
	main(VERSION).catch((error) => {
		console.error("Error:", error.message);
		process.exit(1);
	});
}
