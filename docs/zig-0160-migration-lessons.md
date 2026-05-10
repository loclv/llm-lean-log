# Zig 0.16.0 Migration Lessons

## Overview
Migrating release scripts from modern Zig to Zig 0.16.0 presents significant API compatibility challenges. This document captures the lessons learned during the migration process.

## Key API Differences

### File System Operations
- Modern Zig: `std.fs.cwd().openFile()`, `std.fs.File.openRead()`, `std.fs.File.openWrite()`
- Zig 0.16.0: `std.Io.Dir.cwd()`, `cwd.openFile(io, path, options)`, `cwd.createFile(io, path, options)`

### Process Management
- Modern Zig: `std.process.Child.run()`
- Zig 0.16.0: `process.run(allocator, io, options)` or `process.Child.run()`

### I/O Initialization
- Modern Zig: `std.heap.c_allocator` or `std.heap.page_allocator`
- Zig 0.16.0: `std.Io.Threaded.init(allocator, options)` with `io_state.io()`

### JSON Operations
- Modern Zig: `std.json.parseFromSlice()`, `root.put()` with 3 parameters
- Zig 0.16.0: Different JSON API structure, requires string manipulation

## Common Migration Patterns

### 1. Function Signature Changes
Most functions need to accept an additional `io: std.Io` parameter:
```zig
// Before
fn myFunction(allocator: std.mem.Allocator) !void

// After
fn myFunction(io: std.Io, allocator: std.mem.Allocator) !void
```

### 2. File Operation Pattern
```zig
// Modern approach
const file = try std.fs.File.openRead("path.txt");

// Zig 0.16.0 approach
const cwd = std.Io.Dir.cwd();
const file = cwd.openFile(io, "path.txt", .{ .mode = .read_only });
```

### 3. Command Execution Pattern
```zig
// Modern approach
const result = try std.process.Child.run(.{ .argv = args });

// Zig 0.16.0 approach  
const result = try process.run(allocator, io, .{ .argv = args });
```

### 4. Error Handling Pattern
```zig
// File operations need io parameter
defer file.close(io);

// Command result access pattern changes
if (result.term != 0) {  // vs result.term.Exited != 0
```

## Migration Strategy

### Step 1: Identify API Differences
Use `zigdoc` or examine working code to understand API differences between versions.

### Step 2: Update Function Signatures
Add `io: std.Io` parameter to all functions that perform I/O operations.

### Step 3: Update File Operations
Replace file system calls with Zig 0.16.0 patterns:
- `std.fs.cwd()` → `std.Io.Dir.cwd()`
- File operations require `io` parameter

### Step 4: Update Process Operations
Replace process management with appropriate API for the target version.

### Step 5: Update Error Handling
Adapt to the correct error handling patterns for the target version.

### Step 6: Test Incrementally
Test each function individually before proceeding to the next.

## Recommendations

### For Future Migrations
1. Maintain Compatibility Matrix: Keep a reference table of API differences between Zig versions
2. Use Feature Detection: Add version detection logic to handle multiple Zig versions
3. Modular Design: Separate version-specific code into different modules
4. Comprehensive Testing: Test against multiple Zig versions before release

### Tools and Commands
```bash
# Check API availability
zigdoc std.fs
zigdoc std.process

# Build with specific Zig version
zig build-exe script.zig -femit-bin=script

# Use working zig script as reference
cp /path/to/working/script.zig /path/to/target/script.zig
```

## Conclusion

The migration to Zig 0.16.0 requires careful attention to API changes and systematic testing. The key is understanding that many modern conveniences don't exist in older versions, requiring more explicit I/O handling and different error patterns.
