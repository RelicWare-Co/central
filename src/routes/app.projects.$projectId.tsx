import { createFileRoute, Link } from "@tanstack/react-router";
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
				<CardHeader className="border-b border-border/30">
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
					<SummaryBadge label="Open tasks" value={openTasks} />
					<SummaryBadge label="Blocked" value={tasks.summary.blocked} />
					<SummaryBadge label="Due today" value={tasks.summary.dueToday} />
					<SummaryBadge label="Overdue" value={tasks.summary.overdue} />
				</CardContent>
			</Card>

			<div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_300px]">
				<Card>
					<CardHeader className="border-b border-border/30">
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
					<CardHeader className="border-b border-border/30">
						<div>
							<p className="text-xs font-medium text-muted-foreground">
								Principles
							</p>
							<CardTitle className="mt-1 text-base font-semibold">
								Keep work visible
							</CardTitle>
						</div>
					</CardHeader>

					<CardContent className="flex flex-col gap-2.5 py-4 text-sm text-muted-foreground">
						<p>
							Review ownership, blockers and due dates together on this surface.
						</p>
						<p>Blocked tasks should always expose the reason.</p>
						<p>
							Capture unclear work in Inbox first. Move it here when it has
							context.
						</p>
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
			<CardHeader className="border-b border-border/30">
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

function StatusBadge({ status }: { status: ProjectStatus }) {
	const palette = {
		active: "border-sky-500/25 bg-sky-500/10 text-sky-400",
		archived: "border-border/40 bg-muted/30 text-muted-foreground",
		blocked: "border-destructive/25 bg-destructive/10 text-destructive",
		completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
		paused: "border-amber-500/25 bg-amber-500/10 text-amber-400",
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
