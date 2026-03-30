import { createFileRoute, Link } from "@tanstack/react-router";
import { TaskCollectionView } from "#/components/task-collection-view";
import { Button } from "#/components/ui/button";
import { usePocketBaseRealtimeInvalidate } from "#/hooks/use-pocketbase-realtime";
import { listInboxTasks } from "#/lib/tasks";

export const Route = createFileRoute("/app/inbox")({
	loader: async ({ context }) => listInboxTasks(context.auth),
	component: InboxRoute,
});

function InboxRoute() {
	const { items, summary } = Route.useLoaderData();

	usePocketBaseRealtimeInvalidate({
		collection: "tasks",
		topic: "*",
	});

	return (
		<TaskCollectionView
			eyebrow="Inbox"
			title="Unsorted work"
			headerAction={
				<Button asChild size="sm">
					<Link
						to="/app/tasks/new"
						search={{
							source: "inbox",
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
							source: "inbox",
						}}
					>
						Edit
					</Link>
				</Button>
			)}
			tasks={items}
			summary={summary}
			emptyTitle="Inbox is clear"
			emptyDescription="Tasks without a project will appear here as an entry point for prioritization."
		/>
	);
}
