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
};

// 1MB = 1024 * 1024
const SIZE_1MB = 1048576;

/// Parse version string and increment patch version
fn incrementVersion(version: []const u8, allocator: std.mem.Allocator) ![]const u8 {
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
fn execCommand(allocator: std.mem.Allocator, args: []const []const u8) ![]const u8 {
    const result = try process.Child.run(.{
        .allocator = allocator,
        .argv = args,
        .max_output_bytes = SIZE_1MB,
    });

    defer allocator.free(result.stdout);
    defer allocator.free(result.stderr);

    if (result.term.Exited != 0) {
        std.log.err("Command failed: {s}\nStderr: {s}", .{ args[0], result.stderr });
        return error.CommandFailed;
    }

    return allocator.dupe(u8, std.mem.trim(u8, result.stdout, "\n"));
}

/// Update version in TypeScript const file
fn updateConstVersion(allocator: std.mem.Allocator, new_version: []const u8) !void {
    const file = std.fs.cwd().openFile("src/utils/const.ts", .{}) catch |err| switch (err) {
        error.FileNotFound => {
            std.log.err("src/utils/const.ts not found", .{});
            return error.FileNotFound;
        },
        else => return err,
    };
    defer file.close();

    const contents = try file.readToEndAlloc(allocator, SIZE_1MB);
    defer allocator.free(contents);

    // Find and replace version in the TypeScript file
    const version_pattern = "export const VERSION = \"";
    const version_start = std.mem.indexOf(u8, contents, version_pattern) orelse {
        std.log.err("Version pattern not found in src/utils/const.ts", .{});
        return error.VersionPatternNotFound;
    };
    const start_idx = version_start + version_pattern.len;

    const version_end_offset = std.mem.indexOf(u8, contents[start_idx..], "\"") orelse {
        std.log.err("Version end quote not found in src/utils/const.ts", .{});
        return error.VersionPatternNotFound;
    };
    const end_idx = start_idx + version_end_offset;

    const new_len = start_idx + new_version.len + (contents.len - end_idx);
    var new_contents = try allocator.alloc(u8, new_len);
    defer allocator.free(new_contents);

    // Copy before version
    std.mem.copyForwards(u8, new_contents[0..start_idx], contents[0..start_idx]);
    // Copy new version
    std.mem.copyForwards(u8, new_contents[start_idx .. start_idx + new_version.len], new_version);
    // Copy after version
    std.mem.copyForwards(u8, new_contents[start_idx + new_version.len ..], contents[end_idx..]);

    // Write new contents to the TypeScript file
    try std.fs.cwd().writeFile(.{ .sub_path = "src/utils/const.ts", .data = new_contents });

    std.log.info("Updated version in src/utils/const.ts to {s}", .{new_version});
}

/// Read package.json and update version
fn updatePackageVersion(allocator: std.mem.Allocator) ![]const u8 {
    const file = std.fs.cwd().openFile("package.json", .{}) catch |err| switch (err) {
        error.FileNotFound => {
            std.log.err("package.json not found", .{});
            return error.FileNotFound;
        },
        else => return err,
    };
    defer file.close();

    const contents = try file.readToEndAlloc(allocator, SIZE_1MB);
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
    const new_version = try incrementVersion(current_version, allocator);

    // Update version in package.json
    try root.put("version", .{ .string = new_version });

    // Find version pattern in package.json
    const version_pattern = "\"version\": \"";
    const version_start = std.mem.indexOf(u8, contents, version_pattern) orelse {
        std.log.err("Version pattern not found in package.json", .{});
        return error.VersionPatternNotFound;
    };
    const start_idx = version_start + version_pattern.len;

    // Find version end quote in package.json
    const version_end_offset = std.mem.indexOf(u8, contents[start_idx..], "\"") orelse {
        std.log.err("Version end quote not found in package.json", .{});
        return error.VersionPatternNotFound;
    };
    const end_idx = start_idx + version_end_offset;

    // Update version in package.json
    const new_len = start_idx + new_version.len + (contents.len - end_idx);
    var new_contents = try allocator.alloc(u8, new_len);
    defer allocator.free(new_contents);

    // Copy before version
    std.mem.copyForwards(u8, new_contents[0..start_idx], contents[0..start_idx]);
    // Copy new version
    std.mem.copyForwards(u8, new_contents[start_idx .. start_idx + new_version.len], new_version);
    // Copy after version
    std.mem.copyForwards(u8, new_contents[start_idx + new_version.len ..], contents[end_idx..]);

    // Write new package.json
    try std.fs.cwd().writeFile(.{ .sub_path = "package.json", .data = new_contents });

    std.log.info("Updated version from {s} to {s}", .{ current_version, new_version });
    return new_version;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.log.info("Starting release process for CLI...", .{});

    // Update version in package.json
    const new_version = try updatePackageVersion(allocator);
    defer allocator.free(new_version);

    // Update version in TypeScript const file
    try updateConstVersion(allocator, new_version);

    // Build the package
    std.log.info("Building package...", .{});
    {
        const output = try execCommand(allocator, &[_][]const u8{ "bun", "run", "build" });
        allocator.free(output);
    }

    // Run tests
    std.log.info("Running tests...", .{});
    {
        const output = try execCommand(allocator, &[_][]const u8{ "bun", "test" });
        allocator.free(output);
    }

    const tag_name = try std.fmt.allocPrint(allocator, "cli-v{s}", .{new_version});
    // Tag name should be in the format cli-v0.0.1
    // `defer` will free the memory allocated by `allocPrint`,
    // so we don't need to free it manually
    defer allocator.free(tag_name);

    // Commit changes
    std.log.info("Committing changes...", .{});
    {
        const output = try execCommand(allocator, &[_][]const u8{ "git", "add", "package.json", "src/utils/const.ts" });
        allocator.free(output);
    }
    const commit_message = try std.fmt.allocPrint(allocator, "chore: release {s}", .{tag_name});
    defer allocator.free(commit_message);
    {
        const output = try execCommand(allocator, &[_][]const u8{ "git", "commit", "-m", commit_message });
        allocator.free(output);
    }

    // Create and push tag
    std.log.info("Creating and pushing tag...", .{});

    {
        const output = try execCommand(allocator, &[_][]const u8{ "git", "tag", tag_name });
        allocator.free(output);
    }
    {
        const output = try execCommand(allocator, &[_][]const u8{ "git", "push", "origin", "main" });
        allocator.free(output);
    }
    {
        const output = try execCommand(allocator, &[_][]const u8{ "git", "push", "origin", tag_name });
        allocator.free(output);
    }

    std.log.info("Release {s} completed successfully!", .{tag_name});
}
