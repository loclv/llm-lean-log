const std = @import("std");

pub const CLR_RESET = "\x1b[0m";
pub const CLR_BOLD = "\x1b[1m";
pub const CLR_CYAN = "\x1b[36m";
pub const CLR_GREEN = "\x1b[32m";
pub const CLR_YELLOW = "\x1b[33m";
pub const CLR_GRAY = "\x1b[90m";

pub const LogEntry = struct {
    id: []const u8,
    name: []const u8,
    tags: []const u8,
    problem: []const u8,
    solution: []const u8,
    action: []const u8,
    files: []const u8,
    tech_stack: []const u8,
    cause: []const u8,
    causeIds: []const u8,
    effectIds: []const u8,
    last_commit_short_sha: []const u8,
    created_at: []const u8,
    updated_at: []const u8,
    model: []const u8,
    created_by_agent: []const u8,

    pub fn formatCsv(self: LogEntry, writer: anytype) !void {
        try writeQuoted(writer, self.id);
        try writer.writeAll(",");
        try writeQuoted(writer, self.name);
        try writer.writeAll(",");
        try writeQuoted(writer, self.tags);
        try writer.writeAll(",");
        try writeQuoted(writer, self.problem);
        try writer.writeAll(",");
        try writeQuoted(writer, self.solution);
        try writer.writeAll(",");
        try writeQuoted(writer, self.action);
        try writer.writeAll(",");
        try writeQuoted(writer, self.files);
        try writer.writeAll(",");
        try writeQuoted(writer, self.tech_stack);
        try writer.writeAll(",");
        try writeQuoted(writer, self.cause);
        try writer.writeAll(",");
        try writeQuoted(writer, self.causeIds);
        try writer.writeAll(",");
        try writeQuoted(writer, self.effectIds);
        try writer.writeAll(",");
        try writeQuoted(writer, self.last_commit_short_sha);
        try writer.writeAll(",");
        try writeQuoted(writer, self.created_at);
        try writer.writeAll(",");
        try writeQuoted(writer, self.updated_at);
        try writer.writeAll(",");
        try writeQuoted(writer, self.model);
        try writer.writeAll(",");
        try writeQuoted(writer, self.created_by_agent);
        try writer.writeAll("\n");
    }

    fn writeQuoted(writer: anytype, text: []const u8) !void {
        if (text.len == 0) return;
        try writer.writeAll("\"");
        for (text) |c| {
            if (c == '"') {
                try writer.writeAll("\"\"");
            } else {
                try writer.writeByte(c);
            }
        }
        try writer.writeAll("\"");
    }
};

pub fn parseIso8601(allocator: std.mem.Allocator, seconds: i64) ![]const u8 {
    const epoch_seconds: u64 = @intCast(seconds);
    const day_seconds = epoch_seconds % 86400;
    const hour = day_seconds / 3600;
    const minute = (day_seconds % 3600) / 60;
    const second = day_seconds % 60;

    const days = epoch_seconds / 86400;
    var year: u16 = 1970;
    var remaining_days = days;
    while (true) {
        const leap = (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0);
        const days_in_year: u16 = if (leap) 366 else 365;
        if (remaining_days < days_in_year) break;
        remaining_days -= days_in_year;
        year += 1;
    }

    const leap = (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0);
    const month_days = [12]u8{ 31, if (leap) 29 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };
    var month: u8 = 0;
    while (remaining_days >= month_days[month]) {
        remaining_days -= month_days[month];
        month += 1;
    }

    return std.fmt.allocPrint(allocator, "{d:0>4}-{d:0>2}-{d:0>2}T{d:0>2}:{d:0>2}:{d:0>2}Z", .{ year, month + 1, remaining_days + 1, hour, minute, second });
}

pub fn indexOfIgnoreCase(haystack: []const u8, needle: []const u8) ?usize {
    if (needle.len == 0) return 0;
    if (haystack.len < needle.len) return null;
    var i: usize = 0;
    const limit = haystack.len - needle.len;
    while (i <= limit) : (i += 1) {
        if (std.ascii.eqlIgnoreCase(haystack[i .. i + needle.len], needle)) return i;
    }
    return null;
}

pub fn generateUuid(allocator: std.mem.Allocator, io: std.Io) ![]const u8 {
    var bytes: [16]u8 = undefined;
    io.random(&bytes);

    // Set version to 4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant to RFC 4122
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return std.fmt.allocPrint(allocator, "{x:0>2}{x:0>2}{x:0>2}{x:0>2}-{x:0>2}{x:0>2}-{x:0>2}{x:0>2}-{x:0>2}{x:0>2}-{x:0>2}{x:0>2}{x:0>2}{x:0>2}{x:0>2}{x:0>2}", .{
        bytes[0],  bytes[1],  bytes[2],  bytes[3],
        bytes[4],  bytes[5],  bytes[6],  bytes[7],
        bytes[8],  bytes[9],  bytes[10], bytes[11],
        bytes[12], bytes[13], bytes[14], bytes[15],
    });
}

pub const CsvParser = struct {
    allocator: std.mem.Allocator,

    pub fn parse(self: CsvParser, content: []const u8) ![]LogEntry {
        var entries = std.ArrayList(LogEntry).empty;
        var lines = std.mem.splitAny(u8, content, "\r\n");

        const header = lines.next() orelse return entries.toOwnedSlice(self.allocator);
        _ = header; // Skip header for now, assume order is correct

        while (lines.next()) |line| {
            if (line.len == 0) continue;

            var fields = std.ArrayList([]const u8).empty;
            defer fields.deinit(self.allocator);

            var i: usize = 0;
            while (i < line.len) {
                if (line[i] == '"') {
                    i += 1;
                    const start = i;
                    while (i < line.len) {
                        if (line[i] == '"') {
                            if (i + 1 < line.len and line[i + 1] == '"') {
                                i += 2;
                                continue;
                            }
                            break;
                        }
                        i += 1;
                    }
                    const field_raw = line[start..i];
                    // Unescape quotes
                    var unescaped = std.ArrayList(u8).empty;
                    var j: usize = 0;
                    while (j < field_raw.len) {
                        if (field_raw[j] == '"' and j + 1 < field_raw.len and field_raw[j + 1] == '"') {
                            try unescaped.append(self.allocator, '"');
                            j += 2;
                        } else {
                            try unescaped.append(self.allocator, field_raw[j]);
                            j += 1;
                        }
                    }
                    try fields.append(self.allocator, try unescaped.toOwnedSlice(self.allocator));
                    if (i < line.len) i += 1; // Skip closing quote
                    if (i < line.len and line[i] == ',') i += 1; // Skip comma
                } else {
                    const start = i;
                    while (i < line.len and line[i] != ',') i += 1;
                    try fields.append(self.allocator, try self.allocator.dupe(u8, line[start..i]));
                    if (i < line.len) i += 1; // Skip comma
                }
            }

            if (fields.items.len >= 16) {
                try entries.append(self.allocator, .{
                    .id = fields.items[0],
                    .name = fields.items[1],
                    .tags = fields.items[2],
                    .problem = fields.items[3],
                    .solution = fields.items[4],
                    .action = fields.items[5],
                    .files = fields.items[6],
                    .tech_stack = fields.items[7],
                    .cause = fields.items[8],
                    .causeIds = fields.items[9],
                    .effectIds = fields.items[10],
                    .last_commit_short_sha = fields.items[11],
                    .created_at = fields.items[12],
                    .updated_at = fields.items[13],
                    .model = fields.items[14],
                    .created_by_agent = fields.items[15],
                });
            }
        }

        return entries.toOwnedSlice(self.allocator);
    }
};
