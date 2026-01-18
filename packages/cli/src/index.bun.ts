#!/usr/bin/env bun

/**
 * CLI tool for llm-lean-log
 */

import pkg from "../package.json" assert { type: "json" };
import { main } from "./utils/cli";

if (import.meta.main) {
	main(pkg.version).catch((error) => {
		console.error("Error:", error.message);
		process.exit(1);
	});
}
