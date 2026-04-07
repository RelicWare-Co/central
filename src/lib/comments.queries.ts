import type { AuthContext } from "#/lib/auth";
import type { TaskCommentRecord } from "#/lib/comments";
import { listTaskComments } from "#/lib/comments";
import { type PocketBaseRealtimeEvent, pb } from "#/lib/pocketbase";
import { queryKeys } from "#/lib/query-keys";
import { applyRealtimeCollectionEvent } from "#/lib/realtime-collections";
import {
	createLiveStreamQueryOptions,
	createSnapshotQueryOptions,
} from "#/lib/realtime-query";
import { createPocketBaseRealtimeStream } from "#/lib/realtime-stream";

type CommentStreamChunk =
	| {
			kind: "snapshot";
			data: TaskCommentRecord[];
	  }
	| CommentEventStreamChunk;

type CommentEventStreamChunk = {
	kind: "event";
	event: PocketBaseRealtimeEvent<TaskCommentRecord>;
};

export function taskCommentsSnapshotQueryOptions(
	auth: AuthContext,
	taskId: string,
) {
	return createSnapshotQueryOptions(
		queryKeys.comments.list({ taskId }),
		async () => listTaskComments(auth, taskId),
	);
}

export function taskCommentsLiveQueryOptions(
	auth: AuthContext,
	taskId: string,
) {
	return createLiveStreamQueryOptions<
		CommentEventStreamChunk,
		TaskCommentRecord[]
	>({
		initialValue: [],
		queryKey: queryKeys.comments.list({ taskId }),
		reducer: reduceComments,
		loadSnapshot: async () => listTaskComments(auth, taskId),
		streamEvents: (signal) => createTaskCommentsStream(signal, taskId),
	});
}

function reduceComments(
	current: TaskCommentRecord[],
	chunk: CommentStreamChunk,
): TaskCommentRecord[] {
	if (chunk.kind === "snapshot") {
		return sortComments(chunk.data);
	}

	const nextItems = applyRealtimeCollectionEvent(current, chunk.event);

	return sortComments(nextItems);
}

function sortComments(items: TaskCommentRecord[]) {
	return [...items].sort((left, right) => {
		// Sort by createdAt descending (newest first)
		const leftDate = left.createdAt ?? "";
		const rightDate = right.createdAt ?? "";

		if (leftDate !== rightDate) {
			return rightDate.localeCompare(leftDate);
		}

		return right.id.localeCompare(left.id);
	});
}

async function* createTaskCommentsStream(
	signal: AbortSignal | undefined,
	taskId: string,
): AsyncIterable<CommentEventStreamChunk> {
	const filter = pb.filter("task = {:task}", { task: taskId });

	for await (const event of createPocketBaseRealtimeStream<TaskCommentRecord>(
		"task_comments",
		"*",
		{
			expand: "author,quotedComment.author",
			filter,
		},
		signal,
	)) {
		yield {
			kind: "event",
			event,
		};
	}
}
