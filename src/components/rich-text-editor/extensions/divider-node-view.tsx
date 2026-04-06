import type { ReactNodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";

export function DividerNodeView(props: ReactNodeViewProps) {
	return (
		<NodeViewWrapper
			data-slot="divider"
			data-drag-handle
			className="relative my-4 cursor-pointer group"
			onClick={() => {
				const pos = props.getPos();
				if (typeof pos === "number") {
					props.editor.commands.setNodeSelection(pos);
				}
			}}
		>
			<div
				contentEditable={false}
				className="flex items-center gap-2 text-muted-foreground/60"
			>
				<div className="size-1 rounded-full bg-muted-foreground/40" />
				<div className="h-px flex-1 bg-border group-hover:bg-border/80 transition-colors" />
				<div className="size-1 rounded-full bg-muted-foreground/40" />
			</div>
		</NodeViewWrapper>
	);
}
