import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DividerNodeView } from "./divider-node-view";

export const DividerExtension = Node.create({
	name: "divider",
	group: "block",
	atom: true,
	draggable: true,

	parseHTML() {
		return [{ tag: 'div[data-type="divider"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["div", mergeAttributes(HTMLAttributes, { "data-type": "divider" })];
	},

	addNodeView() {
		return ReactNodeViewRenderer(DividerNodeView);
	},
});
