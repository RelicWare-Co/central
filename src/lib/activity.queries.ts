import {
	type ActivityLogRecord,
	buildActivityFilter,
	getActivityLogs,
} from "#/lib/activity";
import type { PocketBaseRealtimeEvent } from "#/lib/pocketbase";
import { type ActivityScope, queryKeys } from "#/lib/query-keys";
import { applyRealtimeCollectionEvent } from "#/lib/realtime-collections";
import {
	createLiveStreamQueryOptions,
	createSnapshotQueryOptions,
} from "#/lib/realtime-query";
import { createPocketBaseRealtimeStream } from "#/lib/realtime-stream";

type ActivityStreamChunk =
	| {
			kind: "snapshot";
			data: ActivityLogRecord[];
	  }
	| ActivityEventStreamChunk;

type ActivityEventStreamChunk = {
	kind: "event";
	event: PocketBaseRealtimeEvent<ActivityLogRecord>;
};

export function activityLogsSnapshotQueryOptions(scope: ActivityScope) {
	return createSnapshotQueryOptions(
		queryKeys.activity.list(scope),
		async () => (await getActivityLogs(scope)).items,
	);
}

export function activityLogsLiveQueryOptions(scope: ActivityScope) {
	return createLiveStreamQueryOptions<
		ActivityEventStreamChunk,
		ActivityLogRecord[]
	>({
		initialValue: [],
		queryKey: queryKeys.activity.list(scope),
		reducer: reduceActivityLogs,
		loadSnapshot: async () => (await getActivityLogs(scope)).items,
		streamEvents: (signal) => createActivityLogsStream(signal, scope),
	});
}

function reduceActivityLogs(
	current: ActivityLogRecord[],
	chunk: ActivityStreamChunk,
): ActivityLogRecord[] {
	if (chunk.kind === "snapshot") {
		return sortActivityLogs(chunk.data);
	}

	const nextItems = applyRealtimeCollectionEvent(current, chunk.event);

	const maxActivityLogs = 20;
	return sortActivityLogs(nextItems).slice(0, maxActivityLogs);
}

function sortActivityLogs(items: ActivityLogRecord[]) {
	return [...items].sort((left, right) => {
		if (left.eventAt !== right.eventAt) {
			return right.eventAt.localeCompare(left.eventAt);
		}

		return right.id.localeCompare(left.id);
	});
}

async function* createActivityLogsStream(
	signal: AbortSignal | undefined,
	scope: ActivityScope,
): AsyncIterable<ActivityEventStreamChunk> {
	const filter = buildActivityFilter(scope);

	for await (const event of createPocketBaseRealtimeStream<ActivityLogRecord>(
		"activity_logs",
		"*",
		{
			expand: "actor,targetUser,task,project",
			...(filter ? { filter } : {}),
		},
		signal,
	)) {
		yield {
			kind: "event",
			event,
		};
	}
}
