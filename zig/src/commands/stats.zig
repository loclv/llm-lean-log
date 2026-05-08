const std = @import("std");
const zig = @import("../root.zig");

const CLR_RESET = zig.CLR_RESET;
const CLR_CYAN = zig.CLR_CYAN;

pub fn stats(arena: std.mem.Allocator, io: std.Io, args: []const []const u8, logFile: []const u8, stdout: *std.Io.Writer, stderr: *std.Io.Writer) !void {
    var human = false;
    for (args) |arg| {
        if (std.mem.eql(u8, arg, "--human")) {
            human = true;
        }
    }

    const cwd = std.Io.Dir.cwd();
    const file = cwd.openFile(io, logFile, .{ .mode = .read_only }) catch |err| {
        if (err == error.FileNotFound) {
            try stderr.print("Error: Log file not found at {s}\n", .{logFile});
            try stderr.flush();
            return;
        }
        return err;
    };
    defer file.close(io);

    var read_buffer: [4096]u8 = undefined;
    var r = file.reader(io, &read_buffer);
    const content = try r.interface.allocRemaining(arena, .unlimited);

    const parser = zig.CsvParser{ .allocator = arena };
    const entries = try parser.parse(content);

    try stdout.print(
        \\Log Statistics for {s}:
        \\Total entries: {d}
        \\
    , .{ logFile, entries.len });

    var tags_map = std.StringArrayHashMapUnmanaged(usize).empty;
    for (entries) |entry| {
        var it = std.mem.splitAny(u8, entry.tags, ", ");
        while (it.next()) |tag| {
            if (tag.len == 0) continue;
            const gop = try tags_map.getOrPut(arena, tag);
            if (!gop.found_existing) {
                gop.value_ptr.* = 1;
            } else {
                gop.value_ptr.* += 1;
            }
        }
    }

    try stdout.print("\nTop Tags:\n", .{});
    var it = tags_map.iterator();
    while (it.next()) |entry| {
        if (human) {
            try stdout.print("  {s}{s}{s}: {d}\n", .{ CLR_CYAN, entry.key_ptr.*, CLR_RESET, entry.value_ptr.* });
        } else {
            try stdout.print("  {s}: {d}\n", .{ entry.key_ptr.*, entry.value_ptr.* });
        }
    }
}
