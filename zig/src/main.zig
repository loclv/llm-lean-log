const std = @import("std");
const zig = @import("root.zig");
const commands = @import("commands.zig");

const VERSION = "0.2.14";

const helpTextForHuman =
    \\l-log CLI (Zig Version)
    \\
    \\Usage: l-log <command> [log-file] [options]
    \\
    \\Commands:
    \\  list, ls | List all log entries
    \\    --compact, -c | Show compact view
    \\    --human | Show human-readable output (with colors)
    \\  
    \\  stats | Show log statistics
    \\    --human | Show human-readable output (with colors)
    \\  
    \\  view <index> | View detailed entry at index
    \\    --last | Show the last log entry
    \\    --human | Show human-readable output (with colors)
    \\  
    \\  search <query> | Search logs by name, problem, or solution
    \\    --human | Show human-readable output (with colors)
    \\  
    \\  tags <tag1> [tag2] | Filter logs by tags
    \\    --human | Show human-readable output (with colors)
    \\  
    \\  add <name> | Add a new log entry
    \\    --tags=<tags> | Comma-separated tags, wrap with double quotes if multiple tags
    \\    --problem=<text> | Problem description
    \\    --solution=<text> | Solution description
    \\    --action=<text> | Action taken
    \\    --files=<files> | Comma-separated files paths, wrap with double quotes if multiple files
    \\    --tech-stack=<tech> | Comma-separated tech stack, wrap with double quotes if multiple tech stack
    \\    --model=<name> | Model name
    \\    --cause=<text> | Cause description
    \\    --causeIds=<ids> | Comma-separated cause log row UUIDs
    \\    --effectIds=<ids> | Comma-separated effect log row UUIDs
    \\    --last-commit-short-sha=<sha> | Last git commit short SHA
    \\    --created-at=<time> | Creation time (ISO 8601 formatted string)
    \\    --updated-at=<time> | Update time (ISO 8601 formatted string)
    \\    --created-by-agent=<name> | Agent model name
    \\    --diff | Save git diff file (default: true)
    \\    --no-diff | Skip saving git diff file
    \\  
    \\  help, -h, --help | Show this help message
    \\
    \\  -v, -V, --version | Show version number
;

pub fn main(init: std.process.Init) !void {
    const arena = init.arena.allocator();
    const args = try init.minimal.args.toSlice(arena);
    const io = init.io;

    var stdout_buffer: [4096]u8 = undefined;
    var stdout_file_writer: std.Io.File.Writer = .init(.stdout(), io, &stdout_buffer);
    const stdout = &stdout_file_writer.interface;
    defer stdout.flush() catch {};

    var stderr_buffer: [4096]u8 = undefined;
    var stderr_file_writer: std.Io.File.Writer = .init(.stderr(), io, &stderr_buffer);
    const stderr = &stderr_file_writer.interface;
    defer stderr.flush() catch {};

    if (args.len < 2) {
        try stdout.print("{s}\n", .{helpTextForHuman});
        return;
    }

    const command = args[1];

    if (std.mem.eql(u8, command, "help") or std.mem.eql(u8, command, "--help") or std.mem.eql(u8, command, "-h")) {
        try stdout.print("{s}\n", .{helpTextForHuman});
        return;
    }

    if (std.mem.eql(u8, command, "version") or std.mem.eql(u8, command, "--version") or std.mem.eql(u8, command, "-v") or std.mem.eql(u8, command, "-V")) {
        try stdout.print("{s}\n", .{VERSION});
        return;
    }

    var logFile: []const u8 = "./logs/chat.csv";
    var paramStart: usize = 2;

    if (args.len > 2 and std.mem.endsWith(u8, args[2], ".csv")) {
        logFile = args[2];
        paramStart = 3;
    }

    const cmdArgs = args[paramStart..];

    if (std.mem.eql(u8, command, "list") or std.mem.eql(u8, command, "ls")) {
        try commands.list(arena, io, cmdArgs, logFile, stdout, stderr);
    } else if (std.mem.eql(u8, command, "stats")) {
        try commands.stats(arena, io, cmdArgs, logFile, stdout, stderr);
    } else if (std.mem.eql(u8, command, "tags")) {
        try commands.tags(arena, io, cmdArgs, logFile, stdout, stderr);
    } else if (std.mem.eql(u8, command, "view")) {
        try commands.view(arena, io, cmdArgs, logFile, stdout, stderr);
    } else if (std.mem.eql(u8, command, "search")) {
        try commands.search(arena, io, cmdArgs, logFile, stdout, stderr);
    } else if (std.mem.eql(u8, command, "add")) {
        try commands.add(arena, io, cmdArgs, logFile, stdout, stderr);
    } else {
        try stderr.print("Error: Unknown command \"{s}\"\n{s}\n", .{ command, helpTextForHuman });
        try stderr.flush();
    }
}
