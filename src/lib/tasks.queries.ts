import {
	queryOptions,
	experimental_streamedQuery as streamedQuery,
} from "@tanstack/react-query";
import { format } from "date-fns";
import type { AuthContext } from "#/lib/auth";
import { type PocketBaseRealtimeEvent, pb } from "#/lib/pocketbase";
import { queryKeys } from "#/lib/query-keys";
import { createPocketBaseRealtimeStream } from "#/lib/realtime-stream";
import {
	getTaskById,
	getTaskFormOptions,
	listInboxTasks,
	listMyTasks,
	listProjectTasks,
	listSubtasksForTask,
	listTodayTasks,
	listUpcomingTasks,
	type SubtaskRecord,
	summarizeTasks,
	type TaskCollectionData,
	type TaskFormOptions,
	type TaskRecord,
} from "#/lib/tasks";

type TaskCollectionStreamChunk =
	| {
			kind: "snapshot";
			data: TaskCollectionData;
	  }
	| {
			kind: "event";
			event: PocketBaseRealtimeEvent<TaskRecord>;
	  };

type TaskRecordStreamChunk =
	| {
			kind: "snapshot";
			data: TaskRecord;
	  }
	| {
			kind: "event";
			event: PocketBaseRealtimeEvent<TaskRecord>;
	  };

type SubtaskStreamChunk =
	| {
			kind: "snapshot";
			data: SubtaskRecord[];
	  }
	| {
			kind: "event";
			event: PocketBaseRealtimeEvent<SubtaskRecord>;
	  };

export function inboxTasksSnapshotQueryOptions(auth: AuthContext) {
	return taskListSnapshotQueryOptions(auth, {
		kind: "inbox",
	});
}

export function inboxTasksLiveQueryOptions(auth: AuthContext) {
	return taskListLiveQueryOptions(auth, {
		kind: "inbox",
	});
}

export function myTasksSnapshotQueryOptions(auth: AuthContext) {
	const userId = getCurrentUserIdOrEmpty(auth);

	return taskListSnapshotQueryOptions(auth, {
		kind: "my-tasks",
		userId,
	});
}

export function myTasksLiveQueryOptions(auth: AuthContext) {
	const userId = getCurrentUserIdOrEmpty(auth);

	return taskListLiveQueryOptions(auth, {
		kind: "my-tasks",
		userId,
	});
}

export function todayTasksSnapshotQueryOptions(auth: AuthContext) {
	const userId = getCurrentUserIdOrEmpty(auth);
	const dayKey = getLocalDayKey();

	return taskListSnapshotQueryOptions(auth, {
		dayKey,
		kind: "today",
		userId,
	});
}

export function todayTasksLiveQueryOptions(auth: AuthContext) {
	const userId = getCurrentUserIdOrEmpty(auth);
	const dayKey = getLocalDayKey();

	return taskListLiveQueryOptions(auth, {
		dayKey,
		kind: "today",
		userId,
	});
}

export function upcomingTasksSnapshotQueryOptions(auth: AuthContext) {
	const userId = getCurrentUserIdOrEmpty(auth);
	const dayKey = getLocalDayKey();

	return taskListSnapshotQueryOptions(auth, {
		dayKey,
		kind: "upcoming",
		userId,
	});
}

export function upcomingTasksLiveQueryOptions(auth: AuthContext) {
	const userId = getCurrentUserIdOrEmpty(auth);
	const dayKey = getLocalDayKey();

	return taskListLiveQueryOptions(auth, {
		dayKey,
		kind: "upcoming",
		userId,
	});
}

export function projectTasksSnapshotQueryOptions(
	auth: AuthContext,
	projectId: string,
) {
	return taskListSnapshotQueryOptions(auth, {
		kind: "project",
		projectId,
	});
}

export function projectTasksLiveQueryOptions(
	auth: AuthContext,
	projectId: string,
) {
	return taskListLiveQueryOptions(auth, {
		kind: "project",
		projectId,
	});
}

