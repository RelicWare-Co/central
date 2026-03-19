import type { JSONContent } from "@tiptap/react";
import type { ReactNode } from "react";
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
			return <p key={key}>{renderChildren(node, key)}</p>;
		case "heading": {
			const level = node.attrs?.level;

			if (level === 2) {
				return <h2 key={key}>{renderChildren(node, key)}</h2>;
			}

			if (level === 3) {
				return <h3 key={key}>{renderChildren(node, key)}</h3>;
			}

			return <h4 key={key}>{renderChildren(node, key)}</h4>;
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
			default:
				return <span key={markKey}>{content}</span>;
		}
	}, text);
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
