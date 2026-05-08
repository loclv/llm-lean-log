---
id: 330ca701-8b66-4f3a-adf9-0bb12605a25d
title: "Improve release workflow with CHANGELOG.md integration"
tags: [release, workflow, automation, changelog]
tech-stack: [github-actions, markdown, monorepo]
created-at: 2026-01-22
model: SWE-1.5
created-by-agent: Cascade
---

# Improve release workflow with CHANGELOG.md integration

## Problem
Release workflow only used git commit messages for changelog

## Solution
Enhanced .github/workflows/release.yml to parse CHANGELOG.md for version-specific content, updated docs/release.md with new process, and fixed package dependencies

## Files Involved
- .github/workflows/release.yml
- docs/release.md
- packages/cli/package.json
