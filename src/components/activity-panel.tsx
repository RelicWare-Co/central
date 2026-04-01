import { formatRelative } from "date-fns";
import { useEffect, useState } from "react";
import { type ActivityLogRecord, getActivityLogs } from "#/lib/activity";

export function ActivityPanel({
	projectId,
	taskId,
}: {
	projectId?: string;
	taskId?: string;
}) {
	const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		getActivityLogs({ projectId, taskId })
			.then((res) => {
				if (isMounted) {
					setLogs(res.items);
					setLoading(false);
				}
			})
			.catch(() => {
				if (isMounted) setLoading(false);
			});
		return () => {
			isMounted = false;
		};
	}, [projectId, taskId]);

	if (loading) {
		return (
			<p className="px-4 py-3 text-sm text-muted-foreground">
				Loading history...
			</p>
		);
	}

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
