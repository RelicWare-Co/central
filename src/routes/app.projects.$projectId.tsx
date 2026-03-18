import { createFileRoute, Link } from "@tanstack/react-router";
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

	return (
		<div className="flex flex-col gap-4">
			<Card className="border border-border/70 bg-card/70 ring-0">
				<CardHeader className="border-b border-border/70">
					<div>
						<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
							{project.slug}
						</p>
						<div className="mt-2 flex flex-wrap items-center gap-2">
							<CardTitle className="text-xl font-semibold tracking-[-0.04em] text-foreground sm:text-2xl">
								{project.name}
							</CardTitle>
							<StatusBadge status={project.status} />
						</div>
						<CardDescription className="mt-2 max-w-3xl text-sm text-muted-foreground">
							{getProjectDescription(project.description)}
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
								New Task
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

			<div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_320px]">
				<Card className="border border-border/70 bg-card/70 ring-0">
					<CardHeader className="border-b border-border/70">
						<div>
							<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
								Snapshot
							</p>
							<CardTitle className="mt-2 text-lg font-semibold text-foreground">
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

				<Card className="border border-border/70 bg-card/70 ring-0">
					<CardHeader className="border-b border-border/70">
						<div>
							<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
								Principles
							</p>
							<CardTitle className="mt-2 text-lg font-semibold text-foreground">
								Keep work visible
							</CardTitle>
						</div>
					</CardHeader>

					<CardContent className="flex flex-col gap-3 py-4 text-sm text-muted-foreground">
						<p>
							Use this surface to review ownership, blockers and due dates
							together.
						</p>
						<p>Blocked tasks should expose the reason directly in the list.</p>
						<p>
							Capture unclear work in Inbox first and move it here only when it
							has context.
						</p>
					</CardContent>
				</Card>
			</div>

			<TaskCollectionView
				description="Associated tasks stay in one compact surface so execution, blockers and deadlines remain obvious."
				emptyDescription="Create the first task for this project to make ownership, status and next steps visible."
				emptyTitle="No project tasks yet"
				eyebrow="Project Tasks"
				headerAction={
					<Button asChild size="sm" variant="outline">
						<Link
							search={{
								projectId: project.id,
								source: "project",
							}}
							to="/app/tasks/new"
						>
							Add Task
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
							Edit Task
						</Link>
					</Button>
				)}
				summary={tasks.summary}
				tasks={tasks.items}
				title="Associated Work"
			/>
		</div>
	);
}

function MissingProjectRoute() {
	return (
		<Card className="border border-border/70 bg-card/70 ring-0">
			<CardHeader className="border-b border-border/70">
				<div>
					<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
						Project Detail
					</p>
					<CardTitle className="mt-2 text-xl font-semibold text-foreground">
						Project Not Found
					</CardTitle>
					<CardDescription className="mt-2 text-sm text-muted-foreground">
						This project no longer exists or your session cannot access it.
					</CardDescription>
				</div>
			</CardHeader>

			<CardContent className="py-4">
				<Button asChild size="sm" variant="outline">
					<Link to="/app/projects">Back to Projects</Link>
				</Button>
			</CardContent>
		</Card>
	);
}

function MetaItem({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
				{label}
			</dt>
			<dd className="mt-1 text-sm text-foreground">{value}</dd>
		</div>
	);
}

function SummaryBadge({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-sm border border-border/80 bg-background/85 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
			<span className="font-medium text-foreground">
				{String(value).padStart(2, "0")}
			</span>{" "}
			{label}
		</div>
	);
}

function StatusBadge({ status }: { status: ProjectStatus }) {
	const palette = {
		active: "border-sky-500/20 bg-sky-500/10 text-sky-300",
		archived: "border-border bg-background/70 text-muted-foreground",
		blocked: "border-destructive/20 bg-destructive/10 text-destructive",
		completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
		paused: "border-amber-500/20 bg-amber-500/10 text-amber-300",
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

function getProjectDescription(value?: string) {
	if (!value?.trim()) {
		return "No description yet. This project is ready for tasks, ownership and explicit state tracking.";
	}

	const plainText = value
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	return (
		plainText ||
		"No description yet. This project is ready for tasks, ownership and explicit state tracking."
	);
}
