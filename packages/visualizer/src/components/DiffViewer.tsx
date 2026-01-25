import { motion } from "framer-motion";
import { X } from "lucide-react";
import type React from "react";

interface DiffViewerProps {
	isOpen: boolean;
	onClose: () => void;
	diffContent: string;
	logId: string;
}

/**
 * Displays git diff content in a beautiful modal overlay.
 */
export const DiffViewer: React.FC<DiffViewerProps> = ({
	isOpen,
	onClose,
	diffContent,
	logId,
}) => {
	if (!isOpen) return null;

	// Parse diff to separate files and their changes
	const parseDiff = (content: string) => {
		const lines = content.split("\n");
		const files: Array<{
			filename: string;
			changes: string[];
			isNew: boolean;
			isDeleted: boolean;
		}> = [];

		let currentFile: (typeof files)[0] | null = null;

		for (const line of lines) {
			// New file indicator
			if (line.startsWith("diff --git")) {
				if (currentFile) {
					files.push(currentFile);
				}
				const match = line.match(/b\/(.+)$/);
				currentFile = {
					filename: match ? match[1] : "Unknown file",
					changes: [],
					isNew: false,
					isDeleted: false,
				};
			}
			// New file creation
			else if (line.startsWith("new file mode")) {
				if (currentFile) {
					currentFile.isNew = true;
				}
			}
			// File deletion
			else if (line.startsWith("deleted file mode")) {
				if (currentFile) {
					currentFile.isDeleted = true;
				}
			}
			// Content lines
			else if (
				currentFile &&
				(line.startsWith("+") ||
					line.startsWith("-") ||
					line.startsWith(" ") ||
					line.startsWith("@@"))
			) {
				currentFile.changes.push(line);
			}
		}

		if (currentFile) {
			files.push(currentFile);
		}

		return files;
	};

	const parsedFiles = parseDiff(diffContent);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-50 flex items-center justify-center"
			style={{
				background: "rgba(0, 0, 0, 0.8)",
				backdropFilter: "blur(4px)",
			}}
			onClick={onClose}
		>
			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: 20 }}
				className="glass"
				style={{
					width: "90vw",
					height: "80vh",
					maxWidth: "1200px",
					padding: "2rem",
					display: "flex",
					flexDirection: "column",
					borderRadius: "16px",
					border: "1px solid var(--glass-border)",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					className="flex justify-between items-center"
					style={{ marginBottom: "1.5rem" }}
				>
					<div>
						<h2
							style={{
								fontSize: "1.5rem",
								color: "var(--text-primary)",
								marginBottom: "0.5rem",
							}}
						>
							Git Diff Viewer
						</h2>
						<p
							style={{
								color: "var(--text-secondary)",
								fontSize: "0.875rem",
								fontFamily: "monospace",
							}}
						>
							Log ID: {logId}
						</p>
					</div>
					<button
						type="button"
						className="btn btn-secondary"
						onClick={onClose}
						style={{
							padding: "0.5rem",
							borderRadius: "8px",
							background: "var(--bg-secondary)",
							border: "1px solid var(--border-color)",
							color: "var(--text-primary)",
							cursor: "pointer",
						}}
					>
						<X size={20} />
					</button>
				</div>

				{/* Diff Content */}
				<div
					style={{
						flex: 1,
						overflowY: "auto",
						border: "1px solid var(--border-color)",
						borderRadius: "8px",
						background: "var(--bg-primary)",
					}}
				>
					{parsedFiles.length === 0 ? (
						<div
							style={{
								padding: "2rem",
								textAlign: "center",
								color: "var(--text-secondary)",
							}}
						>
							No diff content available
						</div>
					) : (
						<div style={{ padding: "1rem" }}>
							{parsedFiles.map((file, fileIndex) => (
								<div
									key={fileIndex}
									style={{
										marginBottom: "2rem",
										border: "1px solid var(--border-color)",
										borderRadius: "8px",
										overflow: "hidden",
									}}
								>
									{/* File header */}
									<div
										style={{
											padding: "0.75rem 1rem",
											background: "var(--bg-secondary)",
											borderBottom: "1px solid var(--border-color)",
											display: "flex",
											alignItems: "center",
											gap: "0.5rem",
										}}
									>
										<span
											style={{
												fontSize: "0.875rem",
												fontWeight: "bold",
												color: "var(--text-primary)",
											}}
										>
											{file.filename}
										</span>
										{file.isNew && (
											<span
												className="badge badge-green"
												style={{
													fontSize: "0.75rem",
													padding: "2px 6px",
													borderRadius: "4px",
												}}
											>
												NEW
											</span>
										)}
										{file.isDeleted && (
											<span
												className="badge badge-red"
												style={{
													fontSize: "0.75rem",
													padding: "2px 6px",
													borderRadius: "4px",
												}}
											>
												DELETED
											</span>
										)}
									</div>

									{/* File diff content */}
									<div style={{ maxHeight: "400px", overflowY: "auto" }}>
										<div
											style={{
												background: "var(--bg-primary)",
												padding: "1rem",
												fontFamily: "monospace",
												fontSize: "0.85rem",
												lineHeight: "1.4",
											}}
										>
											{file.changes.map((line, lineIndex) => {
												let color = "var(--text-primary)";
												let backgroundColor = "transparent";
												let paddingLeft = "0.5rem";

												if (line.startsWith("+")) {
													color = "var(--success)";
													backgroundColor = "rgba(34, 197, 94, 0.1)";
												} else if (line.startsWith("-")) {
													color = "var(--error)";
													backgroundColor = "rgba(239, 68, 68, 0.1)";
												} else if (line.startsWith("@@")) {
													color = "var(--accent-primary)";
													backgroundColor = "rgba(99, 102, 241, 0.1)";
													paddingLeft = "1rem";
												} else if (line.startsWith(" ")) {
													paddingLeft = "0.5rem";
												}

												return (
													<div
														key={lineIndex}
														style={{
															color,
															backgroundColor,
															paddingLeft,
															paddingRight: "0.5rem",
															paddingTop: "0.125rem",
															paddingBottom: "0.125rem",
															whiteSpace: "pre-wrap",
															wordBreak: "break-all",
														}}
													>
														{line}
													</div>
												);
											})}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</motion.div>
		</motion.div>
	);
};
