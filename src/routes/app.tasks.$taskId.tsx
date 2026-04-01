import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { startTransition } from "react";
import { TaskEditorForm } from "#/components/task-editor-form";
import { ActivityPanel } from "#/components/activity-panel";
import { TaskSubtasksPanel } from "#/components/task-subtasks-panel";
import { Button } from "#/components/ui/button";
import { usePocketBaseRealtimeInvalidate } from "#/hooks/use-pocketbase-realtime";
import {
	getTaskEditorReturnLink,
	validateTaskEditorSearch,
} from "#/lib/task-editor-routing";
import {
	getTaskById,
	getTaskFormOptions,
	getTaskFormValues,
	listSubtasksForTask,
	updateTask,
} from "#/lib/tasks";

export const Route = createFileRoute("/app/tasks/$taskId")({
	validateSearch: validateTaskEditorSearch,
	loader: async ({ context, location, params }) => {
		const normalizedSearch = validateTaskEditorSearch(location.search);
		const [task, options, subtasks] = await Promise.all([
			getTaskById(context.auth, params.taskId, `/app/tasks/${params.taskId}`),
			getTaskFormOptions(context.auth, `/app/tasks/${params.taskId}`),
			listSubtasksForTask(
				context.auth,
				params.taskId,
				`/app/tasks/${params.taskId}`,
			),
		]);

		return {
			options: {
				...options,
				projects: mergeProjectOption(options.projects, task),
				users: mergeUserOption(options.users, task),
			},
			search: normalizedSearch,
			subtasks,
			task,
		};
	},
	component: EditTaskRoute,
	notFoundComponent: MissingTaskRoute,
});

function EditTaskRoute() {
	const navigate = useNavigate({ from: Route.fullPath });
	const router = useRouter();
	const { options, search, subtasks, task } = Route.useLoaderData();
	const cancelLink = getTaskEditorReturnLink(
		search,
		search.projectId ?? task.project,
	);

	usePocketBaseRealtimeInvalidate({
		collection: "tasks",
		enabled: search.editor !== "open",
		topic: task.id,
	});

	return (
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
				await updateTask(task.id, values, task.completedAt);

				await router.invalidate();
				await navigate(
					getTaskEditorReturnLink(search, values.project || task.project),
				);
			}}
		>
			<TaskSubtasksPanel initialSubtasks={subtasks} taskId={task.id} />
			<div className="mt-6 rounded-xl border border-border/30 bg-card/30">
				<div className="border-b border-border/30 px-4 py-3">
					<p className="text-sm font-medium text-foreground">Activity Log</p>
				</div>
				<ActivityPanel taskId={task.id} />
			</div>
		</TaskEditorForm>
	);
}

function MissingTaskRoute() {
	return (
		<section className="rounded-xl border border-border/30 bg-card/50 p-6">
			<p className="text-xs font-medium text-muted-foreground">Task detail</p>
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
