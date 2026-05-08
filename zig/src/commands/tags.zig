const std = @import("std");
const zig = @import("../root.zig");

const CLR_RESET = zig.CLR_RESET;
const CLR_CYAN = zig.CLR_CYAN;
const CLR_GREEN = zig.CLR_GREEN;
const CLR_YELLOW = zig.CLR_YELLOW;
const CLR_GRAY = zig.CLR_GRAY;

pub fn tags(arena: std.mem.Allocator, io: std.Io, args: []const []const u8, logFile: []const u8, stdout: *std.Io.Writer, stderr: *std.Io.Writer) !void {
    var human = false;
    var filter_tags = std.ArrayList([]const u8).empty;
    defer filter_tags.deinit(arena);

    for (args) |arg| {
        if (std.mem.eql(u8, arg, "--human")) {
            human = true;
        } else {
            try filter_tags.append(arena, arg);
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

    if (filter_tags.items.len == 0) {
        var tags_map = std.StringArrayHashMapUnmanaged(void).empty;
        for (entries) |entry| {
            var it = std.mem.splitAny(u8, entry.tags, ", ");
            while (it.next()) |tag| {
                if (tag.len == 0) continue;
                try tags_map.put(arena, tag, {});
            }
        }

        try stdout.print("Unique Tags:\n", .{});
        var it = tags_map.iterator();
        while (it.next()) |entry| {
            if (human) {
                try stdout.print("  {s}{s}{s}\n", .{ CLR_CYAN, entry.key_ptr.*, CLR_RESET });
            } else {
                try stdout.print("  {s}\n", .{entry.key_ptr.*});
            }
        }
    } else {
        try stdout.print("Logs with tags: ", .{});
        for (filter_tags.items, 0..) |tag, i| {
            if (i > 0) try stdout.print(", ", .{});
            try stdout.print("{s}", .{tag});
        }
        try stdout.print("\n\n", .{});

        var count: usize = 0;
        for (entries) |entry| {
            var found_all = true;
            for (filter_tags.items) |ft| {
                var it = std.mem.splitAny(u8, entry.tags, ", ");
                var found_this = false;
                while (it.next()) |tag| {
                    if (std.mem.eql(u8, tag, ft)) {
                        found_this = true;
                        break;
                    }
                }
                if (!found_this) {
                    found_all = false;
                    break;
                }
            }

            if (found_all) {
                if (human) {
                    try stdout.print("[{s}{s}{s}] {s}{s}{s} | {s}{s}{s}\n", .{ CLR_GRAY, entry.created_at, CLR_RESET, CLR_GREEN, entry.name, CLR_RESET, CLR_YELLOW, entry.tags, CLR_RESET });
                } else {
                    try stdout.print("[{s}] {s} | {s}\n", .{ entry.created_at, entry.name, entry.tags });
                }
                count += 1;
            }
        }
        try stdout.print("\nFound {d} results.\n", .{count});
    }
}
