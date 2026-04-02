import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { EnhancedTaskItemNodeView } from "./enhanced-task-item-node-view";

export const EnhancedTaskItemExtension = Node.create({
	name: "enhancedTaskItem",
	group: "listItem",
	content: "paragraph block*",
	defining: true,

	addAttributes() {
		return {
			checked: {
				default: false,
				parseHTML: (element) => element.getAttribute("data-checked") === "true",
				renderHTML: (attributes) => ({
					"data-checked": attributes.checked ? "true" : "false",
				}),
			},
			dueDate: {
				default: null as string | null,
				parseHTML: (element) => element.getAttribute("data-due-date"),
				renderHTML: (attributes) =>
					attributes.dueDate ? { "data-due-date": attributes.dueDate } : {},
			},
		};
	},

	parseHTML() {
		return [{ tag: 'li[data-type="enhancedTaskItem"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"li",
			{
				...HTMLAttributes,
				"data-type": "enhancedTaskItem",
			},
			0,
		];
	},

	addKeyboardShortcuts() {
		return {
			Enter: () => this.editor.commands.splitListItem("enhancedTaskItem"),
			Tab: () => this.editor.commands.sinkListItem("enhancedTaskItem"),
			"Shift-Tab": () => this.editor.commands.liftListItem("enhancedTaskItem"),
		};
	},

	addNodeView() {
		return ReactNodeViewRenderer(EnhancedTaskItemNodeView);
	},
});
