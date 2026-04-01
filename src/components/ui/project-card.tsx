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

	// Check if deadline is approaching (within 7 days)
	const isDeadlineApproaching = project.dueDate
		? new Date(project.dueDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 &&
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
			<div className="flex flex-1 items-center gap-4 min-w-0 pl-[3px]">
				{/* Project Identity - Icon + Name */}
				<div className="flex items-center gap-3 min-w-0 flex-1">
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

				{/* Status Badge */}
				<div className="flex-shrink-0">
					<Badge
						variant="outline"
						className={cn(
							statusColors.badge,
							"text-[10px] tracking-[0.06em] font-semibold px-2.5 py-0.5"
						)}
					>
						{project.status}
					</Badge>
				</div>

				{/* Metadata Row - Owner & Deadline */}
				{size !== "sm" && (
					<div className="hidden md:flex items-center gap-6 flex-shrink-0">
						{/* Owner */}
						<div className="flex items-center gap-2 min-w-[140px]">
							<div className="w-6 h-6 rounded-full bg-secondary border border-border/50 flex items-center justify-center flex-shrink-0">
								<User className="w-3.5 h-3.5 text-muted-foreground/60" weight="fill" />
							</div>
							<div className="min-w-0">
								<p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground/60 leading-none">
									Owner
								</p>
								<p className="text-xs font-medium text-foreground truncate mt-0.5">
									{ownerLabel}
								</p>
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
							params={{ projectId: project.id }}
							to="/app/projects/$projectId"
							className="flex items-center gap-1.5"
						>
							<span className="text-xs font-medium">Open</span>
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
