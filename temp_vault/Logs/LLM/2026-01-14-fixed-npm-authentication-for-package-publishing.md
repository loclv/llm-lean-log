---
id: fd3d23e7-d0f8-4346-bca1-3d711821c2ad
title: "Fixed npm authentication for package publishing"
tags: [npm, authentication, publishing]
tech-stack: [bun, npm]
created-at: 2026-01-14
model: Cascade
---

# Fixed npm authentication for package publishing

## Problem
Missing authentication error when running bun publish

## Solution
Created .npmrc files in packages/cli, packages/core, and packages/visualizer with proper NPM_TOKEN environment variable reference

## Files Involved
- packages/cli/.npmrc
- packages/core/.npmrc
- packages/visualizer/.npmrc
- .github/workflows/release.yml

