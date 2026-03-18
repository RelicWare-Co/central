import { createFileRoute, Link } from "@tanstack/react-router";
import { TaskCollectionView } from "#/components/task-collection-view";
import { Button } from "#/components/ui/button";
import { listInboxTasks } from "#/lib/tasks";

export const Route = createFileRoute("/app/inbox")({
	loader: async ({ context }) => listInboxTasks(context.auth),
	component: InboxRoute,
});

function InboxRoute() {
	const { items, summary } = Route.useLoaderData();

	return (
		<TaskCollectionView
			eyebrow="Inbox"
			title="Unsorted Work"
			headerAction={
				<Button asChild size="sm">
					<Link
						to="/app/tasks/new"
						search={{
							source: "inbox",
						}}
					>
						New Task
					</Link>
				</Button>
			}
			renderTaskActions={(task) => (
				<Button asChild size="sm" variant="outline">
					<Link
						to="/app/tasks/$taskId"
						params={{
							taskId: task.id,
						}}
						search={{
							source: "inbox",
						}}
					>
						Edit Task
					</Link>
				</Button>
			)}
			tasks={items}
			summary={summary}
			emptyTitle="Inbox is clear"
			emptyDescription="Cuando existan tareas sin proyecto en PocketBase, aparecerán aquí como punto de entrada para priorización y asignación."
		/>
	);
}
