import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { type ReactNode, useMemo, useState, useTransition } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import { formatDueDateLabel } from "#/lib/formatting";
import { getRichTextPreview } from "#/lib/rich-text";
import type {
	TaskCollectionData,
	TaskPriority,
	TaskRecord,
	TaskStatus,
} from "#/lib/tasks";
import { cn } from "#/lib/utils";

type FilterOption = {
	label: string;
	value: string;
};

type TaskFilterBarProps = {
	assigneeOptions: FilterOption[];
	assigneeValue: string;
	onAssigneeChange: (value: string) => void;
	onPriorityChange: (value: string) => void;
	onProjectChange: (value: string) => void;
	onSearchChange: (value: string) => void;
	onStatusChange: (value: string) => void;
	priorityOptions: FilterOption[];
	priorityValue: string;
	projectOptions: FilterOption[];
	projectValue: string;
	searchValue: string;
	statusOptions: FilterOption[];
	statusValue: string;
};

function TaskFilterBar({
	assigneeOptions,
	assigneeValue,
	onAssigneeChange,
	onPriorityChange,
	onProjectChange,
	onSearchChange,
	onStatusChange,
	priorityOptions,
	priorityValue,
	projectOptions,
	projectValue,
	searchValue,
	statusOptions,
	statusValue,
}: TaskFilterBarProps) {
	const hasActiveFilters =
		statusValue !== "all" ||
		priorityValue !== "all" ||
		projectValue !== "all" ||
		assigneeValue !== "all" ||
		searchValue !== "";

	const activeFilterCount = [
		statusValue !== "all",
		priorityValue !== "all",
		projectValue !== "all",
		assigneeValue !== "all",
		searchValue !== "",
	].filter(Boolean).length;

	function handleClearFilters() {
		onSearchChange("");
		onStatusChange("all");
		onPriorityChange("all");
		onProjectChange("all");
		onAssigneeChange("all");
	}

	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
			{/* Search Input */}
			<div className="relative min-w-0 flex-1">
				<MagnifyingGlassIcon
					className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden="true"
				/>
				<Input
					placeholder="Search tasks..."
					value={searchValue}
					onChange={(e) => onSearchChange(e.target.value)}
					className="h-10 w-full rounded-xl border-border bg-secondary/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground/60 focus-visible:bg-background"
				/>
			</div>

			<Separator orientation="vertical" className="hidden h-8 sm:block" />

			{/* Filter Dropdowns */}
			<div className="flex flex-wrap items-center gap-2">
				<Select value={statusValue} onValueChange={onStatusChange}>
					<SelectTrigger
						aria-label="Filter by status"
						className="h-10 w-auto min-w-[140px] gap-2 rounded-xl border-border bg-secondary/50 px-3 text-sm font-medium hover:bg-secondary data-[state=open]:bg-background"
					>
						<SelectValue placeholder="All statuses" />
					</SelectTrigger>
					<SelectContent position="popper" align="end">
						<SelectGroup>
							<SelectItem value="all">All statuses</SelectItem>
							{statusOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>

				<Select value={priorityValue} onValueChange={onPriorityChange}>
					<SelectTrigger
						aria-label="Filter by priority"
						className="h-10 w-auto min-w-[130px] gap-2 rounded-xl border-border bg-secondary/50 px-3 text-sm font-medium hover:bg-secondary data-[state=open]:bg-background"
					>
						<SelectValue placeholder="All priorities" />
					</SelectTrigger>
					<SelectContent position="popper" align="end">
						<SelectGroup>
							<SelectItem value="all">All priorities</SelectItem>
							{priorityOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>

				{projectOptions.length > 0 && (
					<Select value={projectValue} onValueChange={onProjectChange}>
						<SelectTrigger
							aria-label="Filter by project"
							className="h-10 w-auto min-w-[140px] gap-2 rounded-xl border-border bg-secondary/50 px-3 text-sm font-medium hover:bg-secondary data-[state=open]:bg-background"
						>
							<SelectValue placeholder="All projects" />
						</SelectTrigger>
						<SelectContent position="popper" align="end">
							<SelectGroup>
								<SelectItem value="all">All projects</SelectItem>
								{projectOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				)}

				{assigneeOptions.length > 0 && (
					<Select value={assigneeValue} onValueChange={onAssigneeChange}>
						<SelectTrigger
							aria-label="Filter by assignee"
							className="h-10 w-auto min-w-[150px] gap-2 rounded-xl border-border bg-secondary/50 px-3 text-sm font-medium hover:bg-secondary data-[state=open]:bg-background"
						>
							<SelectValue placeholder="All assignees" />
						</SelectTrigger>
						<SelectContent position="popper" align="end">
							<SelectGroup>
								<SelectItem value="all">All assignees</SelectItem>
								{assigneeOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				)}

				{hasActiveFilters && (
					<>
						<Separator
							orientation="vertical"
							className="mx-1 hidden h-6 sm:block"
						/>
						<Button
							onClick={handleClearFilters}
							variant="ghost"
							size="sm"
							className="h-10 gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
						>
							<XIcon data-icon="inline-start" className="size-4" />
							Clear
							{activeFilterCount > 0 && (
								<Badge
									variant="secondary"
									className="ml-1 h-5 min-w-5 px-1.5 text-xs"
								>
									{activeFilterCount}
								</Badge>
							)}
						</Button>
					</>
				)}
			</div>
		</div>
	);
}

type TaskCollectionViewProps = {
	description?: string;
	emptyDescription: string;
	emptyTitle: string;
	eyebrow: string;
	headerAction?: ReactNode;
	renderTaskActions?: (task: TaskRecord) => ReactNode;
	tasks: TaskRecord[];
	title: string;
	summary: TaskCollectionData["summary"];
};

const STATUS_OPTIONS: FilterOption[] = [
	{ value: "pending", label: "Pending" },
	{ value: "in_progress", label: "In Progress" },
	{ value: "blocked", label: "Blocked" },
	{ value: "completed", label: "Completed" },
	{ value: "canceled", label: "Canceled" },
];

const PRIORITY_OPTIONS: FilterOption[] = [
	{ value: "low", label: "Low" },
	{ value: "medium", label: "Medium" },
	{ value: "high", label: "High" },
];

export function TaskCollectionView({
	description,
	emptyDescription,
	emptyTitle,
	eyebrow,
	headerAction,
	renderTaskActions,
	summary,
	tasks,
	title,
}: TaskCollectionViewProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [priorityFilter, setPriorityFilter] = useState("all");
	const [assigneeFilter, setAssigneeFilter] = useState("all");
	const [projectFilter, setProjectFilter] = useState("all");
	const [isPending, startTransition] = useTransition();

	// Build filter options from task data
	const assigneeOptions = useMemo<FilterOption[]>(() => {
		const map = new Map<string, string>();
		for (const t of tasks) {
			if (t.expand?.assignee && t.assignee) {
				map.set(t.assignee, getUserLabel(t.expand.assignee));
			}
		}
		return Array.from(map.entries()).map(([value, label]) => ({
			value,
			label,
		}));
	}, [tasks]);

	const projectOptions = useMemo<FilterOption[]>(() => {
		const map = new Map<string, string>();
		for (const t of tasks) {
			if (t.expand?.project && t.project) {
				map.set(t.project, t.expand.project.name);
			}
		}
		return Array.from(map.entries()).map(([value, label]) => ({
			value,
			label,
		}));
	}, [tasks]);

	// Wrap non-urgent filter updates in startTransition
	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
	};

	const handleStatusChange = (value: string) => {
		startTransition(() => {
			setStatusFilter(value);
		});
	};

	const handlePriorityChange = (value: string) => {
		startTransition(() => {
			setPriorityFilter(value);
		});
	};

	const handleProjectChange = (value: string) => {
		startTransition(() => {
			setProjectFilter(value);
		});
	};

	const handleAssigneeChange = (value: string) => {
		startTransition(() => {
			setAssigneeFilter(value);
		});
	};

	// Filter tasks
	const filteredTasks = useMemo(() => {
		return tasks.filter((task) => {
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				if (
					!task.title.toLowerCase().includes(query) &&
					!task.description?.toLowerCase().includes(query)
				) {
					return false;
				}
			}
			if (statusFilter !== "all" && task.status !== statusFilter) return false;
			if (priorityFilter !== "all" && task.priority !== priorityFilter)
				return false;
			if (assigneeFilter !== "all" && task.assignee !== assigneeFilter)
				return false;
			if (projectFilter !== "all" && task.project !== projectFilter)
				return false;
			return true;
		});
	}, [
		tasks,
		searchQuery,
		statusFilter,
		priorityFilter,
		assigneeFilter,
		projectFilter,
	]);

	const showFilters = tasks.length > 0;
	const hasTasks = filteredTasks.length > 0;

	return (
		<section className="flex flex-col gap-6">
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
						{eyebrow}
					</p>
					<h3 className="mt-1.5 font-serif text-xl font-normal tracking-[-0.02em] text-foreground sm:text-2xl">
						{title}
					</h3>
					{description ? (
						<p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
							{description}
						</p>
					) : null}
				</div>
				{headerAction ? <div className="shrink-0">{headerAction}</div> : null}
			</div>

			{/* Summary Badges */}
			<div className="flex flex-wrap gap-2">
				<SummaryBadge label="Total" value={summary.total} variant="default" />
				<SummaryBadge
					label="In progress"
					value={summary.inProgress}
					variant="info"
				/>
				<SummaryBadge
					label="Blocked"
					value={summary.blocked}
					variant="danger"
				/>
				<SummaryBadge
					label="Due today"
					value={summary.dueToday}
					variant="warning"
				/>
				<SummaryBadge
					label="Overdue"
					value={summary.overdue}
					variant="danger"
				/>
			</div>

			{/* Filter Bar */}
			{showFilters && (
				<TaskFilterBar
					assigneeOptions={assigneeOptions}
					assigneeValue={assigneeFilter}
					onAssigneeChange={handleAssigneeChange}
					onPriorityChange={handlePriorityChange}
					onProjectChange={handleProjectChange}
					onSearchChange={handleSearchChange}
					onStatusChange={handleStatusChange}
					priorityOptions={PRIORITY_OPTIONS}
					priorityValue={priorityFilter}
					projectOptions={projectOptions}
					projectValue={projectFilter}
					searchValue={searchQuery}
					statusOptions={STATUS_OPTIONS}
					statusValue={statusFilter}
				/>
			)}

			{/* Results */}
			<div
				className={cn(
					"min-h-[200px]",
					isPending && "opacity-70 transition-opacity duration-200",
				)}
			>
				{!hasTasks ? (
					<Empty className="min-h-[200px]">
						<EmptyHeader>
							<EmptyTitle className="text-sm font-medium text-foreground">
								{emptyTitle}
							</EmptyTitle>
							<EmptyDescription className="max-w-md text-sm text-muted-foreground">
								{emptyDescription}
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<div className="flex flex-col rounded-xl border border-border bg-card">
						{filteredTasks.map((task, index) => (
							<article
								key={task.id}
								className={cn(
									"group relative px-4 py-4 transition-colors duration-150 hover:bg-secondary/50 sm:px-5",
									index !== 0 && "border-t border-border",
								)}
							>
								<span
									className={cn(
										"absolute inset-y-0 left-0 w-0.5",
										getTaskAccentClass(task),
									)}
								/>
								<div className="grid gap-3 lg:grid-cols-[minmax(0,2.2fr)_minmax(7rem,0.8fr)_minmax(8rem,0.9fr)_minmax(9rem,1fr)_auto] lg:items-start lg:gap-4">
									<div className="min-w-0">
										<p className="text-xs text-muted-foreground">
											{getTaskScopeLabel(task)}
										</p>
										<h4 className="mt-1 text-pretty text-sm font-semibold tracking-[-0.01em] text-foreground">
											{task.title}
										</h4>
										<p className="mt-1 max-w-xl text-sm text-muted-foreground">
											{getDescription(task.description)}
										</p>

										{task.status === "blocked" && task.blockedReason ? (
											<p className="mt-2 max-w-xl text-sm text-destructive">
												{task.blockedReason}
											</p>
										) : null}
									</div>

									<div className="flex flex-wrap gap-1.5 lg:flex-col lg:items-start">
										<PriorityBadge priority={task.priority} />
										<StatusBadge status={task.status} />
									</div>

									<MetaItem
										label="Assignee"
										value={getUserLabel(task.expand?.assignee)}
										secondaryValue={`Created by ${getUserLabel(task.expand?.createdBy)}`}
									/>

									<MetaItem
										label="Deadline"
										value={formatDueDateLabel(task.dueDate)}
										valueClassName="tabular-nums"
									/>

									<div className="flex flex-wrap gap-2 lg:justify-self-end">
										{renderTaskActions ? renderTaskActions(task) : null}
									</div>
								</div>
							</article>
						))}
					</div>
				)}
			</div>
		</section>
	);
}

function MetaItem({
	label,
	secondaryValue,
	value,
	valueClassName,
}: {
	label: string;
	secondaryValue?: string;
	value: string;
	valueClassName?: string;
}) {
	return (
		<div className="min-w-0">
			<dt className="text-xs text-muted-foreground">{label}</dt>
			<dd
				className={cn(
					"mt-0.5 break-words text-sm font-medium text-foreground",
					valueClassName,
				)}
			>
				{value}
			</dd>
			{secondaryValue ? (
				<dd className="mt-0.5 break-words text-xs text-muted-foreground">
					{secondaryValue}
				</dd>
			) : null}
		</div>
	);
}

function SummaryBadge({
	label,
	value,
	variant = "default",
}: {
	label: string;
	value: number;
	variant?: "default" | "info" | "success" | "warning" | "danger";
}) {
	const palette = {
		default: "border-border bg-secondary text-foreground",
		info: "border-[oklch(0.85_0.04_230)] bg-[oklch(0.95_0.025_230)] text-[oklch(0.42_0.10_230)]",
		success:
			"border-[oklch(0.87_0.035_148)] bg-[oklch(0.955_0.02_148)] text-[oklch(0.40_0.10_148)]",
		warning:
			"border-[oklch(0.87_0.05_85)] bg-[oklch(0.955_0.03_85)] text-[oklch(0.45_0.12_80)]",
		danger:
			"border-[oklch(0.87_0.04_15)] bg-[oklch(0.955_0.02_15)] text-[oklch(0.42_0.13_18)]",
	};

	return (
		<div
			className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${palette[variant]}`}
		>
			<span className="font-semibold tabular-nums">
				{String(value).padStart(2, "0")}
			</span>
			{label}
		</div>
	);
}

function StatusBadge({ status }: { status: TaskStatus }) {
	const palette = {
		blocked:
			"border-[oklch(0.87_0.04_15)] bg-[oklch(0.955_0.02_15)] text-[oklch(0.42_0.13_18)]",
		canceled: "border-border bg-secondary text-muted-foreground",
		completed:
			"border-[oklch(0.87_0.035_148)] bg-[oklch(0.955_0.02_148)] text-[oklch(0.40_0.10_148)]",
		in_progress:
			"border-[oklch(0.85_0.04_230)] bg-[oklch(0.95_0.025_230)] text-[oklch(0.42_0.10_230)]",
		pending:
			"border-[oklch(0.87_0.05_85)] bg-[oklch(0.955_0.03_85)] text-[oklch(0.45_0.12_80)]",
	} satisfies Record<TaskStatus, string>;

	return (
		<Badge variant="outline" className={palette[status]}>
			{status.replace("_", " ")}
		</Badge>
	);
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
	const palette = {
		high: "border-[oklch(0.87_0.04_15)] bg-[oklch(0.955_0.02_15)] text-[oklch(0.42_0.13_18)]",
		low: "border-border bg-secondary text-muted-foreground",
		medium:
			"border-[oklch(0.87_0.05_85)] bg-[oklch(0.955_0.03_85)] text-[oklch(0.45_0.12_80)]",
	} satisfies Record<TaskPriority, string>;

	return (
		<Badge variant="outline" className={palette[priority]}>
			{priority}
		</Badge>
	);
}

function getTaskAccentClass(task: TaskRecord) {
	if (task.status === "blocked") return "bg-[oklch(0.50_0.155_15)]";
	if (task.status === "completed") return "bg-[oklch(0.50_0.13_148)]";
	if (task.status === "canceled") return "bg-[oklch(0.75_0.005_80)]";
	if (task.priority === "high") return "bg-[oklch(0.50_0.155_15)]";
	if (task.status === "in_progress") return "bg-[oklch(0.55_0.12_230)]";
	return "bg-border";
}

function getTaskScopeLabel(task: TaskRecord) {
	const project = task.expand?.project;

	if (!project) {
		return "Inbox";
	}

	return `${project.slug} · ${project.name}`;
}

function getDescription(value?: string) {
	return getRichTextPreview(value, "No description yet.");
}

function getUserLabel(user?: {
	email?: string;
	name?: string;
	username?: string;
}) {
	if (!user) {
		return "Unassigned";
	}

	return user.name || user.email || user.username || "Assigned";
}
