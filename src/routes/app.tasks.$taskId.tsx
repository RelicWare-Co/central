import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { startTransition } from "react";
import { ActivityPanel } from "#/components/activity-panel";
import { TaskCommentsPanel } from "#/components/task-comments-panel";
import { TaskEditorForm } from "#/components/task-editor-form";
import { TaskSubtasksPanel } from "#/components/task-subtasks-panel";
import { Button } from "#/components/ui/button";
import { activityLogsSnapshotQueryOptions } from "#/lib/activity.queries";
import { taskCommentsSnapshotQueryOptions } from "#/lib/comments.queries";
import { queryKeys } from "#/lib/query-keys";
import {
	getTaskEditorReturnLink,
	validateTaskEditorSearch,
} from "#/lib/task-editor-routing";
import {
	getTaskFormValues,
	type TaskFormValues,
	updateTask,
} from "#/lib/tasks";
import {
	taskDetailLiveQueryOptions,
	taskDetailSnapshotQueryOptions,
	taskFormOptionsSnapshotQueryOptions,
	taskSubtasksSnapshotQueryOptions,
} from "#/lib/tasks.queries";

export const Route = createFileRoute("/app/tasks/$taskId")({
	validateSearch: validateTaskEditorSearch,
	loader: async ({ context, location, params }) => {
		const normalizedSearch = validateTaskEditorSearch(location.search);
		await Promise.all([
			context.queryClient.ensureQueryData({
				...taskDetailSnapshotQueryOptions(context.auth, params.taskId),
				revalidateIfStale: true,
			}),
			context.queryClient.ensureQueryData({
				...taskFormOptionsSnapshotQueryOptions(context.auth),
				revalidateIfStale: true,
			}),
			context.queryClient.ensureQueryData({
				...taskSubtasksSnapshotQueryOptions(context.auth, params.taskId),
				revalidateIfStale: true,
			}),
			context.queryClient.ensureQueryData({
				...activityLogsSnapshotQueryOptions({
					taskId: params.taskId,
				}),
				revalidateIfStale: true,
			}),
			context.queryClient.ensureQueryData({
				...taskCommentsSnapshotQueryOptions(context.auth, params.taskId),
				revalidateIfStale: true,
			}),
		]);

		return {
			search: normalizedSearch,
		};
	},
	component: EditTaskRoute,
	notFoundComponent: MissingTaskRoute,
});

function EditTaskRoute() {
	const navigate = useNavigate({ from: Route.fullPath });
	const queryClient = useQueryClient();
	const { auth } = Route.useRouteContext();
	const { taskId } = Route.useParams();
	const search = Route.useSearch();
	const { data: task } = useSuspenseQuery({
		...taskDetailLiveQueryOptions(auth, taskId),
		enabled: search.editor !== "open",
	});
	const { data: baseOptions } = useSuspenseQuery(
		taskFormOptionsSnapshotQueryOptions(auth),
	);
	const options = {
		...baseOptions,
		projects: mergeProjectOption(baseOptions.projects, task),
		users: mergeUserOption(baseOptions.users, task),
	};
	const cancelLink = getTaskEditorReturnLink(
		search,
		search.projectId ?? task.project,
	);

	const updateTaskMutation = useMutation({
		mutationFn: async (values: TaskFormValues) =>
			updateTask(auth, task.id, values, task.completedAt),
	});

	return (
		<div className="grid gap-6 lg:grid-cols-[1fr,320px] xl:grid-cols-[1fr,380px]">
			<div>
				<TaskEditorForm
					cancelAction={
						<Button asChild size="sm" variant="outline">
							<Link {...cancelLink}>Cancel</Link>
						</Button>
					}
					editorOpen={search.editor === "open"}
					eyebrow="Task detail"
					initialValues={getTaskFormValues(task)}
					options={options}
					submitLabel="Save task"
					title="Edit task"
					onToggleEditor={(open) => {
						startTransition(() => {
							void navigate({
								replace: true,
								search: {
									...search,
									editor: open ? "open" : "closed",
								},
							});
						});
					}}
					onSubmit={async (values) => {
						const updatedTask = await updateTaskMutation.mutateAsync(values);
						queryClient.setQueryData(
							queryKeys.tasks.detail(task.id),
							updatedTask,
						);
						await navigate(
							getTaskEditorReturnLink(search, values.project || task.project),
						);
					}}
				>
					<TaskSubtasksPanel key={task.id} auth={auth} taskId={task.id} />
					<div className="mt-6 rounded-xl border border-border bg-card">
						<div className="border-b border-border px-4 py-3">
							<p className="text-sm font-medium text-foreground">
								Activity Log
							</p>
						</div>
						<ActivityPanel taskId={task.id} />
					</div>
				</TaskEditorForm>
			</div>

			<div className="h-fit lg:sticky lg:top-4">
				<TaskCommentsPanel auth={auth} taskId={taskId} />
			</div>
		</div>
	);
}

function MissingTaskRoute() {
	return (
		<section className="rounded-xl border border-border bg-card p-6">
			<p className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
				Task detail
			</p>
			<h3 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
				Task not found
			</h3>
			<p className="mt-1.5 max-w-md text-sm text-muted-foreground">
				This task no longer exists or your session cannot access it.
			</p>
			<Button asChild className="mt-4" size="sm" variant="outline">
				<Link to="/app/my-tasks">Back to My Tasks</Link>
			</Button>
		</section>
	);
}

function mergeProjectOption<
	TProject extends {
		id: string;
		name?: string;
		slug?: string;
		status?: string;
	},
>(projects: TProject[], task: { expand?: { project?: TProject } }) {
	const project = task.expand?.project;

	if (!project || projects.some((item) => item.id === project.id)) {
		return projects;
	}

	return [project, ...projects];
}

function mergeUserOption<
	TUser extends { email?: string; id: string; name?: string; role?: string },
>(users: TUser[], task: { expand?: { assignee?: TUser } }) {
	const assignee = task.expand?.assignee;

	if (!assignee || users.some((item) => item.id === assignee.id)) {
		return users;
	}

	return [assignee, ...users];
}
