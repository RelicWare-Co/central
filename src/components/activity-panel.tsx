import { useSuspenseQuery } from "@tanstack/react-query";
import { formatRelative } from "date-fns";
import { activityLogsLiveQueryOptions } from "#/lib/activity.queries";

export function ActivityPanel({
	projectId,
	taskId,
}: {
	projectId?: string;
	taskId?: string;
}) {
	const scope = taskId ? { taskId } : projectId ? { projectId } : {};
	const { data: logs } = useSuspenseQuery(activityLogsLiveQueryOptions(scope));

	if (logs.length === 0) {
		return (
			<p className="px-4 py-3 text-sm text-muted-foreground">
				No activity recorded yet.
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-4 px-4 py-3">
			{logs.map((log) => (
				<div key={log.id} className="flex gap-3 text-sm">
					<div className="mt-1.5 size-2 shrink-0 rounded-full bg-border" />
					<div className="min-w-0 flex-1">
						<p className="text-foreground">
							<span className="font-medium text-foreground">
								{log.expand?.actor?.name ||
									log.expand?.actor?.email ||
									log.expand?.actor?.username ||
									"Someone"}
							</span>{" "}
							<span className="text-muted-foreground">
								{log.action.replace("_", " ")}
							</span>
							{log.expand?.targetUser ? (
								<span>
									{" "}
									to{" "}
									<span className="font-medium text-foreground">
										{log.expand.targetUser.name ||
											log.expand.targetUser.email ||
											log.expand.targetUser.username}
									</span>
								</span>
							) : null}
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{formatRelative(new Date(log.eventAt), new Date())}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}
