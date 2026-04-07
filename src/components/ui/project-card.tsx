import { ArrowRight, Folder, User, Calendar } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import { Button } from "./button";
import { Badge } from "./badge";
import { cn } from "#/lib/utils";
import { getRichTextPreview } from "#/lib/rich-text";
import type { ProjectRecord, ProjectStatus } from "#/lib/projects";

// Status palette with OKLCH colors for perceptual uniformity
const statusPalette = {
	active: {
		bar: "bg-[oklch(0.55_0.12_230)]",
		badge:
			"border-[oklch(0.85_0.04_230)] bg-[oklch(0.95_0.025_230)] text-[oklch(0.42_0.10_230)]",
		icon: "text-[oklch(0.55_0.12_230)]",
	},
	paused: {
		bar: "bg-[oklch(0.60_0.14_72)]",
		badge:
			"border-[oklch(0.87_0.05_85)] bg-[oklch(0.955_0.03_85)] text-[oklch(0.45_0.12_80)]",
		icon: "text-[oklch(0.60_0.14_72)]",
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
	archived: {
		bar: "bg-[oklch(0.75_0.005_80)]",
		badge:
			"border-border bg-secondary text-muted-foreground",
		icon: "text-muted-foreground",
	},
} satisfies Record<ProjectStatus, { bar: string; badge: string; icon: string }>;

// Card container variants for different sizes/contexts
const cardVariants = cva(
	"group relative flex items-stretch overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
	{
		variants: {
			variant: {
				// Full featured card for list views
				default:
					"rounded-xl border border-border bg-card hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-border/80",
				// Compact for dense lists
				compact:
					"rounded-lg border border-border bg-card hover:bg-secondary/30",
				// Featured/emphasized variant
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

interface ProjectCardProps {
	project: ProjectRecord;
	variant?: "default" | "compact" | "featured";
	size?: "sm" | "md" | "lg";
	className?: string;
	index?: number;
}

export function ProjectCard({
	project,
	variant = "default",
	size = "md",
	className,
	index = 0,
}: ProjectCardProps) {
	const statusColors = statusPalette[project.status];
	const owner = project.expand?.owner;
	const ownerLabel = owner
		? owner.name || owner.email || owner.username || "Assigned"
		: "Unassigned";

	// Format deadline
	const deadlineLabel = project.dueDate
		? new Date(project.dueDate).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year:
					new Date(project.dueDate).getFullYear() !== new Date().getFullYear()
						? "numeric"
						: undefined,
		  })
		: "No deadline";

	const deadlineApproachingMs = 7 * 24 * 60 * 60 * 1000;

	// Check if deadline is approaching (within 7 days)
	const isDeadlineApproaching = project.dueDate
		? new Date(project.dueDate).getTime() - Date.now() < deadlineApproachingMs &&
		  new Date(project.dueDate).getTime() > Date.now()
		: false;

	// Check if deadline is overdue
	const isDeadlineOverdue = project.dueDate
		? new Date(project.dueDate).getTime() < Date.now() &&
		  project.status !== "completed" &&
		  project.status !== "archived"
		: false;

	return (
		<article
			className={cn(
				cardVariants({ variant, size }),
				className
			)}
			style={
				{
					"--index": index,
					animationDelay: `${index * 80}ms`,
				} as React.CSSProperties
			}
		>
			{/* Status Accent Bar - Left side indicator */}
			<div
				className={cn(
					"absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300",
					statusColors.bar,
					"group-hover:w-[4px]"
				)}
			/>

			{/* Main Content Area */}
			<div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center gap-3 sm:gap-4 min-w-0 pl-[3px] py-1 sm:py-0">
				{/* Project Identity - Icon + Name */}
				<div className="flex items-center gap-3 min-w-0 flex-1 w-full sm:w-auto">
					{/* Project Icon/Avatar */}
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
						<Folder
							className={cn(
								size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6",
								"opacity-70"
							)}
							weight="duotone"
							aria-label="Project"
						/>
					</div>

					{/* Project Info */}
					<div className="min-w-0 flex-1">
						{/* Slug - Small eyebrow text */}
						<p className="text-[11px] uppercase tracking-[0.08em] font-medium text-muted-foreground/70 leading-none">
							{project.slug}
						</p>

						{/* Project Name */}
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
							<Link
								params={{ projectId: project.id }}
								to="/app/projects/$projectId"
								className="hover:text-muted-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 rounded"
							>
								{project.name}
							</Link>
						</h3>

						{/* Description - Only for larger sizes */}
						{size !== "sm" && project.description && (
							<p className="text-xs text-muted-foreground/80 mt-1 line-clamp-1">
								{getRichTextPreview(project.description, "No description yet.")}
							</p>
						)}
					</div>
				</div>

				<div className="mt-2 flex w-full min-w-0 flex-col gap-3 sm:mt-0 sm:w-auto sm:flex-1 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
					<div className="shrink-0">
						<Badge
							variant="outline"
							className={cn(
								statusColors.badge,
								"px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.06em]",
							)}
						>
							{project.status}
						</Badge>
					</div>

					{size !== "sm" ? (
						<div className="flex w-full min-w-0 flex-wrap items-start gap-x-6 gap-y-2 sm:w-auto sm:flex-nowrap sm:justify-end">
							<div className="flex min-w-0 max-w-full flex-1 items-center gap-2 sm:min-w-[120px] sm:flex-initial sm:max-w-none md:min-w-[140px]">
								<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/50 bg-secondary">
									<User
										className="h-3.5 w-3.5 text-muted-foreground/60"
										weight="fill"
										aria-label="Owner"
									/>
								</div>
								<div className="min-w-0">
									<p className="text-[10px] uppercase leading-none tracking-[0.05em] text-muted-foreground/60">
										Owner
									</p>
									<p className="mt-0.5 truncate text-xs font-medium text-foreground">
										{ownerLabel}
									</p>
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
								params={{ projectId: project.id }}
								to="/app/projects/$projectId"
								className="flex items-center justify-center gap-1.5 sm:justify-start"
							>
								<span className="text-xs font-medium">Open</span>
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
					</div>
				</div>
			</div>
		</article>
	);
}

// Simple list item variant for very compact displays
export function ProjectListItem({
	project,
	className,
}: {
	project: ProjectRecord;
	className?: string;
}) {
	const statusColors = statusPalette[project.status];

	return (
		<article
			className={cn(
				"group flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors duration-150 hover:bg-secondary/40",
				className
			)}
		>
			{/* Status Dot */}
			<div className={cn("w-2 h-2 rounded-full flex-shrink-0", statusColors.bar)} />

			{/* Name */}
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-foreground truncate">{project.name}</p>
				<p className="text-xs text-muted-foreground/60 truncate">{project.slug}</p>
			</div>

			{/* Status */}
			<Badge
				variant="outline"
				className={cn(statusColors.badge, "text-[10px] tracking-wide flex-shrink-0")}
			>
				{project.status}
			</Badge>
		</article>
	);
}
