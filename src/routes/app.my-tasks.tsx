import { createFileRoute, Link } from "@tanstack/react-router";
import { TaskCollectionView } from "#/components/task-collection-view";
import { Button } from "#/components/ui/button";
import { listMyTasks } from "#/lib/tasks";

export const Route = createFileRoute("/app/my-tasks")({
	loader: async ({ context }) => listMyTasks(context.auth),
	component: MyTasksRoute,
});

function MyTasksRoute() {
	const { items, summary } = Route.useLoaderData();

	return (
		<TaskCollectionView
			eyebrow="My Tasks"
			title="Assigned Work Surface"
			description="My Tasks agrupa el trabajo del usuario autenticado para ejecución diaria, seguimiento de bloqueos y deadlines visibles."
			headerAction={
				<Button asChild size="sm">
					<Link
						to="/app/tasks/new"
						search={{
							source: "my-tasks",
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
							source: "my-tasks",
						}}
					>
						Edit Task
					</Link>
				</Button>
			)}
			tasks={items}
			summary={summary}
			emptyTitle="No assigned tasks"
			emptyDescription="Cuando el usuario tenga tareas asignadas en PocketBase, esta vista servirá como su superficie operativa principal."
		/>
	);
}
