import { CalendarBlank, Check } from "@phosphor-icons/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "#/lib/utils";

export function EnhancedTaskItemNodeView(props: ReactNodeViewProps) {
	const { checked, dueDate } = props.node.attrs;
	const today = new Date();
	const due = dueDate ? new Date(dueDate) : null;
	const isOverdue =
		due &&
		!checked &&
		due < new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const isToday =
		due && !checked && due.toDateString() === today.toDateString();

	const formatDate = (date: Date) => {
		return format(date, "d MMM", { locale: es });
	};

	return (
		<NodeViewWrapper
			data-slot="enhanced-task-item"
			className={cn(
				"relative flex items-start gap-2 py-1",
				checked && "opacity-60",
			)}
		>
			<button
				contentEditable={false}
				type="button"
				className={cn(
					"mt-0.5 shrink-0 size-4 rounded border flex items-center justify-center transition-colors",
					checked
						? "bg-primary border-primary text-primary-foreground"
						: isOverdue
							? "border-red-400 hover:border-red-500"
							: "border-muted-foreground/40 hover:border-muted-foreground/70",
				)}
				onClick={() => {
					props.updateAttributes({ checked: !checked });
				}}
			>
				{checked && <Check className="size-2.5" weight="bold" />}
			</button>

			<div className="flex-1 min-w-0">
				<NodeViewContent className="outline-none" />

				{dueDate && (
					<div
						contentEditable={false}
						className={cn(
							"mt-1 inline-flex items-center gap-1 text-[0.65rem] uppercase tracking-wide px-1.5 py-0.5 rounded",
							isOverdue
								? "bg-red-100 text-red-700"
								: isToday
									? "bg-blue-100 text-blue-700"
									: "bg-muted text-muted-foreground",
						)}
					>
						<CalendarBlank className="size-3" weight="fill" />
						<span>{due && formatDate(due)}</span>
					</div>
				)}
			</div>
		</NodeViewWrapper>
	);
}
