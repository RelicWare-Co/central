import {
	queryOptions,
	experimental_streamedQuery as streamedQuery,
} from "@tanstack/react-query";
import { type ActivityLogRecord, getActivityLogs } from "#/lib/activity";
import { type PocketBaseRealtimeEvent, pb } from "#/lib/pocketbase";
import { type ActivityScope, queryKeys } from "#/lib/query-keys";
import { createPocketBaseRealtimeStream } from "#/lib/realtime-stream";

type ActivityStreamChunk =
	| {
			kind: "snapshot";
			data: ActivityLogRecord[];
	  }
	| {
			kind: "event";
			event: PocketBaseRealtimeEvent<ActivityLogRecord>;
	  };

export function activityLogsSnapshotQueryOptions(scope: ActivityScope) {
	return queryOptions({
		queryKey: queryKeys.activity.list(scope),
		queryFn: async () => (await getActivityLogs(scope)).items,
	});
}

export function activityLogsLiveQueryOptions(scope: ActivityScope) {
	return queryOptions({
		queryKey: queryKeys.activity.list(scope),
		queryFn: streamedQuery<ActivityStreamChunk, ActivityLogRecord[]>({
			initialValue: [],
			refetchMode: "append",
			reducer: reduceActivityLogs,
			streamFn: async ({ client, queryKey, signal }) => {
				async function* stream() {
					const existing = client.getQueryData<ActivityLogRecord[]>(queryKey);

					if (!existing) {
						yield {
							kind: "snapshot",
							data: (await getActivityLogs(scope)).items,
						} satisfies ActivityStreamChunk;
					}

					yield* createActivityLogsStream(signal, scope);
				}

				return stream();
			},
		}),
	});
}

function reduceActivityLogs(
	current: ActivityLogRecord[],
	chunk: ActivityStreamChunk,
): ActivityLogRecord[] {
	if (chunk.kind === "snapshot") {
		return sortActivityLogs(chunk.data);
	}

	const record = chunk.event.record;

	if (chunk.event.action === "delete") {
		return current.filter((item) => item.id !== record.id);
	}

	const nextItems = current.some((item) => item.id === record.id)
		? current.map((item) => (item.id === record.id ? record : item))
		: [record, ...current];

	return sortActivityLogs(nextItems).slice(0, 20);
}

function sortActivityLogs(items: ActivityLogRecord[]) {
	return [...items].sort((left, right) => {
		if (left.eventAt !== right.eventAt) {
			return right.eventAt.localeCompare(left.eventAt);
		}

		return right.id.localeCompare(left.id);
	});
}

function createActivityLogsStream(
	signal: AbortSignal | undefined,
	scope: ActivityScope,
) {
	const filter = buildActivityFilter(scope);

	return createPocketBaseRealtimeStream<ActivityLogRecord>(
		"activity_logs",
		"*",
		{
			expand: "actor,targetUser,task,project",
			...(filter ? { filter } : {}),
		},
		signal,
	);
}

function buildActivityFilter(scope: ActivityScope) {
	if ("projectId" in scope && scope.projectId) {
		return pb.filter("project = {:project}", { project: scope.projectId });
	}

	if ("taskId" in scope && scope.taskId) {
		return pb.filter("task = {:task}", { task: scope.taskId });
	}

	return undefined;
}
