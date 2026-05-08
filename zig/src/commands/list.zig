const std = @import("std");
const zig = @import("../root.zig");

const CLR_RESET = zig.CLR_RESET;
const CLR_BOLD = zig.CLR_BOLD;
const CLR_CYAN = zig.CLR_CYAN;
const CLR_GREEN = zig.CLR_GREEN;
const CLR_YELLOW = zig.CLR_YELLOW;
const CLR_GRAY = zig.CLR_GRAY;

pub fn list(arena: std.mem.Allocator, io: std.Io, args: []const []const u8, logFile: []const u8, stdout: *std.Io.Writer, stderr: *std.Io.Writer) !void {
    var compact = false;
    var human = false;
    for (args) |arg| {
        if (std.mem.eql(u8, arg, "--compact") or std.mem.eql(u8, arg, "-c")) {
            compact = true;
        } else if (std.mem.eql(u8, arg, "--human")) {
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

    try stdout.print("Total entries: {d}\n\n", .{entries.len});

    for (entries, 0..) |entry, i| {
        if (compact) {
            if (human) {
                try stdout.print("[{s}{d}{s}] {s}{s}{s} | {s}{s}{s} | {s}{s}{s}\n", .{ CLR_GRAY, i, CLR_RESET, CLR_GRAY, entry.created_at, CLR_RESET, CLR_GREEN, entry.name, CLR_RESET, CLR_YELLOW, entry.tags, CLR_RESET });
            } else {
                try stdout.print("[{d}] {s} | {s} | {s}\n", .{ i, entry.created_at, entry.name, entry.tags });
            }
        } else {
            if (human) {
                try stdout.print(
                    \\{s}--- Entry {d} ---{s}
                    \\{s}ID:{s} {s}
                    \\{s}Name:{s} {s}
                    \\{s}Tags:{s} {s}
                    \\{s}Problem:{s} {s}
                    \\
                , .{
                    CLR_BOLD, i, CLR_RESET,
                    CLR_CYAN, CLR_RESET, entry.id,
                    CLR_GREEN, CLR_RESET, entry.name,
                    CLR_YELLOW, CLR_RESET, entry.tags,
                    CLR_BOLD, CLR_RESET, entry.problem,
                });
                if (entry.solution.len > 0) try stdout.print("{s}Solution:{s} {s}\n", .{ CLR_BOLD, CLR_RESET, entry.solution });
                if (entry.action.len > 0) try stdout.print("{s}Action:{s} {s}\n", .{ CLR_BOLD, CLR_RESET, entry.action });
                try stdout.print("{s}Created At:{s} {s}\n\n", .{ CLR_GRAY, CLR_RESET, entry.created_at });
            } else {
                try stdout.print(
                    \\--- Entry {d} ---
                    \\ID: {s}
                    \\Name: {s}
                    \\Tags: {s}
                    \\Problem: {s}
                    \\
                , .{ i, entry.id, entry.name, entry.tags, entry.problem });
                if (entry.solution.len > 0) try stdout.print("Solution: {s}\n", .{entry.solution});
                if (entry.action.len > 0) try stdout.print("Action: {s}\n", .{entry.action});
                try stdout.print("Created At: {s}\n\n", .{entry.created_at});
            }
        }
    }
}
