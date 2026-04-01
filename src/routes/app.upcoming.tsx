import { createFileRoute, Link } from "@tanstack/react-router";
import { TaskCollectionView } from "#/components/task-collection-view";
import { Button } from "#/components/ui/button";
import { usePocketBaseRealtimeInvalidate } from "#/hooks/use-pocketbase-realtime";
import { listUpcomingTasks } from "#/lib/tasks";

export const Route = createFileRoute("/app/upcoming")({
	loader: async ({ context }) => listUpcomingTasks(context.auth),
	component: UpcomingRoute,
});

function UpcomingRoute() {
	const { items, summary } = Route.useLoaderData();

	usePocketBaseRealtimeInvalidate({
		collection: "tasks",
		topic: "*",
	});

	return (
		<TaskCollectionView
			eyebrow="Upcoming"
			title="Forward visibility without PM overhead"
			description="Tasks due tomorrow or later. Keep an eye on what's next."
			headerAction={
				<Button asChild size="sm">
					<Link
						to="/app/tasks/new"
						search={{
							source: "upcoming",
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
							source: "upcoming",
						}}
					>
						Edit
					</Link>
				</Button>
			)}
			tasks={items}
			summary={summary}
			emptyTitle="Clear horizon"
			emptyDescription="There are no upcoming tasks due. Check your Inbox to plan more work."
		/>
	);
}
