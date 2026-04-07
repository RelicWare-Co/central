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

	const deadlineApproachingMs = 7 * 24 * 60 * 60 * 1000;

	// Check if deadline is approaching (within 7 days)
	const isDeadlineApproaching = task.dueDate
		? new Date(task.dueDate).getTime() - Date.now() < deadlineApproachingMs &&
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
			<div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center gap-3 sm:gap-4 min-w-0 pl-[3px] py-1 sm:py-0">
				{/* Task Identity - Icon + Title */}
				<div className="flex items-center gap-3 min-w-0 flex-1 w-full sm:w-auto">
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
						aria-label="Task"
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
								<Warning className="w-3 h-3" weight="fill" aria-label="Blocked" />
								<span className="truncate">{task.blockedReason}</span>
							</p>
						)}
					</div>
				</div>

				<div className="mt-2 flex w-full min-w-0 flex-col gap-3 sm:mt-0 sm:w-auto sm:flex-1 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
					<div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:flex-nowrap sm:items-end">
						<Badge
							variant="outline"
							className={cn(
								priorityColors.badge,
								"text-[10px] font-semibold uppercase tracking-[0.06em] px-2.5 py-0.5",
							)}
						>
							{task.priority}
						</Badge>
						<Badge
							variant="outline"
							className={cn(
								statusColors.badge,
								"text-[10px] font-semibold tracking-[0.06em] px-2.5 py-0.5",
							)}
						>
							{task.status.replace("_", " ")}
						</Badge>
					</div>

					{size !== "sm" ? (
						<div className="flex w-full min-w-0 flex-wrap items-start gap-x-6 gap-y-2 sm:w-auto sm:flex-nowrap sm:justify-end">
							<div className="flex min-w-0 max-w-full flex-1 items-center gap-2 sm:min-w-[120px] sm:flex-initial sm:max-w-none md:min-w-[140px]">
								<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/50 bg-secondary">
									<User
										className="h-3.5 w-3.5 text-muted-foreground/60"
										weight="fill"
										aria-label="Assignee"
									/>
								</div>
								<div className="min-w-0">
									<p className="text-[10px] uppercase leading-none tracking-[0.05em] text-muted-foreground/60">
										Assignee
									</p>
									<p className="mt-0.5 truncate text-xs font-medium text-foreground">
										{assigneeLabel}
									</p>
									{createdBy && createdBy.id !== assignee?.id ? (
										<p className="truncate text-[10px] text-muted-foreground/50">
											by {createdByLabel}
										</p>
									) : null}
								</div>
							</div>

							<div className="flex min-w-0 max-w-full flex-1 items-center gap-2 sm:min-w-[100px] sm:flex-initial sm:max-w-none">
								<div
									className={cn(
										"flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
										isDeadlineOverdue
											? "border-[oklch(0.87_0.04_15)] bg-[oklch(0.955_0.02_15)]"
											: isDeadlineApproaching
												? "border-[oklch(0.87_0.05_85)] bg-[oklch(0.955_0.03_85)]"
												: "border-border/50 bg-secondary",
									)}
								>
									<Calendar
										className={cn(
											"h-3.5 w-3.5",
											isDeadlineOverdue
												? "text-[oklch(0.42_0.13_18)]"
												: isDeadlineApproaching
													? "text-[oklch(0.45_0.12_80)]"
													: "text-muted-foreground/60",
										)}
										weight="duotone"
										aria-label="Deadline"
									/>
								</div>
								<div className="min-w-0">
									<p className="text-[10px] uppercase leading-none tracking-[0.05em] text-muted-foreground/60">
										Deadline
									</p>
									<p
										className={cn(
											"mt-0.5 truncate text-xs font-medium tabular-nums",
											isDeadlineOverdue
												? "text-[oklch(0.42_0.13_18)]"
												: isDeadlineApproaching
													? "text-[oklch(0.45_0.12_80)]"
													: "text-foreground",
										)}
									>
										{deadlineLabel}
									</p>
								</div>
							</div>
						</div>
					) : null}

					<div className="w-full shrink-0 sm:w-auto">
						{renderActions ? (
							<div className="[&_a]:w-full [&_a]:justify-center [&_button]:w-full sm:[&_a]:w-auto sm:[&_button]:w-auto">
								{renderActions(task)}
							</div>
						) : (
							<Button
								asChild
								variant="outline"
								size={size === "sm" ? "sm" : "default"}
								className={cn(
									"group/btn relative w-full overflow-hidden rounded-lg border-border bg-background transition-all duration-200 hover:border-border/60 hover:bg-secondary/80 sm:w-auto",
									size === "sm" ? "h-8 px-2.5" : "h-9 px-3.5",
									"active:translate-y-[1px] active:scale-[0.98]",
								)}
							>
								<Link
									params={{ taskId: task.id }}
									to="/app/tasks/$taskId"
									className="flex items-center justify-center gap-1.5 sm:justify-start"
								>
									<span className="text-xs font-medium">Edit</span>
									<div className="relative h-4 w-4 overflow-hidden">
										<ArrowRight
											className="h-4 w-4 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-5"
											weight="bold"
										/>
										<ArrowRight
											className="absolute left-0 top-0 h-4 w-4 -translate-x-5 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-0"
											weight="bold"
										/>
									</div>
								</Link>
							</Button>
						)}
					</div>
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
