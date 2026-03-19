import { describe, expect, it } from "vitest";
import {
	getRichTextPlainText,
	getRichTextPreview,
	isRichTextEmptyValue,
	parseRichTextDocument,
	serializeRichTextValue,
} from "#/lib/rich-text";

describe("rich-text helpers", () => {
	it("parses legacy plain text into a tiptap document", () => {
		expect(parseRichTextDocument("Scope\n\nNext steps")).toEqual({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: "Scope" }],
				},
				{
					type: "paragraph",
					content: [{ type: "text", text: "Next steps" }],
				},
			],
		});
	});

	it("extracts previews from serialized content", () => {
		expect(
			getRichTextPreview(
				JSON.stringify({
					type: "doc",
					content: [
						{
							type: "heading",
							attrs: { level: 2 },
							content: [{ type: "text", text: "Rollout" }],
						},
						{
							type: "paragraph",
							content: [
								{ type: "text", text: "Ship" },
								{ type: "hardBreak" },
								{ type: "text", text: "Validate" },
							],
						},
					],
				}),
			),
		).toBe("Rollout Ship Validate");
	});

	it("treats empty documents as empty values", () => {
		expect(
			isRichTextEmptyValue(
				JSON.stringify({
					type: "doc",
					content: [{ type: "paragraph" }],
				}),
			),
		).toBe(true);
	});

	it("serializes non-empty legacy content", () => {
		expect(serializeRichTextValue("<p>Brief</p>")).toBe(
			JSON.stringify({
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Brief" }],
					},
				],
			}),
		);
	});

	it("preserves line breaks when needed", () => {
		expect(
			getRichTextPlainText("Line one\nLine two", {
				collapseWhitespace: false,
			}),
		).toBe("Line one\nLine two");
	});

	it("extracts text from checklist documents", () => {
		expect(
			getRichTextPreview(
				JSON.stringify({
					type: "doc",
					content: [
						{
							type: "taskList",
							content: [
								{
									type: "taskItem",
									attrs: { checked: true },
									content: [
										{
											type: "paragraph",
											content: [{ type: "text", text: "Ship editor" }],
										},
									],
								},
								{
									type: "taskItem",
									attrs: { checked: false },
									content: [
										{
											type: "paragraph",
											content: [{ type: "text", text: "Review details" }],
										},
									],
								},
							],
						},
					],
				}),
			),
		).toBe("Ship editor Review details");
	});
});
