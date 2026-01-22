import { AnimatePresence, motion } from "framer-motion";
import type { LogEntry } from "llm-lean-log-core";
import {
	ArrowDownWideNarrow,
	ArrowUpNarrowWide,
	Search,
	Trash2,
	Upload,
} from "lucide-react";
import Papa from "papaparse";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { LogCard } from "./components/LogCard";

/**
 * Storage key for localStorage persistence
 */
const LOGS_STORAGE_KEY = "l";

/**
 * Gets initial logs from localStorage
 */
const getInitialLogs = (): LogEntry[] => {
	try {
		const storedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
		if (storedLogs) {
			return JSON.parse(storedLogs) as LogEntry[];
		}
	} catch (error) {
		console.error("Error parsing stored logs:", error);
		localStorage.removeItem(LOGS_STORAGE_KEY);
	}
	return [];
};

/**
 * Main application component for the LLM Lean Log Visualizer.
 */
function App() {
	const [logs, setLogs] = useState<LogEntry[]>(getInitialLogs());
	const [searchTerm, setSearchTerm] = useState("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [isDragging, setIsDragging] = useState(false);

	/**
	 * Load logs from API only if no stored logs exist
	 */
	useEffect(() => {
		const storedLogs = localStorage.getItem(LOGS_STORAGE_KEY);

		// Only fetch from API if no stored logs exist
		if (!storedLogs) {
			fetch("/api/logs")
				.then((res) => {
					if (res.ok) return res.text();
					throw new Error("No initial data");
				})
				.then((text) => {
					if (text) {
						Papa.parse(text, {
							header: true,
							skipEmptyLines: true,
							complete: (results) => {
								const apiLogs = results.data as LogEntry[];
								setLogs(apiLogs);
							},
						});
					}
				})
				.catch(() => {
					// Silently fail if API is not available or returns error
				});
		}
	}, []);

	/**
	 * Save logs to localStorage whenever they change
	 */
	useEffect(() => {
		if (logs.length > 0) {
			localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
		}
	}, [logs]);

	/**
	 * Handles CSV file parsing and state update.
	 */
	const handleFileUpload = (file: File) => {
		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				const parsedLogs = results.data as LogEntry[];
				setLogs(parsedLogs);
				localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(parsedLogs));
			},
			error: (error) => {
				console.error("Error parsing CSV:", error);
				alert("Failed to parse CSV file.");
			},
		});
	};

	/**
	 * Clears logs from both state and localStorage
	 */
	const clearLogs = () => {
		setLogs([]);
		localStorage.removeItem(LOGS_STORAGE_KEY);
	};

	/**
	 * Drag and drop handlers
	 */
	const onDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const onDragLeave = useCallback(() => {
		setIsDragging(false);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: handleFileUpload changes on every re-render and should not be used as a hook dependency
	const onDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if ((file && file.type === "text/csv") || file.name.endsWith(".csv")) {
			handleFileUpload(file);
		} else {
			alert("Please upload a CSV file.");
		}
	}, []);

	const filteredLogs = logs.filter(
		(log) =>
			log.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			log.problem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			log.solution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			log.tags?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			log.files?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			log["tech-stack"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			log.cause?.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const sortedLogs = [...filteredLogs].sort((a, b) => {
		const timeA = new Date(a["created-at"] || 0).getTime();
		const timeB = new Date(b["created-at"] || 0).getTime();
		return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
	});

	return (
		<div className="container" style={{ paddingBottom: "4rem" }}>
			<header style={{ padding: "4rem 0", textAlign: "center" }}>
				<motion.h1
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					style={{
						fontSize: "3.5rem",
						marginBottom: "1rem",
						background: "var(--accent-gradient)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
					}}
				>
					LLM Lean Log
				</motion.h1>
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
					style={{
						color: "var(--text-secondary)",
						fontSize: "1.1rem",
						maxWidth: "600px",
						margin: "0 auto",
					}}
				>
					A beautiful visualizer for your token-optimized LLM interaction logs.
				</motion.p>
			</header>

			{logs.length === 0 ? (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					className={`glass ${isDragging ? "dragging" : ""}`}
					style={{
						padding: "4rem",
						textAlign: "center",
						border: isDragging
							? "2px dashed var(--accent-primary)"
							: "1px solid var(--glass-border)",
						background: isDragging
							? "rgba(99, 102, 241, 0.05)"
							: "var(--glass-bg)",
						transition: "all 0.3s ease",
					}}
					onDragOver={onDragOver}
					onDragLeave={onDragLeave}
					onDrop={onDrop}
				>
					<div style={{ marginBottom: "2rem" }}>
						<div
							style={{
								width: "80px",
								height: "80px",
								borderRadius: "20px",
								background: "var(--bg-tertiary)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								margin: "0 auto",
								color: "var(--accent-primary)",
							}}
						>
							<Upload size={32} />
						</div>
					</div>
					<h2 style={{ marginBottom: "1rem" }}>Upload your log file</h2>
					<p style={{ color: "var(--text-tertiary)", marginBottom: "2rem" }}>
						Drag and drop your .csv file here, or click to browse
					</p>
					<label className="btn btn-primary">
						<input
							type="file"
							accept=".csv"
							style={{ display: "none" }}
							onChange={(e) =>
								e.target.files?.[0] && handleFileUpload(e.target.files[0])
							}
						/>
						Select CSV File
					</label>
				</motion.div>
			) : (
				<div className="fade-in">
					<div className="flex justify-between items-center mb-8 gap-4">
						<div style={{ position: "relative", flex: 1 }}>
							<Search
								style={{
									position: "absolute",
									left: "12px",
									top: "50%",
									transform: "translateY(-50%)",
									color: "var(--text-tertiary)",
								}}
								size={18}
							/>
							<input
								type="text"
								placeholder="Search logs by name, problem, solution, tags, files, tech-stack, cause"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								style={{
									width: "100%",
									padding: "0.75rem 1rem 0.75rem 2.5rem",
									background: "var(--bg-secondary)",
									border: "1px solid var(--border-color)",
									borderRadius: "12px",
									color: "var(--text-primary)",
									fontSize: "1rem",
									outline: "none",
									transition: "border-color 0.2s",
								}}
								onFocus={(e) => {
									e.target.style.borderColor = "var(--accent-primary)";
								}}
								onBlur={(e) => {
									e.target.style.borderColor = "var(--border-color)";
								}}
							/>
						</div>
						<div className="flex gap-2">
							<button
								className="btn btn-secondary"
								type="button"
								onClick={() =>
									setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
								}
								title={
									sortOrder === "asc"
										? "Sort Newest First"
										: "Sort Oldest First"
								}
							>
								{sortOrder === "asc" ? (
									<ArrowUpNarrowWide size={18} />
								) : (
									<ArrowDownWideNarrow size={18} />
								)}
								{sortOrder === "asc" ? "Oldest" : "Newest"}
							</button>
							<label
								className="btn btn-secondary"
								style={{ cursor: "pointer" }}
							>
								<input
									type="file"
									accept=".csv"
									style={{ display: "none" }}
									onChange={(e) =>
										e.target.files?.[0] && handleFileUpload(e.target.files[0])
									}
								/>
								<Upload size={18} />
								Upload
							</label>
							<button
								className="btn btn-secondary"
								type="button"
								onClick={clearLogs}
							>
								<Trash2 size={18} />
								Clear
							</button>
						</div>
					</div>

					<div
						style={{
							marginBottom: "1rem",
							color: "var(--text-tertiary)",
							fontSize: "0.875rem",
						}}
					>
						Showing {filteredLogs.length} of {logs.length} entries
					</div>

					<AnimatePresence mode="popLayout">
						{sortedLogs.map((log, index) => (
							<LogCard key={log.id || index} entry={log} index={index} />
						))}
					</AnimatePresence>
				</div>
			)}
		</div>
	);
}

export default App;
