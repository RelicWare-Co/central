import { type ReactNode, useMemo, useState } from "react";
import { Badge } from "#/components/ui/badge";
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
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { formatDueDateLabel } from "#/lib/formatting";
import { getRichTextPreview } from "#/lib/rich-text";
import type {
	TaskCollectionData,
	TaskPriority,
	TaskRecord,
	TaskStatus,
} from "#/lib/tasks";
import { cn } from "#/lib/utils";

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

	const assignees = useMemo(() => {
		const map = new Map();
		for (const t of tasks) {
			if (t.expand?.assignee) {
				map.set(t.assignee, getUserLabel(t.expand.assignee));
			}
		}
		return Array.from(map.entries());
	}, [tasks]);

	const projects = useMemo(() => {
		const map = new Map();
		for (const t of tasks) {
			if (t.expand?.project) {
				map.set(t.project, t.expand.project.name);
			}
		}
		return Array.from(map.entries());
	}, [tasks]);

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

	return (
		<section className="flex flex-col gap-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
					<h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
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

			{tasks.length > 0 ? (
				<div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4">
					<div className="min-w-[200px] flex-1">
						<Input
							placeholder="Search tasks..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-9 w-full bg-background"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-9 w-[130px] bg-background">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All statuses</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="in_progress">In Progress</SelectItem>
								<SelectItem value="blocked">Blocked</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
								<SelectItem value="canceled">Canceled</SelectItem>
							</SelectContent>
						</Select>
						<Select value={priorityFilter} onValueChange={setPriorityFilter}>
							<SelectTrigger className="h-9 w-[120px] bg-background">
								<SelectValue placeholder="Priority" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All priorities</SelectItem>
								<SelectItem value="low">Low</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="high">High</SelectItem>
							</SelectContent>
						</Select>
						{projects.length > 0 && (
							<Select value={projectFilter} onValueChange={setProjectFilter}>
								<SelectTrigger className="h-9 w-[140px] bg-background">
									<SelectValue placeholder="Project" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All projects</SelectItem>
									{projects.map(([id, name]) => (
										<SelectItem key={id} value={id}>
											{name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						{assignees.length > 0 && (
							<Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
								<SelectTrigger className="h-9 w-[140px] bg-background">
									<SelectValue placeholder="Assignee" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All assignees</SelectItem>
									{assignees.map(([id, name]) => (
										<SelectItem key={id} value={id}>
											{name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>
				</div>
			) : null}

			{filteredTasks.length === 0 ? (
				<Empty className="min-h-[200px] border-border/50 bg-card/60">
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
				<div className="flex flex-col gap-2">
					{filteredTasks.map((task) => (
						<article
							key={task.id}
							className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/70 px-4 py-4 transition-all duration-200 hover:border-border/80 hover:bg-card/90 sm:px-5"
						>
							<span className={cn("absolute inset-y-0 left-0 w-0.5", getTaskAccentClass(task))} />
							<div className="grid gap-3 lg:grid-cols-[minmax(0,2.2fr)_minmax(7rem,0.8fr)_minmax(8rem,0.9fr)_minmax(9rem,1fr)_auto] lg:items-start lg:gap-4">
								<div className="min-w-0">
									<p className="text-xs text-muted-foreground">
										{getTaskScopeLabel(task)}
									</p>
									<h4 className="mt-1 text-pretty text-base font-semibold tracking-[-0.02em] text-foreground">
										{task.title}
									</h4>
									<p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
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
		default: "border-border/70 bg-card/90 text-foreground",
		info: "border-[oklch(0.72_0.19_195/0.55)] bg-[oklch(0.72_0.19_195/0.14)] text-[oklch(0.82_0.14_195)]",
		success:
			"border-[oklch(0.68_0.19_148/0.55)] bg-[oklch(0.68_0.19_148/0.14)] text-[oklch(0.80_0.14_148)]",
		warning:
			"border-[oklch(0.76_0.175_72/0.55)] bg-[oklch(0.76_0.175_72/0.14)] text-[oklch(0.88_0.13_72)]",
		danger:
			"border-[oklch(0.63_0.22_12/0.55)] bg-[oklch(0.63_0.22_12/0.14)] text-[oklch(0.78_0.16_12)]",
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
			"border-[oklch(0.63_0.22_12/0.55)] bg-[oklch(0.63_0.22_12/0.16)] text-[oklch(0.78_0.16_12)]",
		canceled:
			"border-[oklch(0.45_0.03_265/0.5)] bg-[oklch(0.30_0.025_265/0.5)] text-[oklch(0.62_0.025_265)]",
		completed:
			"border-[oklch(0.68_0.19_148/0.55)] bg-[oklch(0.68_0.19_148/0.16)] text-[oklch(0.80_0.14_148)]",
		in_progress:
			"border-[oklch(0.76_0.2_192/0.55)] bg-[oklch(0.76_0.2_192/0.16)] text-[oklch(0.82_0.15_192)]",
		pending:
			"border-[oklch(0.76_0.175_72/0.55)] bg-[oklch(0.76_0.175_72/0.16)] text-[oklch(0.88_0.13_72)]",
	} satisfies Record<TaskStatus, string>;

	return (
		<Badge variant="outline" className={palette[status]}>
			{status.replace("_", " ")}
		</Badge>
	);
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
	const palette = {
		high: "border-[oklch(0.70_0.18_290/0.55)] bg-[oklch(0.70_0.18_290/0.16)] text-[oklch(0.82_0.14_290)]",
		low: "border-[oklch(0.55_0.04_265/0.5)] bg-[oklch(0.45_0.03_265/0.4)] text-[oklch(0.68_0.04_265)]",
		medium:
			"border-[oklch(0.76_0.2_192/0.45)] bg-[oklch(0.76_0.2_192/0.12)] text-[oklch(0.82_0.15_192)]",
	} satisfies Record<TaskPriority, string>;

	return (
		<Badge variant="outline" className={palette[priority]}>
			{priority}
		</Badge>
	);
}

function getTaskAccentClass(task: TaskRecord) {
	if (task.status === "blocked") return "bg-[oklch(0.63_0.22_12)]";
	if (task.status === "completed") return "bg-[oklch(0.68_0.19_148)]";
	if (task.status === "canceled") return "bg-[oklch(0.45_0.03_265)]";
	if (task.priority === "high") return "bg-[oklch(0.70_0.18_290)]";
	if (task.status === "in_progress") return "bg-primary";
	return "bg-border/50";
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
