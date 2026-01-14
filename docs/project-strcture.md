# Project Structure Overview

This is a monorepo project with three main packages: a core library, a CLI interface, and a visualizer application.

1. /packages/cli/src
   - Contains a CLI application with:
     - index.ts - Main entry point
     - index.test.ts - Tests for the CLI

2. /packages/core/src
   - Core functionality with several modules:
     - index.ts - Main entry point
     - indexer.ts - Indexing functionality
     - logger.ts and logger.test.ts - Logging utilities
     - csv-utils.ts and csv-utils.test.ts - CSV processing
     - graph-utils.ts and graph-utils.test.ts - Graph utilities
     - visualizer.ts and visualizer.test.ts - Visualization logic
     - types.ts - Type definitions

3. /packages/visualizer/src
   - A React-based visualization application with:
     - App.tsx - Main application component
     - main.tsx - Entry point
     - index.css - Styles
     - types.ts - Type definitions
     - utils.ts - Utility functions
     - cli.ts - CLI-related functionality
     - /components directory with:
       - CodeBlock.tsx - Code display component
       - LogCard.tsx - Log display component
     - /assets directory (contents not shown)
