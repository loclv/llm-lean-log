---
id: 9b4a0098-1fca-43c9-87e4-985761e0ace6
title: "memory-leak-004"
tags: [Memory Leak in WebSocket Handler]
created-at: Added `removeAllListeners()` call in `websocket.disconnect()`
model: typescript, socket.io, node.js
---

# memory-leak-004

## Problem
bug,websocket,memory

## Solution
Server memory usage grows continuously when WebSocket connections are active

## Action
Fixed event listener cleanup in disconnect handler to prevent memory leaks

