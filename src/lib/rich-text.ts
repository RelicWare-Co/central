import type { JSONContent } from "@tiptap/react";

const EMPTY_DOCUMENT: JSONContent = {
	type: "doc",
	content: [{ type: "paragraph" }],
};

type PlainTextOptions = {
	collapseWhitespace?: boolean;
};

export function parseRichTextDocument(
	value?: JSONContent | string | null,
): JSONContent {
	if (!value) {
		return EMPTY_DOCUMENT;
	}

	if (typeof value !== "string") {
		return normalizeDocument(value);
	}

	const trimmedValue = value.trim();

	if (!trimmedValue) {
		return EMPTY_DOCUMENT;
	}

	if (trimmedValue.startsWith("{")) {
		try {
			const parsedValue = JSON.parse(trimmedValue) as JSONContent;

			if (parsedValue?.type === "doc") {
				return normalizeDocument(parsedValue);
			}
		} catch {
			// Legacy descriptions may still be plain text or HTML.
		}
	}

	return legacyTextToDocument(value);
}

export function serializeRichTextValue(
	value?: JSONContent | string | null,
): string {
	const document = parseRichTextDocument(value);

	if (isRichTextDocumentEmpty(document)) {
		return "";
	}

	return JSON.stringify(document);
}

export function isRichTextEmptyValue(value?: JSONContent | string | null) {
	return isRichTextDocumentEmpty(parseRichTextDocument(value));
}

export function getRichTextPreview(
	value?: JSONContent | string | null,
	fallback = "",
) {
	const plainText = getRichTextPlainText(value, {
		collapseWhitespace: true,
	});

	return plainText || fallback;
}

export function getRichTextPlainText(
	value?: JSONContent | string | null,
	options: PlainTextOptions = {},
) {
	const text = extractPlainText(parseRichTextDocument(value)).trim();

	if (!text) {
		return "";
	}

	if (options.collapseWhitespace === false) {
		return text;
	}

	return text.replace(/\s+/g, " ").trim();
}

function normalizeDocument(document: JSONContent): JSONContent {
	if (document.type !== "doc") {
		return EMPTY_DOCUMENT;
	}

	if (!Array.isArray(document.content) || document.content.length === 0) {
		return EMPTY_DOCUMENT;
	}

	return {
		...document,
		content: document.content.map((node) => normalizeNode(node)),
	};
}

function normalizeNode(node: JSONContent): JSONContent {
	if (!node?.type) {
		return { type: "paragraph" };
	}

	if (!Array.isArray(node.content) || node.content.length === 0) {
		return {
			...node,
			content: node.content,
		};
	}

	return {
		...node,
		content: node.content.map((childNode) => normalizeNode(childNode)),
	};
}

function legacyTextToDocument(value: string): JSONContent {
	const plainText = stripLegacyMarkup(value);

	if (!plainText) {
		return EMPTY_DOCUMENT;
	}

	const paragraphs = plainText
		.split(/\n{2,}/)
		.map((block) => block.trim())
		.filter(Boolean)
		.map<JSONContent>((block) => ({
			type: "paragraph",
			content: toParagraphContent(block),
		}));

	if (paragraphs.length === 0) {
		return EMPTY_DOCUMENT;
	}

	return {
		type: "doc",
		content: paragraphs,
	};
}

function toParagraphContent(block: string): JSONContent[] {
	const lines = block
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (lines.length === 0) {
		return [];
	}

	return lines.flatMap((line, index) => {
		const lineNodes: JSONContent[] = [];

		if (index > 0) {
			lineNodes.push({ type: "hardBreak" });
		}

		lineNodes.push({ type: "text", text: line });

		return lineNodes;
	});
}

function stripLegacyMarkup(value: string) {
	return value
		.replace(/\r\n?/g, "\n")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, "\n")
		.replace(/<li[^>]*>/gi, "• ")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&#39;/gi, "'")
		.replace(/&quot;/gi, '"')
		.trim();
}

function isRichTextDocumentEmpty(
	node: JSONContent | null | undefined,
): boolean {
	if (!node) {
		return true;
	}

	if (node.type === "text") {
		return !node.text?.trim();
	}

	if (!Array.isArray(node.content) || node.content.length === 0) {
		return true;
	}

	return node.content.every((childNode) => isRichTextDocumentEmpty(childNode));
}

function extractPlainText(node: JSONContent | null | undefined): string {
	if (!node) {
		return "";
	}

	if (node.type === "text") {
		return node.text ?? "";
	}

	if (node.type === "hardBreak") {
		return "\n";
	}

	const childText = (node.content ?? [])
		.map((childNode) => extractPlainText(childNode))
		.join("");

	if (
		node.type === "paragraph" ||
		node.type === "heading" ||
		node.type === "blockquote" ||
		node.type === "codeBlock" ||
		node.type === "listItem" ||
		node.type === "taskItem"
	) {
		return `${childText}\n`;
	}

	if (
		node.type === "bulletList" ||
		node.type === "orderedList" ||
		node.type === "taskList"
	) {
		return `${childText}\n`;
	}

	return childText;
}