export function taskDetailSnapshotQueryOptions(
	auth: AuthContext,
	taskId: string,
) {
	return queryOptions({
		queryKey: queryKeys.tasks.detail(taskId),
		queryFn: async () => getTaskById(auth, taskId),
	});
}

export function taskDetailLiveQueryOptions(auth: AuthContext, taskId: string) {
	return queryOptions({
		queryKey: queryKeys.tasks.detail(taskId),
		queryFn: streamedQuery<TaskRecordStreamChunk, TaskRecord>({
			initialValue: {} as TaskRecord,
			refetchMode: "append",
			reducer: reduceTaskRecord,
			streamFn: async ({ client, queryKey, signal }) => {
				async function* stream() {
					const existing = client.getQueryData<TaskRecord>(queryKey);

					if (!existing) {
						yield {
							kind: "snapshot",
							data: await getTaskById(auth, taskId),
						} satisfies TaskRecordStreamChunk;
					}

					yield* createTaskEventsStream(signal, taskId);
				}

				return stream();
			},
		}),
	});
}

export function taskFormOptionsSnapshotQueryOptions(auth: AuthContext) {
	return queryOptions({
		queryKey: queryKeys.tasks.formOptions,
		queryFn: async (): Promise<TaskFormOptions> => getTaskFormOptions(auth),
	});
}

export function taskSubtasksSnapshotQueryOptions(
	auth: AuthContext,
	taskId: string,
) {
	return queryOptions({
		queryKey: queryKeys.tasks.subtasks(taskId),
		queryFn: async () => listSubtasksForTask(auth, taskId),
	});
}

export function taskSubtasksLiveQueryOptions(
	auth: AuthContext,
	taskId: string,
) {
	return queryOptions({
		queryKey: queryKeys.tasks.subtasks(taskId),
		queryFn: streamedQuery<SubtaskStreamChunk, SubtaskRecord[]>({
			initialValue: [],
			refetchMode: "append",
			reducer: reduceSubtasks,
			streamFn: async ({ client, queryKey, signal }) => {
				async function* stream() {
					const existing = client.getQueryData<SubtaskRecord[]>(queryKey);

					if (!existing) {
						yield {
							kind: "snapshot",
							data: await listSubtasksForTask(auth, taskId),
						} satisfies SubtaskStreamChunk;
					}

					yield* createSubtaskEventsStream(signal, taskId);
				}

				return stream();
			},
		}),
	});
}

function taskListSnapshotQueryOptions(
	auth: AuthContext,
	scope:
		| {
				kind: "inbox";
		  }
		| {
				kind: "my-tasks";
				userId: string;
		  }
		| {
				kind: "today";
				userId: string;
				dayKey: string;
		  }
		| {
				kind: "upcoming";
				userId: string;
				dayKey: string;
		  }
		| {
				kind: "project";
				projectId: string;
		  },
) {
	return queryOptions({
		queryKey: queryKeys.tasks.list(scope),
		queryFn: async () => loadTasksForScope(auth, scope),
	});
}

function taskListLiveQueryOptions(
	auth: AuthContext,
	scope:
		| {
				kind: "inbox";
		  }
		| {
				kind: "my-tasks";
				userId: string;
		  }
		| {
				kind: "today";
				userId: string;
				dayKey: string;
		  }
		| {
				kind: "upcoming";
				userId: string;
				dayKey: string;
		  }
		| {
				kind: "project";
				projectId: string;
		  },
) {
	return queryOptions({
		queryKey: queryKeys.tasks.list(scope),
		queryFn: streamedQuery<TaskCollectionStreamChunk, TaskCollectionData>({
			initialValue: getEmptyTaskCollectionData(),
			refetchMode: "append",
			reducer: (current, chunk) => reduceTaskCollection(current, chunk, scope),
			streamFn: async ({ client, queryKey, signal }) => {
				async function* stream() {
					const existing = client.getQueryData<TaskCollectionData>(queryKey);

					if (!existing) {
						yield {
							kind: "snapshot",
							data: await loadTasksForScope(auth, scope),
						} satisfies TaskCollectionStreamChunk;
					}

					yield* createTaskEventsStream(signal);
				}

				return stream();
			},
		}),
	});
}

