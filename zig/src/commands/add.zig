const std = @import("std");
const zig = @import("../root.zig");

pub fn add(arena: std.mem.Allocator, io: std.Io, args: []const []const u8, logFile: []const u8, stdout: *std.Io.Writer, stderr: *std.Io.Writer) !void {
    var name: ?[]const u8 = null;
    if (args.len > 0) {
        name = args[0];
    }

    if (name == null) {
        try stderr.print("Error: Please provide a log name\n", .{});
        try stderr.flush();
        return;
    }

    var entry = zig.LogEntry{
        .id = try zig.generateUuid(arena, io),
        .name = name.?,
        .tags = "",
        .problem = "",
        .solution = "",
        .action = "",
        .files = "",
        .tech_stack = "",
        .cause = "",
        .causeIds = "",
        .effectIds = "",
        .last_commit_short_sha = "",
        .created_at = "",
        .updated_at = "",
        .model = "",
        .created_by_agent = "ZigAgent",
    };

    for (args) |arg| {
        if (std.mem.startsWith(u8, arg, "--tags=")) {
            entry.tags = arg["--tags=".len..];
        } else if (std.mem.startsWith(u8, arg, "--problem=")) {
            entry.problem = arg["--problem=".len..];
        } else if (std.mem.startsWith(u8, arg, "--solution=")) {
            entry.solution = arg["--solution=".len..];
        } else if (std.mem.startsWith(u8, arg, "--action=")) {
            entry.action = arg["--action=".len..];
        } else if (std.mem.startsWith(u8, arg, "--files=")) {
            entry.files = arg["--files=".len..];
        } else if (std.mem.startsWith(u8, arg, "--tech-stack=")) {
            entry.tech_stack = arg["--tech-stack=".len..];
        } else if (std.mem.startsWith(u8, arg, "--model=")) {
            entry.model = arg["--model=".len..];
        } else if (std.mem.startsWith(u8, arg, "--cause=")) {
            entry.cause = arg["--cause=".len..];
        } else if (std.mem.startsWith(u8, arg, "--causeIds=")) {
            entry.causeIds = arg["--causeIds=".len..];
        } else if (std.mem.startsWith(u8, arg, "--effectIds=")) {
            entry.effectIds = arg["--effectIds=".len..];
        } else if (std.mem.startsWith(u8, arg, "--last-commit-short-sha=")) {
            entry.last_commit_short_sha = arg["--last-commit-short-sha=".len..];
        } else if (std.mem.startsWith(u8, arg, "--created-at=")) {
            entry.created_at = arg["--created-at=".len..];
        } else if (std.mem.startsWith(u8, arg, "--updated-at=")) {
            entry.updated_at = arg["--updated-at=".len..];
        } else if (std.mem.eql(u8, arg, "--diff")) {
            // Save git diff (placeholder for future implementation)
        } else if (std.mem.eql(u8, arg, "--no-diff")) {
            // Skip saving git diff
        } else if (std.mem.startsWith(u8, arg, "--created-by-agent=")) {
            entry.created_by_agent = arg["--created-by-agent=".len..];
        }
    }

    if (entry.problem.len == 0) {
        try stderr.print("Error: Please provide a problem description with --problem=<text>\n", .{});
        try stderr.flush();
        return;
    }

    if (entry.created_at.len == 0) {
        const now_ts = std.Io.Timestamp.now(io, .real).toSeconds();
        entry.created_at = try zig.parseIso8601(arena, now_ts);
    }
    if (entry.updated_at.len == 0) {
        entry.updated_at = entry.created_at;
    }

    const cwd = std.Io.Dir.cwd();
    const file = cwd.openFile(io, logFile, .{ .mode = .read_write }) catch |err| blk: {
        if (err == error.FileNotFound) {
            const f = try cwd.createFile(io, logFile, .{});
            var header_buffer: [256]u8 = undefined;
            var w = f.writer(io, &header_buffer);
            try w.interface.print("id,name,tags,problem,solution,action,files,tech-stack,cause,causeIds,effectIds,last-commit-short-sha,created-at,updated-at,model,created-by-agent\n", .{});
            try w.flush();
            break :blk f;
        }
        return err;
    };
    defer file.close(io);

    const st = try file.stat(io);
    var write_buffer: [4096]u8 = undefined;
    var w = file.writer(io, &write_buffer);
    try w.seekTo(st.size);
    try entry.formatCsv(&w.interface);
    try w.flush();

    try stdout.print("Log entry added successfully to {s}\n", .{logFile});
}
