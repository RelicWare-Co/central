import type { ReactNode } from "react";
import { Badge } from "#/components/ui/badge";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
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
	return (
		<section className="flex flex-col gap-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
						{eyebrow}
					</p>
					<h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground sm:text-2xl">
						{title}
					</h3>
					{description ? (
						<p className="mt-2 max-w-3xl text-sm text-muted-foreground">
							{description}
						</p>
					) : null}
				</div>
				{headerAction ? <div className="shrink-0">{headerAction}</div> : null}
			</div>

			<div className="flex flex-wrap gap-2">
				<SummaryBadge label="Total" value={summary.total} />
				<SummaryBadge label="In progress" value={summary.inProgress} />
				<SummaryBadge label="Blocked" value={summary.blocked} />
				<SummaryBadge label="Due today" value={summary.dueToday} />
				<SummaryBadge label="Overdue" value={summary.overdue} />
			</div>

			{tasks.length === 0 ? (
				<Empty className="min-h-[240px] border-border/70 bg-background/35">
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
				<div className="overflow-hidden rounded-sm border border-border/70 bg-background/20">
					{tasks.map((task) => (
						<article
							key={task.id}
							className="border-b border-border/70 px-4 py-5 last:border-b-0 sm:px-5"
						>
							<div className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(7rem,0.8fr)_minmax(8.5rem,0.95fr)_minmax(9.5rem,1fr)_auto] lg:items-start lg:gap-5">
								<div className="min-w-0">
									<p className="truncate text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
										{getTaskScopeLabel(task)}
									</p>
									<h4 className="mt-2 text-pretty text-lg font-semibold tracking-[-0.03em] text-foreground">
										{task.title}
									</h4>
									<p className="mt-2 max-w-2xl break-words text-sm text-muted-foreground">
										{getDescription(task.description)}
									</p>

									{task.status === "blocked" && task.blockedReason ? (
										<p className="mt-3 max-w-2xl break-words text-sm text-destructive">
											{task.blockedReason}
										</p>
									) : null}
								</div>

								<div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
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
			<dt className="text-[0.68rem] uppercase tracking-[0.18em]">{label}</dt>
			<dd
				className={cn(
					"mt-2 break-words text-sm text-foreground",
					valueClassName,
				)}
			>
				{value}
			</dd>
			{secondaryValue ? (
				<dd className="mt-1 break-words text-xs text-muted-foreground">
					{secondaryValue}
				</dd>
			) : null}
		</div>
	);
}

function SummaryBadge({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-sm border border-border/80 bg-background/85 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
			<span className="font-medium tabular-nums text-foreground">
				{String(value).padStart(2, "0")}
			</span>{" "}
			{label}
		</div>
	);
}

function StatusBadge({ status }: { status: TaskStatus }) {
	const palette = {
		blocked: "border-destructive/20 bg-destructive/10 text-destructive",
		canceled: "border-border bg-background/70 text-muted-foreground",
		completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
		in_progress: "border-sky-500/20 bg-sky-500/10 text-sky-300",
		pending: "border-amber-500/20 bg-amber-500/10 text-amber-300",
	} satisfies Record<TaskStatus, string>;

	return (
		<Badge variant="outline" className={palette[status]}>
			{status.replace("_", " ")}
		</Badge>
	);
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
	const palette = {
		high: "border-destructive/20 bg-destructive/10 text-destructive",
		low: "border-border bg-background/70 text-muted-foreground",
		medium: "border-primary/20 bg-primary/10 text-primary",
	} satisfies Record<TaskPriority, string>;

	return (
		<Badge variant="outline" className={palette[priority]}>
			{priority}
		</Badge>
	);
}

function getTaskScopeLabel(task: TaskRecord) {
	const project = task.expand?.project;

	if (!project) {
		return "Inbox";
	}

	return `${project.slug} · ${project.name}`;
}

function getDescription(value?: string) {
	return getRichTextPreview(
		value,
		"No description yet. This task is ready for assignment, state and follow-up.",
	);
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
