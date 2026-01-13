import { motion } from "framer-motion";
import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	Cpu,
	FileCode,
	Layers,
	MessageSquare,
	Tag,
} from "lucide-react";
import type React from "react";
import type { LogEntry } from "../types";
import { extractCode, formatDate, parseTags } from "../utils";
import { CodeBlock } from "./CodeBlock";

interface LogCardProps {
	entry: LogEntry;
	index: number;
}

/**
 * Displays a single log entry in a beautiful card format.
 */
export const LogCard: React.FC<LogCardProps> = ({ entry, index }) => {
	const tags = parseTags(entry.tags);
	const codeInfo = extractCode(entry.action);
	const createdAt = formatDate(entry["created-at"]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.05 }}
			style={{ marginBottom: "1.5rem" }}
		>
			<div
				className="glass"
				style={{
					padding: "1.5rem",
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
				}}
			>
				<div className="flex justify-between items-center">
					<h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>
						{entry.name}
					</h3>
					<div className="flex gap-2">
						{tags.map((tag) => (
							<span key={tag} className="badge badge-blue">
								<Tag size={12} style={{ marginRight: "4px" }} />
								{tag}
							</span>
						))}
					</div>
				</div>

				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: "1.5rem",
					}}
				>
					<div className="flex flex-col gap-2">
						<div
							className="flex items-center gap-2"
							style={{ color: "var(--error)" }}
						>
							<AlertCircle size={16} />
							<strong style={{ fontSize: "0.875rem" }}>Problem</strong>
						</div>
						<p style={{ color: "var(--text-secondary)", fontSize: "0.925rem" }}>
							{entry.problem}
						</p>
					</div>

					<div className="flex flex-col gap-2">
						<div
							className="flex items-center gap-2"
							style={{ color: "var(--success)" }}
						>
							<CheckCircle2 size={16} />
							<strong style={{ fontSize: "0.875rem" }}>Solution</strong>
						</div>
						<p style={{ color: "var(--text-secondary)", fontSize: "0.925rem" }}>
							{entry.solution}
						</p>
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<div
						className="flex items-center gap-2"
						style={{ color: "var(--info)" }}
					>
						<MessageSquare size={16} />
						<strong style={{ fontSize: "0.875rem" }}>Action</strong>
					</div>
					{codeInfo ? (
						<div>
							<p
								style={{
									color: "var(--text-secondary)",
									fontSize: "0.925rem",
									marginBottom: "0.5rem",
								}}
							>
								{entry.action.replace(
									`${codeInfo.language}\`${codeInfo.code}\``,
									"",
								)}
							</p>
							<CodeBlock code={codeInfo.code} language={codeInfo.language} />
						</div>
					) : (
						<p style={{ color: "var(--text-secondary)", fontSize: "0.925rem" }}>
							{entry.action}
						</p>
					)}
				</div>

				{entry.files && (
					<div className="flex flex-col gap-2">
						<div
							className="flex items-center gap-2"
							style={{ color: "var(--accent-primary)" }}
						>
							<FileCode size={16} />
							<strong style={{ fontSize: "0.875rem" }}>Files</strong>
						</div>
						<div className="flex flex-wrap gap-2">
							{entry.files
								.split(",")
								.map((f) => f.trim())
								.filter(Boolean)
								.map((file) => (
									<span
										key={file}
										className="badge"
										style={{
											background: "var(--bg-tertiary)",
											color: "var(--text-secondary)",
											border: "1px solid var(--border-color)",
											fontSize: "0.75rem",
											padding: "2px 8px",
											borderRadius: "6px",
										}}
									>
										{file.trim()}
									</span>
								))}
						</div>
					</div>
				)}

				{entry["tech-stack"] && (
					<div className="flex flex-col gap-2">
						<div
							className="flex items-center gap-2"
							style={{ color: "var(--accent-secondary, #a855f7)" }}
						>
							<Layers size={16} />
							<strong style={{ fontSize: "0.875rem" }}>Tech Stack</strong>
						</div>
						<div className="flex flex-wrap gap-2">
							{entry["tech-stack"]
								.split(",")
								.map((t) => t.trim())
								.filter(Boolean)
								.map((tech) => (
									<span
										key={tech}
										className="badge"
										style={{
											background: "var(--bg-tertiary)",
											color: "var(--text-secondary)",
											border: "1px solid var(--border-color)",
											fontSize: "0.75rem",
											padding: "2px 8px",
											borderRadius: "6px",
										}}
									>
										{tech.trim()}
									</span>
								))}
						</div>
					</div>
				)}

				<div
					className="flex justify-between items-center mt-4"
					style={{
						paddingTop: "1rem",
						borderTop: "1px solid var(--border-color)",
					}}
				>
					<div className="flex gap-4">
						{entry.model && (
							<div
								className="flex items-center gap-1"
								style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}
							>
								<Cpu size={14} />
								<span>{entry.model}</span>
							</div>
						)}
						{entry["created-by-agent"] && (
							<div
								className="flex items-center gap-1"
								style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}
							>
								<MessageSquare size={14} />
								<span>{entry["created-by-agent"]}</span>
							</div>
						)}
					</div>
					<div
						className="flex items-center gap-1"
						style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}
					>
						<Calendar size={14} />
						<span>{createdAt}</span>
					</div>
				</div>
			</div>
		</motion.div>
	);
};
