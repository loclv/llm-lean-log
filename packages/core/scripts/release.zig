// script to release a new version of the package
// run `zig run scripts/release.zig`
// Plus 0.0.1 to the version number in package.json
// Commit and tag the new version
// Push the new version to GitHub
// Publish the new version to npm

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

/// Helper function to read file contents into a newly allocated buffer
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

/// Execute a command and return output
fn execCommand(allocator: std.mem.Allocator, io: std.Io, environ_map: *std.process.Environ.Map, args: []const []const u8) ![]const u8 {
    const result = try process.run(allocator, io, .{
        .argv = args,
        .environ_map = environ_map,
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

/// Check if a command is available in the system
fn isCommandAvailable(allocator: std.mem.Allocator, io: std.Io, environ_map: *std.process.Environ.Map, command: []const u8) bool {
    const result = process.run(allocator, io, .{
        .argv = &[_][]const u8{ command, "--version" },
        .environ_map = environ_map,
        .stderr_limit = std.Io.Limit.limited(1024),
        .stdout_limit = std.Io.Limit.limited(1024),
    }) catch |err| {
        if (err == error.FileNotFound) return false;
        return false;
    };

    defer allocator.free(result.stdout);
    defer allocator.free(result.stderr);

    return result.term.exited == 0;
}

/// Check if CHANGELOG.md contains the new version
fn checkChangelog(io: std.Io, allocator: std.mem.Allocator, version: []const u8) !void {
    const contents = try readFileContents(io, allocator, "CHANGELOG.md");
    defer allocator.free(contents);

    const version_pattern = try std.fmt.allocPrint(allocator, "## [{s}]", .{version});
    defer allocator.free(version_pattern);

    if (std.mem.indexOf(u8, contents, version_pattern) == null) {
        std.log.err("Version {s} not found in CHANGELOG.md. Please update it before releasing.", .{version});
        return error.ChangelogVersionNotFound;
    }

    std.log.info("Version {s} found in CHANGELOG.md", .{version});
}

/// Read package.json and update version
fn updatePackageVersion(io: std.Io, allocator: std.mem.Allocator) ![]const u8 {
    const contents = try readFileContents(io, allocator, "package.json");
    defer allocator.free(contents);

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
    @memcpy(new_contents[0..start_idx], contents[0..start_idx]);
    // Copy new version
    @memcpy(new_contents[start_idx .. start_idx + new_version.len], new_version);
    // Copy after version
    @memcpy(new_contents[start_idx + new_version.len ..], contents[end_idx..]);

    // Write new package.json
    {
        const cwd = std.Io.Dir.cwd();
        try cwd.writeFile(io, .{ .sub_path = "package.json", .data = new_contents });
    }

    std.log.info("Updated version from {s} to {s}", .{ current_version, new_version });
    return new_version;
}

pub fn main(init: std.process.Init) !void {
    const allocator = init.gpa;
    const io = init.io;
    const environ_map = init.environ_map;

    std.log.info("Starting release process for core...", .{});

    // Update version in package.json
    const new_version = try updatePackageVersion(io, allocator);
    defer allocator.free(new_version);

    // Check if ./CHANGELOG.md contains the new version
    try checkChangelog(io, allocator, new_version);

    // Build the package
    std.log.info("Building package...", .{});
    {
        const output = try execCommand(allocator, io, environ_map, &[_][]const u8{ "bun", "run", "build" });
        allocator.free(output);
    }

    // Run tests
    std.log.info("Running tests...", .{});
    {
        const output = try execCommand(allocator, io, environ_map, &[_][]const u8{ "bun", "test" });
        allocator.free(output);
    }

    const tag_name = try std.fmt.allocPrint(allocator, "core-v{s}", .{new_version});
    defer allocator.free(tag_name);

    // Commit changes
    std.log.info("Committing changes...", .{});
    {
        const output = try execCommand(allocator, io, environ_map, &[_][]const u8{ "git", "add", "package.json" });
        allocator.free(output);
    }
    const commit_message = try std.fmt.allocPrint(allocator, "chore: release {s}", .{tag_name});
    defer allocator.free(commit_message);
    {
        const output = try execCommand(allocator, io, environ_map, &[_][]const u8{ "git", "commit", "-m", commit_message });
        allocator.free(output);
    }

    // Create and push tag
    std.log.info("Creating and pushing tag...", .{});
    {
        const output = try execCommand(allocator, io, environ_map, &[_][]const u8{ "git", "tag", tag_name });
        allocator.free(output);
    }
    {
        const output = try execCommand(allocator, io, environ_map, &[_][]const u8{ "git", "push", "origin", "main" });
        allocator.free(output);
    }
    {
        const output = try execCommand(allocator, io, environ_map, &[_][]const u8{ "git", "push", "origin", tag_name });
        allocator.free(output);
    }

    // Create GitHub release if `gh` is available
    if (isCommandAvailable(allocator, io, environ_map, "gh")) {
        std.log.info("Creating GitHub release...", .{});
        const output = try execCommand(allocator, io, environ_map, &[_][]const u8{
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

    std.log.info("Release {s} completed successfully!", .{tag_name});
}
