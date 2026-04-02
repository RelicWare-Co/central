import type { JSONContent } from "@tiptap/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CSSProperties, ReactNode } from "react";
import { isRichTextEmptyValue, parseRichTextDocument } from "#/lib/rich-text";
import { cn } from "#/lib/utils";

type RichTextContentProps = {
	className?: string;
	fallback?: ReactNode;
	value?: string | null;
};

export function RichTextContent({
	className,
	fallback = null,
	value,
}: RichTextContentProps) {
	if (isRichTextEmptyValue(value)) {
		return <>{fallback}</>;
	}

	const document = parseRichTextDocument(value);

	return (
		<div className={cn("central-rich-text", className)}>
			{renderNodes(document.content ?? [], "root")}
		</div>
	);
}

function renderNodes(nodes: JSONContent[], keyPrefix: string): ReactNode[] {
	return nodes
		.map((node, index) => renderNode(node, `${keyPrefix}-${index}`))
		.filter((node): node is ReactNode => node !== null);
}

function renderNode(node: JSONContent, key: string): ReactNode | null {
	switch (node.type) {
		case "paragraph":
			return (
				<p key={key} style={getTextAlignStyle(node)}>
					{renderChildren(node, key)}
				</p>
			);
		case "heading": {
			const level = node.attrs?.level;

			if (level === 1) {
				return (
					<h1 key={key} style={getTextAlignStyle(node)}>
						{renderChildren(node, key)}
					</h1>
				);
			}

			if (level === 2) {
				return (
					<h2 key={key} style={getTextAlignStyle(node)}>
						{renderChildren(node, key)}
					</h2>
				);
			}

			if (level === 3) {
				return (
					<h3 key={key} style={getTextAlignStyle(node)}>
						{renderChildren(node, key)}
					</h3>
				);
			}

			return (
				<h4 key={key} style={getTextAlignStyle(node)}>
					{renderChildren(node, key)}
				</h4>
			);
		}
		case "bulletList":
			return <ul key={key}>{renderChildren(node, key)}</ul>;
		case "orderedList":
			return <ol key={key}>{renderChildren(node, key)}</ol>;
		case "taskList":
			return (
				<ul key={key} data-task-list="true">
					{renderChildren(node, key)}
				</ul>
			);
		case "listItem":
			return <li key={key}>{renderChildren(node, key)}</li>;
		case "taskItem":
			return (
				<li key={key} data-task-item="true">
					<label>
						<input
							checked={Boolean(node.attrs?.checked)}
							disabled
							readOnly
							type="checkbox"
						/>
						<span />
					</label>
					<div>{renderChildren(node, key)}</div>
				</li>
			);
		case "enhancedTaskItem":
			return (
				<li
					key={key}
					data-type="enhancedTaskItem"
					data-checked={node.attrs?.checked ? "true" : "false"}
				>
					<div>{renderChildren(node, key)}</div>
					{typeof node.attrs?.dueDate === "string" ? (
						<div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
							{formatDueDate(node.attrs.dueDate)}
						</div>
					) : null}
				</li>
			);
		case "blockquote":
			return <blockquote key={key}>{renderChildren(node, key)}</blockquote>;
		case "codeBlock":
			return (
				<pre key={key}>
					<code>{getTextContent(node)}</code>
				</pre>
			);
		case "horizontalRule":
			return <hr key={key} />;
		case "image":
			return (
				<img
					key={key}
					src={typeof node.attrs?.src === "string" ? node.attrs.src : ""}
					alt={typeof node.attrs?.alt === "string" ? node.attrs.alt : ""}
					title={typeof node.attrs?.title === "string" ? node.attrs.title : ""}
				/>
			);
		case "table":
			return (
				<table key={key}>
					<tbody>{renderChildren(node, key)}</tbody>
				</table>
			);
		case "tableRow":
			return <tr key={key}>{renderChildren(node, key)}</tr>;
		case "tableHeader":
			return <th key={key}>{renderChildren(node, key)}</th>;
		case "tableCell":
			return <td key={key}>{renderChildren(node, key)}</td>;
		case "callout":
			return (
				<div
					key={key}
					data-type="callout"
					data-callout-type={
						typeof node.attrs?.type === "string" ? node.attrs.type : "info"
					}
				>
					{renderChildren(node, key)}
				</div>
			);
		case "divider":
			return (
				<div key={key} data-type="divider">
					<div />
				</div>
			);
		case "hardBreak":
			return <br key={key} />;
		case "text":
			return applyMarks(node.text ?? "", node.marks ?? [], key);
		default:
			return node.content ? (
				<div key={key}>{renderChildren(node, key)}</div>
			) : null;
	}
}

function renderChildren(node: JSONContent, key: string) {
	return renderNodes(node.content ?? [], `${key}-child`);
}

function applyMarks(
	text: string,
	marks: Array<{ attrs?: Record<string, unknown>; type: string }>,
	key: string,
) {
	return marks.reduceRight<ReactNode>((content, mark, index) => {
		const markKey = `${key}-mark-${index}`;

		switch (mark.type) {
			case "bold":
				return <strong key={markKey}>{content}</strong>;
			case "italic":
				return <em key={markKey}>{content}</em>;
			case "strike":
				return <s key={markKey}>{content}</s>;
			case "code":
				return <code key={markKey}>{content}</code>;
			case "link":
				return (
					<a
						key={markKey}
						href={typeof mark.attrs?.href === "string" ? mark.attrs.href : "#"}
						rel="noreferrer"
						target="_blank"
					>
						{content}
					</a>
				);
			case "underline":
				return <u key={markKey}>{content}</u>;
			case "highlight":
				return <mark key={markKey}>{content}</mark>;
			case "subscript":
				return <sub key={markKey}>{content}</sub>;
			case "superscript":
				return <sup key={markKey}>{content}</sup>;
			default:
				return <span key={markKey}>{content}</span>;
		}
	}, text);
}

function getTextAlignStyle(node: JSONContent): CSSProperties | undefined {
	const textAlign = node.attrs?.textAlign;

	if (
		textAlign === "left" ||
		textAlign === "center" ||
		textAlign === "right" ||
		textAlign === "justify"
	) {
		return { textAlign };
	}

	return undefined;
}

function formatDueDate(value: string) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return format(date, "d MMM", { locale: es });
}

function getTextContent(node: JSONContent): string {
	if (node.type === "text") {
		return node.text ?? "";
	}

	if (node.type === "hardBreak") {
		return "\n";
	}

	return (node.content ?? [])
		.map((childNode) => getTextContent(childNode))
		.join("");
}
