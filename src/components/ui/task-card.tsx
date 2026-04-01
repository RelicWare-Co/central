import { ArrowRight, User, Calendar, Warning, NoteBlank } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import { Button } from "./button";
import { Badge } from "./badge";
import { cn } from "#/lib/utils";
import { getRichTextPreview } from "#/lib/rich-text";
import type { TaskRecord, TaskStatus, TaskPriority } from "#/lib/tasks";

// Status palette with OKLCH colors
const statusPalette = {
	pending: {
		bar: "bg-[oklch(0.75_0.005_80)]",
		badge:
			"border-[oklch(0.87_0.05_85)] bg-[oklch(0.955_0.03_85)] text-[oklch(0.45_0.12_80)]",
		icon: "text-[oklch(0.60_0.14_72)]",
	},
	in_progress: {
		bar: "bg-[oklch(0.55_0.12_230)]",
		badge:
			"border-[oklch(0.85_0.04_230)] bg-[oklch(0.95_0.025_230)] text-[oklch(0.42_0.10_230)]",
		icon: "text-[oklch(0.55_0.12_230)]",
	},
	blocked: {
		bar: "bg-[oklch(0.50_0.155_15)]",
		badge:
			"border-[oklch(0.87_0.04_15)] bg-[oklch(0.955_0.02_15)] text-[oklch(0.42_0.13_18)]",
		icon: "text-[oklch(0.50_0.155_15)]",
	},
	completed: {
		bar: "bg-[oklch(0.50_0.13_148)]",
		badge:
			"border-[oklch(0.87_0.035_148)] bg-[oklch(0.955_0.02_148)] text-[oklch(0.40_0.10_148)]",
		icon: "text-[oklch(0.50_0.13_148)]",
	},
	canceled: {
		bar: "bg-[oklch(0.75_0.005_80)]",
		badge: "border-border bg-secondary text-muted-foreground",
		icon: "text-muted-foreground",
	},
} satisfies Record<TaskStatus, { bar: string; badge: string; icon: string }>;

// Priority palette
const priorityPalette = {
	high: {
		badge:
			"border-[oklch(0.87_0.04_15)] bg-[oklch(0.955_0.02_15)] text-[oklch(0.42_0.13_18)]",
		icon: "text-[oklch(0.50_0.155_15)]",
	},
	medium: {
		badge:
			"border-[oklch(0.87_0.05_85)] bg-[oklch(0.955_0.03_85)] text-[oklch(0.45_0.12_80)]",
		icon: "text-[oklch(0.60_0.14_72)]",
	},
	low: {
		badge: "border-border bg-secondary text-muted-foreground",
		icon: "text-muted-foreground",
	},
} satisfies Record<TaskPriority, { badge: string; icon: string }>;