function loadTasksForScope(
	auth: AuthContext,
	scope:
		| {
				kind: "inbox";
		  }
		| {
				kind: "my-tasks";
				userId: string;
		  }
		| {
				kind: "today";
				userId: string;
				dayKey: string;
		  }
		| {
				kind: "upcoming";
				userId: string;
				dayKey: string;
		  }
		| {
				kind: "project";
				projectId: string;
		  },
) {
	switch (scope.kind) {
		case "inbox":
			return listInboxTasks(auth);
		case "my-tasks":
			return listMyTasks(auth);
		case "today":
			return listTodayTasks(auth);
		case "upcoming":
			return listUpcomingTasks(auth);
		case "project":
			return listProjectTasks(auth, scope.projectId);
	}
}

function reduceTaskCollection(
	current: TaskCollectionData,
	chunk: TaskCollectionStreamChunk,
	scope:
		| {
				kind: "inbox";
		  }
		| {
				kind: "my-tasks";
				userId: string;
		  }
		| {
				kind: "today";
				userId: string;
				dayKey: string;
		  }
		| {
				kind: "upcoming";
				userId: string;
				dayKey: string;
		  }
		| {
				kind: "project";
				projectId: string;
		  },
): TaskCollectionData {
	if (chunk.kind === "snapshot") {
		return normalizeTaskCollection(chunk.data.items);
	}

	const nextItems = applyTaskEvent(current.items, chunk.event, scope);

	return normalizeTaskCollection(nextItems);
}

function reduceTaskRecord(
	current: TaskRecord,
	chunk: TaskRecordStreamChunk,
): TaskRecord {
	if (chunk.kind === "snapshot") {
		return chunk.data;
	}

	if (chunk.event.action === "delete") {
		return current;
	}

	return chunk.event.record;
}

function reduceSubtasks(
	current: SubtaskRecord[],
	chunk: SubtaskStreamChunk,
): SubtaskRecord[] {
	if (chunk.kind === "snapshot") {
		return sortSubtasks(chunk.data);
	}

	const record = chunk.event.record;

	if (chunk.event.action === "delete") {
		return current.filter((item) => item.id !== record.id);
	}

	const nextSubtasks = current.some((item) => item.id === record.id)
		? current.map((item) => (item.id === record.id ? record : item))
		: [...current, record];

	return sortSubtasks(nextSubtasks);
}

function normalizeTaskCollection(items: TaskRecord[]): TaskCollectionData {
	const nextItems = sortTasks(items.filter((task) => task.isArchived !== true));

	return {
		items: nextItems,
		summary: summarizeTasks(nextItems),
	};
}

function getEmptyTaskCollectionData(): TaskCollectionData {
	return {
		items: [],
		summary: {
			blocked: 0,
			completed: 0,
			dueToday: 0,
			inProgress: 0,
			overdue: 0,
			total: 0,
		},
	};
}

function applyTaskEvent(
	items: TaskRecord[],
	event: PocketBaseRealtimeEvent<TaskRecord>,
	scope:
		| {
				kind: "inbox";
		  }
		| {
				kind: "my-tasks";
				userId: string;
		  }
		| {
				kind: "today";
				userId: string;
				dayKey: string;
		  }
		| {
				kind: "upcoming";
				userId: string;
				dayKey: string;
		  }
		| {
				kind: "project";
				projectId: string;
		  },
) {
	if (event.action === "delete" || !taskMatchesScope(event.record, scope)) {
		return items.filter((task) => task.id !== event.record.id);
	}

	const hasRecord = items.some((task) => task.id === event.record.id);
	const nextItems = hasRecord
		? items.map((task) => (task.id === event.record.id ? event.record : task))
		: [...items, event.record];

	return sortTasks(nextItems);
}

