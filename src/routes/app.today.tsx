import { createFileRoute, Link } from "@tanstack/react-router";
import { TaskCollectionView } from "#/components/task-collection-view";
import { Button } from "#/components/ui/button";
import { usePocketBaseRealtimeInvalidate } from "#/hooks/use-pocketbase-realtime";
import { listTodayTasks } from "#/lib/tasks";

export const Route = createFileRoute("/app/today")({
	loader: async ({ context }) => listTodayTasks(context.auth),
	component: TodayRoute,
});

function TodayRoute() {
	const { items, summary } = Route.useLoaderData();

	usePocketBaseRealtimeInvalidate({
		collection: "tasks",
		topic: "*",
	});

	return (
		<TaskCollectionView
			eyebrow="Today"
			title="Focus lane for immediate work"
			description="Tasks due today, overdue, in progress, or marked as high priority."
			headerAction={
				<Button asChild size="sm">
					<Link
						to="/app/tasks/new"
						search={{
							source: "today",
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
							source: "today",
						}}
					>
						Edit
					</Link>
				</Button>
			)}
			tasks={items}
			summary={summary}
			emptyTitle="You're all caught up for today"
			emptyDescription="Enjoy your free time, or grab something from your inbox."
		/>
	);
}
