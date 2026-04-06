import {
	queryOptions,
	experimental_streamedQuery as streamedQuery,
} from "@tanstack/react-query";
import type { AuthContext } from "./auth";
import type { TaskCommentRecord } from "./comments";
import { listTaskComments } from "./comments";
import { type PocketBaseRealtimeEvent, pb } from "./pocketbase";
import { queryKeys } from "./query-keys";
import { createPocketBaseRealtimeStream } from "./realtime-stream";

type CommentStreamChunk =
	| {
			kind: "snapshot";
			data: TaskCommentRecord[];
	  }
	| {
			kind: "event";
			event: PocketBaseRealtimeEvent<TaskCommentRecord>;
	  };

export function taskCommentsSnapshotQueryOptions(
	auth: AuthContext,
	taskId: string,
) {
	return queryOptions({
		queryKey: queryKeys.comments.list({ taskId }),
		queryFn: async () => listTaskComments(auth, taskId),
	});
}

export function taskCommentsLiveQueryOptions(
	auth: AuthContext,
	taskId: string,
) {
	return queryOptions({
		queryKey: queryKeys.comments.list({ taskId }),
		refetchOnMount: "always",
		queryFn: streamedQuery<CommentStreamChunk, TaskCommentRecord[]>({
			initialValue: [],
			refetchMode: "append",
			reducer: reduceComments,
			streamFn: async ({ client, queryKey, signal }) => {
				async function* stream() {
					const existing = client.getQueryData<TaskCommentRecord[]>(queryKey);

					if (!existing) {
						yield {
							kind: "snapshot",
							data: await listTaskComments(auth, taskId),
						} satisfies CommentStreamChunk;
					}

					yield* createTaskCommentsStream(signal, taskId);
				}

				return stream();
			},
		}),
	});
}

function reduceComments(
	current: TaskCommentRecord[],
	chunk: CommentStreamChunk,
): TaskCommentRecord[] {
	if (chunk.kind === "snapshot") {
		return sortComments(chunk.data);
	}

	const record = chunk.event.record;

	if (chunk.event.action === "delete") {
		return current.filter((item) => item.id !== record.id);
	}

	const nextItems = current.some((item) => item.id === record.id)
		? current.map((item) => (item.id === record.id ? record : item))
		: [...current, record];

	return sortComments(nextItems);
}

function sortComments(items: TaskCommentRecord[]) {
	return [...items].sort((left, right) => {
		// Sort by createdAt ascending (oldest first)
		const leftDate = left.createdAt ?? "";
		const rightDate = right.createdAt ?? "";

		if (leftDate !== rightDate) {
			return leftDate.localeCompare(rightDate);
		}

		return left.id.localeCompare(right.id);
	});
}

async function* createTaskCommentsStream(
	signal: AbortSignal | undefined,
	taskId: string,
): AsyncIterable<CommentStreamChunk> {
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
