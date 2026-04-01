import { createFileRoute, Link } from "@tanstack/react-router";
import { ActivityPanel } from "#/components/activity-panel";
import { RichTextContent } from "#/components/rich-text-content";
import { TaskCollectionView } from "#/components/task-collection-view";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { usePocketBaseRealtimeInvalidate } from "#/hooks/use-pocketbase-realtime";
import { formatDateLabel, formatDueDateLabel } from "#/lib/formatting";
import {
	getProjectById,
	type ProjectRecord,
	type ProjectStatus,
} from "#/lib/projects";
import { listProjectTasks } from "#/lib/tasks";

export const Route = createFileRoute("/app/projects/$projectId")({
	loader: async ({ context, params }) => {
		const [project, tasks] = await Promise.all([
			getProjectById(
				context.auth,
				params.projectId,
				`/app/projects/${params.projectId}`,
			),
			listProjectTasks(
				context.auth,
				params.projectId,
				`/app/projects/${params.projectId}`,
			),
		]);

		return {
			project,
			tasks,
		};
	},
	component: ProjectDetailRoute,
	notFoundComponent: MissingProjectRoute,
});

function ProjectDetailRoute() {
	const { project, tasks } = Route.useLoaderData();
	const openTasks = tasks.items.filter(
		(task) => task.status !== "completed" && task.status !== "canceled",
	).length;

	usePocketBaseRealtimeInvalidate({
		collection: "projects",
		topic: project.id,
	});

	usePocketBaseRealtimeInvalidate({
		collection: "tasks",
		topic: "*",
	});

	return (
		<div className="flex flex-col gap-5">
			<Card>
				<CardHeader className="border-b border-border/50">
					<div>
						<p className="text-xs font-medium text-muted-foreground">
							{project.slug}
						</p>
						<div className="mt-1.5 flex flex-wrap items-center gap-2">
							<CardTitle className="text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
								{project.name}
							</CardTitle>
							<StatusBadge status={project.status} />
						</div>
						<CardDescription className="mt-2 max-w-2xl">
							<RichTextContent
								className="text-sm text-muted-foreground"
								fallback={<p>No description yet.</p>}
								value={project.description}
							/>
						</CardDescription>
					</div>

					<CardAction className="flex gap-2">
						<Button asChild size="sm" variant="outline">
							<Link to="/app/projects">Back</Link>
						</Button>
						<Button asChild size="sm">
							<Link
								search={{
									projectId: project.id,
									source: "project",
								}}
								to="/app/tasks/new"
							>
								New task
							</Link>
						</Button>
					</CardAction>
				</CardHeader>

				<CardContent className="flex flex-wrap gap-2 py-4">
					<SummaryBadge
						label="Open tasks"
						value={openTasks}
						variant="default"
					/>
					<SummaryBadge
						label="Blocked"
						value={tasks.summary.blocked}
						variant="danger"
					/>
					<SummaryBadge
						label="Due today"
						value={tasks.summary.dueToday}
						variant="warning"
					/>
					<SummaryBadge
						label="Overdue"
						value={tasks.summary.overdue}
						variant="danger"
					/>
				</CardContent>
			</Card>

			<div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_300px]">
				<Card>
					<CardHeader className="border-b border-border/50">
						<div>
							<p className="text-xs font-medium text-muted-foreground">
								Snapshot
							</p>
							<CardTitle className="mt-1 text-base font-semibold">
								Operating context
							</CardTitle>
						</div>
					</CardHeader>

					<CardContent className="grid gap-4 py-4 sm:grid-cols-2">
						<MetaItem label="Owner" value={getOwnerLabel(project)} />
						<MetaItem
							label="Start date"
							value={formatDateLabel(project.startDate)}
						/>
						<MetaItem
							label="Deadline"
							value={formatDueDateLabel(project.dueDate)}
						/>
						<MetaItem
							label="Completed"
							value={String(tasks.summary.completed).padStart(2, "0")}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="border-b border-border/50">
						<div>
							<p className="text-xs font-medium text-muted-foreground">
								History
							</p>
							<CardTitle className="mt-1 text-base font-semibold">
								Activity Log
							</CardTitle>
						</div>
					</CardHeader>

					<CardContent className="p-0">
						<ActivityPanel projectId={project.id} />
					</CardContent>
				</Card>
			</div>

			<TaskCollectionView
				emptyDescription="Create the first task for this project."
				emptyTitle="No project tasks yet"
				eyebrow="Project tasks"
				headerAction={
					<Button asChild size="sm" variant="outline">
						<Link
							search={{
								projectId: project.id,
								source: "project",
							}}
							to="/app/tasks/new"
						>
							Add task
						</Link>
					</Button>
				}
				renderTaskActions={(task) => (
					<Button asChild size="sm" variant="outline">
						<Link
							params={{
								taskId: task.id,
							}}
							search={{
								projectId: project.id,
								source: "project",
							}}
							to="/app/tasks/$taskId"
						>
							Edit
						</Link>
					</Button>
				)}
				summary={tasks.summary}
				tasks={tasks.items}
				title="Associated work"
			/>
		</div>
	);
}

function MissingProjectRoute() {
	return (
		<Card>
			<CardHeader className="border-b border-border/50">
				<div>
					<p className="text-xs font-medium text-muted-foreground">
						Project detail
					</p>
					<CardTitle className="mt-1 text-lg font-semibold">
						Project not found
					</CardTitle>
					<CardDescription className="mt-1 text-sm text-muted-foreground">
						This project no longer exists or your session cannot access it.
					</CardDescription>
				</div>
			</CardHeader>

			<CardContent className="py-4">
				<Button asChild size="sm" variant="outline">
					<Link to="/app/projects">Back to projects</Link>
				</Button>
			</CardContent>
		</Card>
	);
}

function MetaItem({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-xs text-muted-foreground">{label}</dt>
			<dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
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

function StatusBadge({ status }: { status: ProjectStatus }) {
	const palette = {
		active:
			"border-[oklch(0.76_0.2_192/0.55)] bg-[oklch(0.76_0.2_192/0.16)] text-[oklch(0.82_0.15_192)]",
		archived:
			"border-[oklch(0.45_0.03_265/0.5)] bg-[oklch(0.30_0.025_265/0.5)] text-[oklch(0.62_0.025_265)]",
		blocked:
			"border-[oklch(0.63_0.22_12/0.55)] bg-[oklch(0.63_0.22_12/0.16)] text-[oklch(0.78_0.16_12)]",
		completed:
			"border-[oklch(0.68_0.19_148/0.55)] bg-[oklch(0.68_0.19_148/0.16)] text-[oklch(0.80_0.14_148)]",
		paused:
			"border-[oklch(0.76_0.175_72/0.55)] bg-[oklch(0.76_0.175_72/0.16)] text-[oklch(0.88_0.13_72)]",
	} satisfies Record<ProjectStatus, string>;

	return (
		<Badge variant="outline" className={palette[status]}>
			{status.replace("_", " ")}
		</Badge>
	);
}

function getOwnerLabel(project: ProjectRecord) {
	const owner = project.expand?.owner;

	if (!owner) {
		return "Unassigned";
	}

	return owner.name || owner.email || owner.username || "Assigned";
}
