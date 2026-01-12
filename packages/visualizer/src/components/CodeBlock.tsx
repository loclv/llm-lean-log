import { Highlight, themes } from "prism-react-renderer";
import type React from "react";

interface CodeBlockProps {
	code: string;
	language: string;
}

/**
 * Renders a code block with syntax highlighting using prism-react-renderer.
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
	return (
		<Highlight theme={themes.vsDark} code={code} language={language}>
			{({ className, style, tokens, getLineProps, getTokenProps }) => (
				<pre
					className={`${className} glass`}
					style={{
						...style,
						padding: "1rem",
						borderRadius: "8px",
						overflowX: "auto",
						fontSize: "0.85rem",
					}}
				>
					{tokens.map((line, i) => (
						<div key={i} {...getLineProps({ line })}>
							{line.map((token, key) => (
								<span key={key} {...getTokenProps({ token })} />
							))}
						</div>
					))}
				</pre>
			)}
		</Highlight>
	);
};
