# Bun - JS runtime

## File API

```ts
const foo = Bun.file("foo.txt");

if (await foo.exists()) {
  console.log("foo.txt exists");
}

await foo.text(); // contents as a string
await foo.json(); // contents as a JSON object
```
