import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { startTransition } from "react";
import { TaskEditorForm } from "#/components/task-editor-form";
import { Button } from "#/components/ui/button";
import { queryKeys } from "#/lib/query-keys";
import {
	getTaskEditorReturnLink,
	validateTaskEditorSearch,
} from "#/lib/task-editor-routing";
import { createTask, getDefaultTaskFormValues } from "#/lib/tasks";
import { taskFormOptionsSnapshotQueryOptions } from "#/lib/tasks.queries";

export const Route = createFileRoute("/app/tasks/new")({
	validateSearch: validateTaskEditorSearch,
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData({
			...taskFormOptionsSnapshotQueryOptions(context.auth),
			revalidateIfStale: true,
		});
	},
	component: NewTaskRoute,
});

function NewTaskRoute() {
	const navigate = useNavigate({ from: Route.fullPath });
	const queryClient = useQueryClient();
	const { auth } = Route.useRouteContext();
	const search = Route.useSearch();
	const { data: options } = useSuspenseQuery(
		taskFormOptionsSnapshotQueryOptions(auth),
	);
	const defaults = getDefaultTaskFormValues(options.currentUserId, {
		project: search.projectId ?? "",
	});
	const cancelLink = getTaskEditorReturnLink(search, search.projectId);
	const createTaskMutation = useMutation({
		mutationFn: async (values: Parameters<typeof createTask>[2]) =>
			createTask(auth, options.currentUserId, values),
	});

	return (
		<TaskEditorForm
			cancelAction={
				<Button asChild size="sm" variant="outline">
					<Link {...cancelLink}>Cancel</Link>
				</Button>
			}
			description="Capture the next unit of work. Keep state explicit and fill in only the fields that matter now."
			editorOpen={search.editor !== "closed"}
			eyebrow="New task"
			initialValues={defaults}
			isCreateMode
			options={options}
			submitLabel="Create task"
			title="Create a task"
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
				const task = await createTaskMutation.mutateAsync(values);
				queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
				await navigate(
					getTaskEditorReturnLink(search, values.project || task.project),
				);
			}}
		/>
	);
}
