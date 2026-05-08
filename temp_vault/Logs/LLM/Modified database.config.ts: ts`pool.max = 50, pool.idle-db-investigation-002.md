---
id: ecf1988c-a4f4-4ed9-bba9-8fd27b3c67ce
title: "db-investigation-002"
tags: [Database Connection Pool Exhausted]
created-at: Modified database.config.ts: ts`pool.max = 50, pool.idle
model: typescript, postgresql, node.js
---

# db-investigation-002

## Problem
error,database,performance

## Solution
Application crashes during high traffic due to database connection pool being exhausted

## Action
Increased pool size from 10 to 50 and added connection timeout handling

