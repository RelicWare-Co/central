import { createFileRoute, Link } from "@tanstack/react-router";
import { TaskCollectionView } from "#/components/task-collection-view";
import { Button } from "#/components/ui/button";
import { usePocketBaseRealtimeInvalidate } from "#/hooks/use-pocketbase-realtime";
import { listMyTasks } from "#/lib/tasks";

export const Route = createFileRoute("/app/my-tasks")({
	loader: async ({ context }) => listMyTasks(context.auth),
	component: MyTasksRoute,
});

function MyTasksRoute() {
	const { items, summary } = Route.useLoaderData();

	usePocketBaseRealtimeInvalidate({
		collection: "tasks",
		topic: "*",
	});

	return (
		<TaskCollectionView
			eyebrow="My Tasks"
			title="Assigned work"
			headerAction={
				<Button asChild size="sm">
					<Link
						to="/app/tasks/new"
						search={{
							source: "my-tasks",
						}}
					>
						New task
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
						Edit
					</Link>
				</Button>
			)}
			tasks={items}
			summary={summary}
			emptyTitle="No assigned tasks"
			emptyDescription="When you have tasks assigned, they will appear here as your main working surface."
		/>
	);
}
