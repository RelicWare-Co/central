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
				<SummaryBadge label="Total" value={summary.total} />
				<SummaryBadge label="In progress" value={summary.inProgress} />
				<SummaryBadge label="Blocked" value={summary.blocked} />
				<SummaryBadge label="Due today" value={summary.dueToday} />
				<SummaryBadge label="Overdue" value={summary.overdue} />
			</div>

			{tasks.length === 0 ? (
				<Empty className="min-h-[200px] border-border/30 bg-card/30">
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
					{tasks.map((task) => (
						<article
							key={task.id}
							className="group rounded-xl border border-border/30 bg-card/40 px-4 py-4 transition-colors hover:border-border/50 hover:bg-card/60 sm:px-5"
						>
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

function SummaryBadge({ label, value }: { label: string; value: number }) {
	return (
		<div className="inline-flex items-center gap-1.5 rounded-lg border border-border/30 bg-card/50 px-2.5 py-1 text-xs text-muted-foreground">
			<span className="font-semibold tabular-nums text-foreground">
				{String(value).padStart(2, "0")}
			</span>
			{label}
		</div>
	);
}

function StatusBadge({ status }: { status: TaskStatus }) {
	const palette = {
		blocked: "border-destructive/25 bg-destructive/10 text-destructive",
		canceled: "border-border/40 bg-muted/30 text-muted-foreground",
		completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
		in_progress: "border-sky-500/25 bg-sky-500/10 text-sky-400",
		pending: "border-amber-500/25 bg-amber-500/10 text-amber-400",
	} satisfies Record<TaskStatus, string>;

	return (
		<Badge variant="outline" className={palette[status]}>
			{status.replace("_", " ")}
		</Badge>
	);
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
	const palette = {
		high: "border-destructive/25 bg-destructive/10 text-destructive",
		low: "border-border/40 bg-muted/30 text-muted-foreground",
		medium: "border-primary/25 bg-primary/10 text-primary",
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
