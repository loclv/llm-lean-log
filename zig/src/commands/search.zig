const std = @import("std");
const zig = @import("../root.zig");

const CLR_RESET = zig.CLR_RESET;
const CLR_CYAN = zig.CLR_CYAN;
const CLR_GREEN = zig.CLR_GREEN;
const CLR_YELLOW = zig.CLR_YELLOW;
const CLR_GRAY = zig.CLR_GRAY;

pub fn search(arena: std.mem.Allocator, io: std.Io, args: []const []const u8, logFile: []const u8, stdout: *std.Io.Writer, stderr: *std.Io.Writer) !void {
    var human = false;
    var query: ?[]const u8 = null;

    for (args) |arg| {
        if (std.mem.eql(u8, arg, "--human")) {
            human = true;
        } else if (query == null) {
            query = arg;
        }
    }

    if (query == null) {
        try stderr.print("Error: Please provide a search query\n", .{});
        try stderr.flush();
        return;
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

    try stdout.print("Search results for \"{s}\" in {s}:\n\n", .{ query.?, logFile });

    var found: usize = 0;
    for (entries) |entry| {
        if (zig.indexOfIgnoreCase(entry.name, query.?) != null or
            zig.indexOfIgnoreCase(entry.problem, query.?) != null or
            zig.indexOfIgnoreCase(entry.tags, query.?) != null)
        {
            if (human) {
                try stdout.print("[{s}{s}{s}] {s}{s}{s} | {s}{s}{s}\n", .{ CLR_GRAY, entry.created_at, CLR_RESET, CLR_GREEN, entry.name, CLR_RESET, CLR_YELLOW, entry.tags, CLR_RESET });
            } else {
                try stdout.print("[{s}] {s} | {s}\n", .{ entry.created_at, entry.name, entry.tags });
            }
            found += 1;
        }
    }
    try stdout.print("\nFound {d} results.\n", .{found});
}
