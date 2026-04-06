import { CheckCircle, Info, Warning } from "@phosphor-icons/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { cn } from "#/lib/utils";

const calloutTypes = [
	{
		value: "info",
		icon: Info,
		color: "text-blue-600",
		bg: "bg-blue-50",
		border: "border-blue-200",
	},
	{
		value: "success",
		icon: CheckCircle,
		color: "text-green-600",
		bg: "bg-green-50",
		border: "border-green-200",
	},
	{
		value: "warning",
		icon: Warning,
		color: "text-amber-600",
		bg: "bg-amber-50",
		border: "border-amber-200",
	},
	{
		value: "error",
		icon: Warning,
		color: "text-red-600",
		bg: "bg-red-50",
		border: "border-red-200",
	},
] as const;

export function CalloutNodeView(props: ReactNodeViewProps) {
	const { type } = props.node.attrs;
	const calloutType =
		calloutTypes.find((t) => t.value === type) || calloutTypes[0];
	const Icon = calloutType.icon;

	return (
		<NodeViewWrapper
			data-slot="callout"
			className={cn(
				"relative my-3 rounded-lg border p-3",
				calloutType.bg,
				calloutType.border,
			)}
		>
			<div className="flex items-start gap-2">
				<Icon
					className={cn("mt-0.5 shrink-0 size-4", calloutType.color)}
					weight="fill"
				/>
				<div className="flex-1 min-w-0">
					<NodeViewContent className="text-sm text-foreground outline-none" />
				</div>
				{props.editor.isEditable && (
					<div contentEditable={false} className="flex items-center gap-1">
						<ToggleGroup
							type="single"
							value={type}
							size="sm"
							onValueChange={(value) => {
								if (value) {
									props.updateAttributes({ type: value });
								}
							}}
						>
							{calloutTypes.map((t) => (
								<ToggleGroupItem
									key={t.value}
									value={t.value}
									className="size-6 p-0"
									aria-label={t.value}
								>
									<t.icon className={cn("size-3", t.color)} weight="fill" />
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</div>
				)}
			</div>
		</NodeViewWrapper>
	);
}
