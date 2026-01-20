// script to release a new version of the package
// run `zig run scripts/release.zig`
// Plus 0.0.1 to the version number in package.json
// Commit and tag the new version
// Push the new version to GitHub
// Publish the new version to npm

const std = @import("std");
const json = std.json;
const process = std.process;

/// Parse version string and increment patch version
fn incrementVersion(version: []const u8, allocator: std.mem.Allocator) ![]const u8 {
    var iter = std.mem.splitScalar(u8, version, '.');
    const major = try std.fmt.parseInt(u32, iter.next().?, 10);
    const minor = try std.fmt.parseInt(u32, iter.next().?, 10);
    var patch = try std.fmt.parseInt(u32, iter.next().?, 10);

    patch += 1;

    return std.fmt.allocPrint(allocator, "{}.{}.{}", .{ major, minor, patch });
}

/// Execute a command and return output
fn execCommand(allocator: std.mem.Allocator, args: []const []const u8) ![]const u8 {
    const result = try process.Child.run(.{
        .allocator = allocator,
        .argv = args,
        // 1MB = 1024 * 1024
        .max_output_bytes = 1048576,
    });

    defer allocator.free(result.stdout);
    defer allocator.free(result.stderr);

    if (result.term.Exited != 0) {
        std.log.err("Command failed: {s}\nStderr: {s}", .{ args[0], result.stderr });
        return error.CommandFailed;
    }

    return allocator.dupe(u8, std.mem.trim(u8, result.stdout, "\n"));
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

    const contents = try file.readToEndAlloc(allocator, 1024 * 1024);
    defer allocator.free(contents);

    var parsed = try json.parseFromSlice(json.Value, allocator, contents, .{});
    defer parsed.deinit();

    var root = parsed.value.object;
    const current_version = root.get("version").?.string;
    const new_version = try incrementVersion(current_version, allocator);

    // Update version in parsed JSON
    root.put("version", .{ .string = new_version }) catch unreachable;

    // Write back to file
    var string_buf = std.ArrayList(u8).init(allocator);
    defer string_buf.deinit();
    try json.stringify(parsed.value, .{ .whitespace = .indent_2 }, string_buf.writer());
    const new_contents = try string_buf.toOwnedSlice();
    defer allocator.free(new_contents);

    try std.fs.cwd().writeFile("package.json", new_contents);

    std.log.info("Updated version from {s} to {s}", .{ current_version, new_version });
    return new_version;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.log.info("Starting release process...", .{});

    // Update version in package.json
    const new_version = try updatePackageVersion(allocator);
    defer allocator.free(new_version);

    // Build the package
    std.log.info("Building package...", .{});
    try execCommand(allocator, &[_][]const u8{ "bun", "run", "build" });

    // Run tests
    std.log.info("Running tests...", .{});
    try execCommand(allocator, &[_][]const u8{ "bun", "test" });

    // Commit changes
    std.log.info("Committing changes...", .{});
    try execCommand(allocator, &[_][]const u8{ "git", "add", "package.json" });
    const commit_message = try std.fmt.allocPrint(allocator, "chore: release v{s}", .{new_version});
    defer allocator.free(commit_message);
    try execCommand(allocator, &[_][]const u8{ "git", "commit", "-m", commit_message });

    // Create and push tag
    std.log.info("Creating and pushing tag...", .{});
    const tag_name = try std.fmt.allocPrint(allocator, "v{s}", .{new_version});
    defer allocator.free(tag_name);
    try execCommand(allocator, &[_][]const u8{ "git", "tag", tag_name });
    try execCommand(allocator, &[_][]const u8{ "git", "push", "origin", "main" });
    try execCommand(allocator, &[_][]const u8{ "git", "push", "origin", tag_name });

    // TODO: Publish to npm
    // std.log.info("Publishing to npm...", .{});
    // try execCommand(allocator, &[_][]const u8{ "npm", "publish" });

    std.log.info("Release v{s} completed successfully!", .{new_version});
}
