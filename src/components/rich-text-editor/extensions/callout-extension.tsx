import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CalloutNodeView } from "./callout-node-view";

export const CalloutExtension = Node.create({
	name: "callout",
	group: "block",
	content: "inline*",
	draggable: true,

	addAttributes() {
		return {
			type: {
				default: "info",
				parseHTML: (element) =>
					element.getAttribute("data-callout-type") || "info",
				renderHTML: (attributes) => ({
					"data-callout-type": attributes.type,
				}),
			},
		};
	},

	parseHTML() {
		return [{ tag: 'div[data-type="callout"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"div",
			mergeAttributes(HTMLAttributes, { "data-type": "callout" }),
			0,
		];
	},

	addNodeView() {
		return ReactNodeViewRenderer(CalloutNodeView);
	},
});
