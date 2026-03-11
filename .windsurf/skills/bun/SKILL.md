# Bun - JS runtime

## File API

```ts
const foo = Bun.file("foo.txt");

await foo.text(); // contents as a string
await foo.json(); // contents as a JSON object
await foo.stream(); // contents as ReadableStream
await foo.arrayBuffer(); // contents as ArrayBuffer
await foo.bytes(); // contents as Uint8Array
```