function taskMatchesScope(
	task: TaskRecord,
	scope:
		| {
				kind: "inbox";
		  }
		| {
				kind: "my-tasks";
				userId: string;
		  }
		| {
				kind: "today";
				userId: string;
				dayKey: string;
		  }
		| {
				kind: "upcoming";
				userId: string;
				dayKey: string;
		  }
		| {
				kind: "project";
				projectId: string;
		  },
) {
	if (task.isArchived) {
		return false;
	}

	switch (scope.kind) {
		case "inbox":
			return task.project === "" || task.project === null || !task.project;
		case "my-tasks":
			return task.assignee === scope.userId;
		case "today":
			return isTaskTodayOrOverdue(task, scope.userId, scope.dayKey);
		case "upcoming":
			return isTaskUpcoming(task, scope.userId, scope.dayKey);
		case "project":
			return task.project === scope.projectId;
	}
}

function isTaskTodayOrOverdue(
	task: TaskRecord,
	userId: string,
	dayKey: string,
) {
	if (task.assignee !== userId) {
		return false;
	}

	if (task.status === "completed" || task.status === "canceled") {
		return false;
	}

	const endOfDay = getEndOfDay(dayKey);
	const dueDate = task.dueDate ? new Date(task.dueDate) : null;
	const dueDateLabel =
		dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null;

	return (
		task.priority === "high" ||
		task.status === "in_progress" ||
		(Boolean(dueDateLabel) && dueDateLabel <= endOfDay)
	);
}

function isTaskUpcoming(task: TaskRecord, userId: string, dayKey: string) {
	if (task.assignee !== userId) {
		return false;
	}

	if (task.status === "completed" || task.status === "canceled") {
		return false;
	}

	const endOfDay = getEndOfDay(dayKey);
	const dueDate = task.dueDate ? new Date(task.dueDate) : null;

	return Boolean(
		dueDate && !Number.isNaN(dueDate.getTime()) && dueDate > endOfDay,
	);
}

function getEndOfDay(dayKey: string) {
	const [year, month, day] = dayKey.split("-").map((value) => Number(value));

	return new Date(year, month - 1, day, 23, 59, 59, 999);
}

function sortTasks(items: TaskRecord[]) {
	return [...items].sort((left, right) => {
		const leftDueDate = left.dueDate ?? "";
		const rightDueDate = right.dueDate ?? "";

		if (leftDueDate !== rightDueDate) {
			return leftDueDate.localeCompare(rightDueDate);
		}

		if (left.title !== right.title) {
			return left.title.localeCompare(right.title);
		}

		return left.id.localeCompare(right.id);
	});
}

function sortSubtasks(items: SubtaskRecord[]) {
	return [...items].sort((left, right) => {
		const leftPosition = left.position ?? Number.MAX_SAFE_INTEGER;
		const rightPosition = right.position ?? Number.MAX_SAFE_INTEGER;

		if (leftPosition !== rightPosition) {
			return leftPosition - rightPosition;
		}

		return left.id.localeCompare(right.id);
	});
}

function createTaskEventsStream(signal?: AbortSignal, topic = "*") {
	return createPocketBaseRealtimeStream<TaskRecord>(
		"tasks",
		topic,
		{
			expand: "project,assignee,createdBy",
		},
		signal,
	);
}

function createSubtaskEventsStream(signal?: AbortSignal, taskId: string) {
	return createPocketBaseRealtimeStream<SubtaskRecord>(
		"subtasks",
		"*",
		{
			filter: pb.filter("task = {:task}", { task: taskId }),
		},
		signal,
	);
}

function getCurrentUserIdOrEmpty(auth: AuthContext) {
	return auth.getState().user?.id ?? "";
}

function getLocalDayKey() {
	return format(new Date(), "yyyy-MM-dd");
}
