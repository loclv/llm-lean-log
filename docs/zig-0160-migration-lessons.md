# Zig 0.16.0 Migration Lessons

This document records the lessons learned while migrating release scripts to Zig 0.16.0.

## File I/O (std.Io)

### EndOfStream error with readStreaming
When using `file.readStreaming(io, &[_][]u8{buffer})`, if the buffer size is larger than the file content, the operation may throw `error.EndOfStream`.

Solution:
Use `file.stat(io)` to get the exact file size before reading.

```zig
fn readFileContents(io: std.Io, allocator: std.mem.Allocator, path: []const u8) ![]u8 {
    const cwd = std.Io.Dir.cwd();
    const file = try cwd.openFile(io, path, .{ .mode = .read_only });
    defer file.close(io);

    const stat = try file.stat(io);
    const contents = try allocator.alloc(u8, stat.size);
    errdefer allocator.free(contents);

    _ = try file.readStreaming(io, &[_][]u8{contents});
    return contents;
}
```

### Writing with writerStreaming
For writing, `writerStreaming` works well with a small fixed-size buffer for chunked writing.

```zig
var write_buffer: [4096]u8 = undefined;
var writer = file.writerStreaming(io, &write_buffer);
try writer.interface.writeAll(new_contents);
```

## Process Execution (std.process)

### PATH Resolution
`std.process.run` and `std.process.spawn` in Zig 0.16.0 do not seem to search the `PATH` by default in all environments, leading to `error.FileNotFound`.

Workaround:
Use absolute paths for executables or ensure the environment is correctly passed. Wrapping with `/usr/bin/env` might also help if the environment's `PATH` is correctly set.

### Environment Inheritance and PATH
To ensure child processes correctly inherit the environment (including `PATH`), use `main(init: std.process.Init)` and pass `init.environ_map` to `std.process.run`.

```zig
pub fn main(init: std.process.Init) !void {
    const allocator = init.gpa;
    const io = init.io;
    const environ_map = init.environ_map;

    const result = try std.process.run(allocator, io, .{
        .argv = &[_][]const u8{ "bun", "--version" },
        .environ_map = environ_map,
    });
}
```

### Writing Files with Dir.writeFile
For simple file writing, `std.Io.Dir.writeFile` is the safest and cleanest API as it handles file creation, truncation, and streaming internally.

```zig
const cwd = std.Io.Dir.cwd();
try cwd.writeFile(io, .{ .sub_path = "package.json", .data = new_contents });
```

## General
- `std.Io.Threaded` is commonly used for standalone CLI tools to provide a synchronous-like API on top of the new I/O system.
- `std.Io.Dir.cwd()` returns the current working directory as an `Io.Dir` object.
## Error Handling (try vs catch)

### Redundant try with catch blocks
In Zig 0.16.0, using `try` on an expression that already handles the error union via `catch` (and returns or provides a value) is a compilation error: `expected error union type, found '[]const u8'` (or whatever the success type is).

This happens because `catch` has higher precedence than `try`. The expression `X catch Y` evaluates to the success type of `X`. Applying `try` to this non-error-union result is illegal.
Incorrect:
```zig
const val = try functionReturningErrorUnion() catch |err| {
    std.log.err("Error: {any}", .{err});
    return err;
};
```

Correct:
```zig
const val = functionReturningErrorUnion() catch |err| {
    std.log.err("Error: {any}", .{err});
    return err;
};
```
If you want to log and then re-throw the error, use `catch |err| { ... return err; }` without the leading `try`.
