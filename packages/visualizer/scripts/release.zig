//! script to release a new version of the package
//!
//! Run `zig run scripts/release.zig`
//!
//! Plus 0.0.1 to the version number in package.json
//! Commit and tag the new version
//! Push the new version to GitHub
//! Publish the new version to npm

const std = @import("std");
const json = std.json;
const process = std.process;

const Error = error{
    InvalidVersionFormat,
    VersionPatternNotFound,
    VersionFieldNotFound,
    CommandFailed,
    ChangelogVersionNotFound,
};

// 1MB = 1024 * 1024
const size_1mb = 1048576;

/// Parse version string and increment patch version
fn incrementVersion(allocator: std.mem.Allocator, version: []const u8) ![]const u8 {
    var iter = std.mem.splitScalar(u8, version, '.');
    const major_str = iter.next() orelse return error.InvalidVersionFormat;
    const minor_str = iter.next() orelse return error.InvalidVersionFormat;
    const patch_str = iter.next() orelse return error.InvalidVersionFormat;

    const major = try std.fmt.parseInt(u32, major_str, 10);
    const minor = try std.fmt.parseInt(u32, minor_str, 10);
    const patch = try std.fmt.parseInt(u32, patch_str, 10);

    const new_patch = patch + 1;

    return std.fmt.allocPrint(allocator, "{}.{}.{}", .{ major, minor, new_patch });
}

/// Execute a command and return output
fn execCommand(allocator: std.mem.Allocator, io: std.Io, args: []const []const u8) ![]const u8 {
    const result = try process.run(allocator, io, .{
        .argv = args,
        .stderr_limit = std.Io.Limit.limited(size_1mb),
        .stdout_limit = std.Io.Limit.limited(size_1mb),
    });

    defer allocator.free(result.stdout);
    defer allocator.free(result.stderr);

    if (result.term.exited != 0) {
        std.log.err("Command failed: {s}\nStderr: {s}", .{ args[0], result.stderr });
        return error.CommandFailed;
    }

    return allocator.dupe(u8, std.mem.trim(u8, result.stdout, "\n"));
}

/// Check if CHANGELOG.md contains the new version
fn checkChangelog(io: std.Io, allocator: std.mem.Allocator, version: []const u8) !void {
    const cwd = std.Io.Dir.cwd();
    const file = cwd.openFile(io, "CHANGELOG.md", .{ .mode = .read_only }) catch |err| switch (err) {
        error.FileNotFound => {
            std.log.err("CHANGELOG.md not found", .{});
            return error.FileNotFound;
        },
        else => return err,
    };
    defer file.close(io);

    // Read file using streaming approach
    var buffer: [size_1mb]u8 = undefined;
    const bytes_read = try file.readStreaming(io, &[_][]u8{buffer[0..]});
    const contents = try allocator.alloc(u8, bytes_read);
    defer allocator.free(contents);
    @memmove(contents[0..bytes_read], buffer[0..bytes_read]);

    const version_pattern = try std.fmt.allocPrint(allocator, "## [{s}]", .{version});
    defer allocator.free(version_pattern);

    if (std.mem.indexOf(u8, contents, version_pattern) == null) {
        std.log.err("Version {s} not found in CHANGELOG.md. Please update it before releasing.", .{version});
        return error.ChangelogVersionNotFound;
    }

    std.log.info("Version {s} found in CHANGELOG.md", .{version});
}

/// Check if a command is available in the system
fn isCommandAvailable(allocator: std.mem.Allocator, command: []const u8) bool {
    // Create a basic Io instance for this function
    const gpa = std.heap.c_allocator;
    var io_state = std.Io.Threaded.init(gpa, .{});
    defer io_state.deinit();
    const io = io_state.io();

    const result = process.run(allocator, io, .{
        .argv = &[_][]const u8{ command, "--version" },
        .stderr_limit = std.Io.Limit.limited(1024),
        .stdout_limit = std.Io.Limit.limited(1024),
    }) catch |err| {
        if (err == error.FileNotFound) return false;
        return false;
    };

    allocator.free(result.stdout);
    allocator.free(result.stderr);

    return result.term.exited == 0;
}

