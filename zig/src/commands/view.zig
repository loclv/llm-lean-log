const std = @import("std");
const zig = @import("../root.zig");

const CLR_RESET = zig.CLR_RESET;
const CLR_BOLD = zig.CLR_BOLD;
const CLR_CYAN = zig.CLR_CYAN;
const CLR_GREEN = zig.CLR_GREEN;
const CLR_YELLOW = zig.CLR_YELLOW;
const CLR_GRAY = zig.CLR_GRAY;

pub fn view(arena: std.mem.Allocator, io: std.Io, args: []const []const u8, logFile: []const u8, stdout: *std.Io.Writer, stderr: *std.Io.Writer) !void {
    var last = false;
    var human = false;
    var index: ?usize = null;

    for (args) |arg| {
        if (std.mem.eql(u8, arg, "--last")) {
            last = true;
        } else if (std.mem.eql(u8, arg, "--human")) {
            human = true;
        } else if (std.fmt.parseInt(usize, arg, 10)) |idx| {
            index = idx;
        } else |_| {}
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

    if (entries.len == 0) {
        try stdout.print("No entries found.\n", .{});
        return;
    }

    const target_idx = if (last) entries.len - 1 else index orelse {
        try stderr.print("Error: Please provide an index or --last\n", .{});
        try stderr.flush();
        return;
    };

    if (target_idx >= entries.len) {
        try stderr.print("Error: Index {d} out of bounds (total entries: {d})\n", .{ target_idx, entries.len });
        try stderr.flush();
        return;
    }

    const entry = entries[target_idx];
    if (human) {
        try stdout.print(
            \\{s}--- Entry {d} ---{s}
            \\{s}ID:{s} {s}
            \\{s}Name:{s} {s}
            \\{s}Tags:{s} {s}
            \\{s}Problem:{s} {s}
            \\
        , .{
            CLR_BOLD, target_idx, CLR_RESET,
            CLR_CYAN, CLR_RESET, entry.id,
            CLR_GREEN, CLR_RESET, entry.name,
            CLR_YELLOW, CLR_RESET, entry.tags,
            CLR_BOLD, CLR_RESET, entry.problem,
        });
        if (entry.solution.len > 0) try stdout.print("{s}Solution:{s} {s}\n", .{ CLR_BOLD, CLR_RESET, entry.solution });
        if (entry.action.len > 0) try stdout.print("{s}Action:{s} {s}\n", .{ CLR_BOLD, CLR_RESET, entry.action });
        try stdout.print("{s}Created At:{s} {s}\n", .{ CLR_GRAY, CLR_RESET, entry.created_at });
    } else {
        try stdout.print(
            \\--- Entry {d} ---
            \\ID: {s}
            \\Name: {s}
            \\Tags: {s}
            \\Problem: {s}
            \\
        , .{ target_idx, entry.id, entry.name, entry.tags, entry.problem });
        if (entry.solution.len > 0) try stdout.print("Solution: {s}\n", .{entry.solution});
        if (entry.action.len > 0) try stdout.print("Action: {s}\n", .{entry.action});
        try stdout.print("Created At: {s}\n", .{entry.created_at});
    }
}