// Card container variants
const cardVariants = cva(
	"group relative flex items-stretch overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
	{
		variants: {
			variant: {
				default:
					"rounded-xl border border-border bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-border/80",
				compact:
					"rounded-lg border border-border bg-card hover:bg-secondary/30",
				featured:
					"rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]",
			},
			size: {
				sm: "p-3 gap-3",
				md: "p-4 gap-4",
				lg: "p-5 gap-5",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "md",
		},
	}
);

interface TaskCardProps {
	task: TaskRecord;
	variant?: "default" | "compact" | "featured";
	size?: "sm" | "md" | "lg";
	className?: string;
	index?: number;
	renderActions?: (task: TaskRecord) => React.ReactNode;
}

export function TaskCard({
	task,
	variant = "default",
	size = "md",
	className,
	index = 0,
	renderActions,
}: TaskCardProps) {
	const statusColors = statusPalette[task.status];
	const priorityColors = priorityPalette[task.priority];
	const assignee = task.expand?.assignee;
	const createdBy = task.expand?.createdBy;
	const project = task.expand?.project;

	const assigneeLabel = assignee
		? assignee.name || assignee.email || assignee.username || "Assigned"
		: "Unassigned";

	const createdByLabel = createdBy
		? createdBy.name || createdBy.email || createdBy.username || "Unknown"
		: "Unknown";

	const scopeLabel = project
		? `${project.slug} · ${project.name}`
		: "Inbox";

	// Format deadline
	const deadlineLabel = task.dueDate
		? new Date(task.dueDate).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year:
					new Date(task.dueDate).getFullYear() !== new Date().getFullYear()
						? "numeric"
						: undefined,
		  })
		: "No deadline";

	// Check if deadline is approaching (within 7 days)
	const isDeadlineApproaching = task.dueDate
		? new Date(task.dueDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 &&
		  new Date(task.dueDate).getTime() > Date.now()
		: false;

	// Check if deadline is overdue
	const isDeadlineOverdue = task.dueDate
		? new Date(task.dueDate).getTime() < Date.now() &&
		  task.status !== "completed" &&
		  task.status !== "canceled"
		: false;

	// Determine accent bar color - priority takes precedence for pending/high tasks
	const getAccentBarClass = () => {
		if (task.status === "blocked") return statusPalette.blocked.bar;
		if (task.status === "completed") return statusPalette.completed.bar;
		if (task.status === "canceled") return statusPalette.canceled.bar;
		if (task.priority === "high") return "bg-[oklch(0.50_0.155_15)]";
		if (task.status === "in_progress") return statusPalette.in_progress.bar;
		return "bg-border";
	};

	const accentBarClass = getAccentBarClass();

	return (
		<article
			className={cn(cardVariants({ variant, size }), className)}
			style={
				{
					"--index": index,
					animationDelay: `${index * 80}ms`,
				} as React.CSSProperties
			}
		>
			{/* Status Accent Bar */}
			<div
				className={cn(
					"absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300",
					accentBarClass,
					"group-hover:w-[4px]"
				)}
			/>

			{/* Main Content Area */}
			<div className="flex flex-1 items-center gap-4 min-w-0 pl-[3px]">
				{/* Task Identity - Icon + Title */}
				<div className="flex items-center gap-3 min-w-0 flex-1">
					{/* Task Icon */}
					<div
						className={cn(
							"flex-shrink-0 rounded-lg border border-border/50 bg-secondary/50 flex items-center justify-center transition-colors duration-200",
							size === "sm"
								? "w-8 h-8"
								: size === "md"
									? "w-10 h-10"
									: "w-12 h-12",
							statusColors.icon
						)}
					>
					<NoteBlank
						className={cn(
							size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6",
							"opacity-70"
						)}
						weight="duotone"
					/>
					</div>

					{/* Task Info */}
					<div className="min-w-0 flex-1">
						{/* Scope Label - Project or Inbox */}
						<p className="text-[11px] uppercase tracking-[0.08em] font-medium text-muted-foreground/70 leading-none">
							{scopeLabel}
						</p>

						{/* Task Title */}
						<h3
							className={cn(
								"font-semibold tracking-[-0.01em] text-foreground truncate mt-0.5",
								size === "sm"
									? "text-sm"
									: size === "md"
										? "text-[15px]"
										: "text-base"
							)}
						>
							{task.title}
						</h3>

						{/* Description - Only for larger sizes */}
						{size !== "sm" && task.description && (
							<p className="text-xs text-muted-foreground/80 mt-1 line-clamp-1">
								{getRichTextPreview(task.description, "No description yet.")}
							</p>
						)}

						{/* Blocked Reason */}
						{task.status === "blocked" && task.blockedReason && (
							<p className="text-xs text-destructive mt-1 flex items-center gap-1">
								<Warning className="w-3 h-3" weight="fill" />
								<span className="truncate">{task.blockedReason}</span>
							</p>
						)}
					</div>
				</div>

				{/* Badges - Priority & Status */}
				<div className="flex flex-col gap-1.5 flex-shrink-0">
					<Badge
						variant="outline"
						className={cn(
							priorityColors.badge,
							"text-[10px] tracking-[0.06em] font-semibold px-2.5 py-0.5 uppercase"
						)}
					>
						{task.priority}
					</Badge>
					<Badge
						variant="outline"
						className={cn(
							statusColors.badge,
							"text-[10px] tracking-[0.06em] font-semibold px-2.5 py-0.5"
						)}
					>
						{task.status.replace("_", " ")}
					</Badge>
				</div>

				{/* Metadata Row - Assignee & Deadline */}
				{size !== "sm" && (
					<div className="hidden md:flex items-center gap-6 flex-shrink-0">
						{/* Assignee */}
						<div className="flex items-center gap-2 min-w-[140px]">
							<div className="w-6 h-6 rounded-full bg-secondary border border-border/50 flex items-center justify-center flex-shrink-0">
								<User className="w-3.5 h-3.5 text-muted-foreground/60" weight="fill" />
							</div>
							<div className="min-w-0">
								<p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground/60 leading-none">
									Assignee
								</p>
								<p className="text-xs font-medium text-foreground truncate mt-0.5">
									{assigneeLabel}
								</p>
								{createdBy && createdBy.id !== assignee?.id && (
									<p className="text-[10px] text-muted-foreground/50 truncate">
										by {createdByLabel}
									</p>
								)}
							</div>
						</div>

						{/* Deadline */}
						<div className="flex items-center gap-2 min-w-[100px]">
							<div
								className={cn(
									"w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border",
									isDeadlineOverdue
										? "bg-[oklch(0.955_0.02_15)] border-[oklch(0.87_0.04_15)]"
										: isDeadlineApproaching
											? "bg-[oklch(0.955_0.03_85)] border-[oklch(0.87_0.05_85)]"
											: "bg-secondary border-border/50"
								)}
							>
								<Calendar
									className={cn(
										"w-3.5 h-3.5",
										isDeadlineOverdue
											? "text-[oklch(0.42_0.13_18)]"
											: isDeadlineApproaching
												? "text-[oklch(0.45_0.12_80)]"
												: "text-muted-foreground/60"
									)}
									weight="duotone"
								/>
							</div>
							<div className="min-w-0">
								<p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground/60 leading-none">
									Deadline
								</p>
								<p
									className={cn(
										"text-xs font-medium tabular-nums truncate mt-0.5",
										isDeadlineOverdue
											? "text-[oklch(0.42_0.13_18)]"
											: isDeadlineApproaching
												? "text-[oklch(0.45_0.12_80)]"
												: "text-foreground"
									)}
								>
									{deadlineLabel}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Action Button */}
				<div className="flex-shrink-0">
					{renderActions ? (
						renderActions(task)
					) : (
						<Button
							asChild
							variant="outline"
							size={size === "sm" ? "sm" : "default"}
							className={cn(
								"group/btn relative overflow-hidden rounded-lg border-border bg-background hover:bg-secondary/80 hover:border-border/60 transition-all duration-200",
								size === "sm" ? "h-8 px-2.5" : "h-9 px-3.5",
								"active:scale-[0.98] active:translate-y-[1px]"
							)}
						>
							<Link
								params={{ taskId: task.id }}
								to="/app/tasks/$taskId"
								className="flex items-center gap-1.5"
							>
								<span className="text-xs font-medium">Edit</span>
								<div className="relative w-4 h-4 overflow-hidden">
									<ArrowRight
										className="w-4 h-4 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-5"
										weight="bold"
									/>
									<ArrowRight
										className="w-4 h-4 absolute left-0 top-0 -translate-x-5 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-0"
										weight="bold"
									/>
								</div>
							</Link>
						</Button>
					)}
				</div>
			</div>
		</article>
	);
}

// Simple list item variant for very compact displays
export function TaskListItem({
	task,
	className,
}: {
	task: TaskRecord;
	className?: string;
}) {
	const statusColors = statusPalette[task.status];
	const priorityColors = priorityPalette[task.priority];

	return (
		<article
			className={cn(
				"group flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors duration-150 hover:bg-secondary/40",
				className
			)}
		>
			{/* Priority + Status Dots */}
			<div className="flex flex-col gap-0.5 flex-shrink-0">
				<div className={cn("w-2 h-2 rounded-full", priorityColors.icon)} />
				<div className={cn("w-2 h-2 rounded-full", statusColors.bar)} />
			</div>

			{/* Name */}
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-foreground truncate">{task.title}</p>
				<p className="text-xs text-muted-foreground/60 truncate">
					{task.expand?.project?.slug || "Inbox"}
				</p>
			</div>

			{/* Status */}
			<Badge
				variant="outline"
				className={cn(statusColors.badge, "text-[10px] tracking-wide flex-shrink-0")}
			>
				{task.status.replace("_", " ")}
			</Badge>
		</article>
	);
}