/// Read package.json and update version
fn updatePackageVersion(io: std.Io, allocator: std.mem.Allocator) ![]const u8 {
    const cwd = std.Io.Dir.cwd();
    const file = cwd.openFile(io, "package.json", .{ .mode = .read_only }) catch |err| switch (err) {
        error.FileNotFound => {
            std.log.err("package.json not found", .{});
            return error.FileNotFound;
        },
        else => return err,
    };
    defer file.close(io);

    // Read file using streaming approach
    var buffer: [size_1mb]u8 = undefined;
    const bytes_read = try file.readStreaming(io, &[_][]u8{buffer[0..]});
    const contents = try allocator.alloc(u8, bytes_read);
    defer allocator.free(contents);
    @memmove(contents[0..bytes_read], buffer[0..bytes_read]);

    var parsed = try json.parseFromSlice(json.Value, allocator, contents, .{});
    defer parsed.deinit();

    var root = parsed.value.object;
    // Find version field in package.json
    const version_entry = root.get("version") orelse {
        std.log.err("version field not found in package.json", .{});
        return error.VersionFieldNotFound;
    };

    // Check if version is a string
    if (version_entry != .string) {
        std.log.err("version field is not a string in package.json", .{});
        return error.InvalidVersionFormat;
    }

    const current_version = version_entry.string;
    const new_version = try incrementVersion(allocator, current_version);

    // Update version in package.json using string replacement
    const version_pattern = "\"version\": \"";
    const version_start = std.mem.indexOf(u8, contents, version_pattern) orelse {
        std.log.err("Version pattern not found in package.json", .{});
        return error.VersionPatternNotFound;
    };
    const start_idx = version_start + version_pattern.len;

    const version_end_offset = std.mem.indexOf(u8, contents[start_idx..], "\"") orelse {
        std.log.err("Version end quote not found in package.json", .{});
        return error.VersionPatternNotFound;
    };
    const end_idx = start_idx + version_end_offset;

    const new_len = start_idx + new_version.len + (contents.len - end_idx);
    var new_contents = try allocator.alloc(u8, new_len);
    defer allocator.free(new_contents);

    // Copy before version
    @memmove(new_contents[0..start_idx], contents[0..start_idx]);
    // Copy new version
    @memmove(new_contents[start_idx .. start_idx + new_version.len], new_version);
    // Copy after version
    @memmove(new_contents[start_idx + new_version.len ..], contents[end_idx..]);

    // Write new package.json
    {
        const out_file = cwd.createFile(io, "package.json", .{}) catch |err| {
            std.log.err("Failed to create package.json: {}", .{err});
            return err;
        };
        defer out_file.close(io);
        var write_buffer: [4096]u8 = undefined;
        var writer = out_file.writerStreaming(io, &write_buffer);
        try writer.interface.writeAll(new_contents);
    }

    std.log.info("Updated version from {s} to {s}", .{ current_version, new_version });
    return new_version;
}

pub fn main() !void {
    const allocator = std.heap.c_allocator;

    // Create a basic Io instance for standalone use
    var io_state = std.Io.Threaded.init(allocator, .{});
    defer io_state.deinit();
    const io = io_state.io();

    std.log.info("Starting release process...", .{});

    // Update version in package.json
    const new_version = try updatePackageVersion(io, allocator);
    defer allocator.free(new_version);

    // Check if ./CHANGELOG.md contains the new version
    try checkChangelog(io, allocator, new_version);

    // Build the package
    std.log.info("Building package...", .{});
    {
        const output = try execCommand(allocator, io, &[_][]const u8{ "bun", "run", "build" });
        allocator.free(output);
    }

    // Run tests
    // std.log.info("Running tests...", .{});
    // {
    //     const output = try execCommand(allocator, io, &[_][]const u8{ "bun", "run", "test" });
    //     allocator.free(output);
    // }

    // Commit changes
    std.log.info("Committing changes...", .{});
    {
        const output = try execCommand(allocator, io, &[_][]const u8{ "git", "add", "package.json" });
        allocator.free(output);
    }

    const tag_name = try std.fmt.allocPrint(allocator, "visualizer-v{s}", .{new_version});
    defer allocator.free(tag_name);

    const commit_message = try std.fmt.allocPrint(allocator, "chore: release {s}", .{tag_name});

    defer allocator.free(commit_message);
    {
        const output = try execCommand(allocator, io, &[_][]const u8{ "git", "commit", "-m", commit_message });
        allocator.free(output);
    }

    // Create and push tag
    std.log.info("Creating and pushing tag...", .{});

    {
        const output = try execCommand(allocator, io, &[_][]const u8{ "git", "tag", tag_name });
        allocator.free(output);
    }
    {
        const output = try execCommand(allocator, io, &[_][]const u8{ "git", "push", "origin", "main" });
        allocator.free(output);
    }
    // {
    //     const output = try execCommand(allocator, &[_][]const u8{ "git", "push", "origin", tag_name });
    //     allocator.free(output);
    // }

    // Create GitHub release if `gh` is available
    if (isCommandAvailable(allocator, "gh")) {
        std.log.info("Creating GitHub release...", .{});
        const output = try execCommand(allocator, io, &[_][]const u8{
            "gh",
            "release",
            "create",
            tag_name,
            "--title",
            tag_name,
            "--generate-notes",
        });
        allocator.free(output);
    } else {
        std.log.info("`gh` command not found, skipping GitHub release creation.", .{});
    }

    // run `bun publish`
    // std.log.info("Publishing package...", .{});
    // {
    //     const output = try execCommand(allocator, &[_][]const u8{ "bun", "publish" });
    //     allocator.free(output);
    // }

    std.log.info("Release {s} completed successfully!", .{tag_name});
}
