---
id: 721ace2b-5e73-4901-bef9-97de16bf170f
title: "Add GitHub CLI workflow trigger support"
tags: [github, workflow, automation, cli]
tech-stack: [github-actions, yaml]
created-at: 2026-01-14
model: cascade
---

# Add GitHub CLI workflow trigger support

## Problem
Release workflow could only be triggered by git tag pushes

## Solution
Added workflow_dispatch trigger with version input and optional tag creation

## Action
Updated .github/workflows/release.yml to support manual triggering via gh command

## Files Involved
- .github/workflows/release.yml

