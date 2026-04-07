import { format } from "date-fns";
import type { AuthContext } from "#/lib/auth";
import { type PocketBaseRealtimeEvent, pb } from "#/lib/pocketbase";
import { queryKeys, type TaskListScope } from "#/lib/query-keys";
import { applyRealtimeCollectionEvent } from "#/lib/realtime-collections";
import {
	createLiveStreamQueryOptions,
	createSnapshotQueryOptions,
} from "#/lib/realtime-query";
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

type SnapshotChunk<TData> = {
	kind: "snapshot";
	data: TData;
};

type TaskEventStreamChunk = {
	kind: "event";
	event: PocketBaseRealtimeEvent<TaskRecord>;
};

type SubtaskEventStreamChunk = {
	kind: "event";
	event: PocketBaseRealtimeEvent<SubtaskRecord>;
};

type TaskCollectionStreamChunk =
	| SnapshotChunk<TaskCollectionData>
	| TaskEventStreamChunk;

type TaskRecordStreamChunk = SnapshotChunk<TaskRecord> | TaskEventStreamChunk;

type SubtaskStreamChunk =
	| SnapshotChunk<SubtaskRecord[]>
	| SubtaskEventStreamChunk;

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
	return createSnapshotQueryOptions(queryKeys.tasks.detail(taskId), async () =>
		getTaskById(auth, taskId),
	);
}

export function taskDetailLiveQueryOptions(auth: AuthContext, taskId: string) {
	return createLiveStreamQueryOptions<TaskEventStreamChunk, TaskRecord>({
		initialValue: {} as TaskRecord,
		queryKey: queryKeys.tasks.detail(taskId),
		reducer: reduceTaskRecord,
		loadSnapshot: async () => getTaskById(auth, taskId),
		streamEvents: (signal) =>
			createTaskEventsStream(signal, {
				topic: taskId,
			}),
	});
}

export function taskFormOptionsSnapshotQueryOptions(auth: AuthContext) {
	return createSnapshotQueryOptions(
		queryKeys.tasks.formOptions,
		async (): Promise<TaskFormOptions> => getTaskFormOptions(auth),
	);
}

export function taskSubtasksSnapshotQueryOptions(
	auth: AuthContext,
	taskId: string,
) {
	return createSnapshotQueryOptions(
		queryKeys.tasks.subtasks(taskId),
		async () => listSubtasksForTask(auth, taskId),
	);
}

export function taskSubtasksLiveQueryOptions(
	auth: AuthContext,
	taskId: string,
) {
	return createLiveStreamQueryOptions<SubtaskEventStreamChunk, SubtaskRecord[]>(
		{
			initialValue: [],
			queryKey: queryKeys.tasks.subtasks(taskId),
			reducer: reduceSubtasks,
			loadSnapshot: async () => listSubtasksForTask(auth, taskId),
			streamEvents: (signal) => createSubtaskEventsStream(signal, taskId),
		},
	);
}

function taskListSnapshotQueryOptions(auth: AuthContext, scope: TaskListScope) {
	return createSnapshotQueryOptions(queryKeys.tasks.list(scope), async () =>
		loadTasksForScope(auth, scope),
	);
}

function taskListLiveQueryOptions(auth: AuthContext, scope: TaskListScope) {
	return createLiveStreamQueryOptions<TaskEventStreamChunk, TaskCollectionData>(
		{
			initialValue: getEmptyTaskCollectionData(),
			queryKey: queryKeys.tasks.list(scope),
			reducer: (current, chunk) => reduceTaskCollection(current, chunk, scope),
			loadSnapshot: async () => loadTasksForScope(auth, scope),
			streamEvents: (signal) =>
				createTaskEventsStream(signal, {
					filter: getTaskRealtimeFilter(scope),
				}),
		},
	);
}

function loadTasksForScope(auth: AuthContext, scope: TaskListScope) {
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
	scope: TaskListScope,
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

	return applyRealtimeCollectionEvent(current, chunk.event, {
		sort: sortSubtasks,
	});
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
	scope: TaskListScope,
) {
	return applyRealtimeCollectionEvent(items, event, {
		includeRecord: (record) => taskMatchesScope(record, scope),
		sort: sortTasks,
	});
}

function taskMatchesScope(task: TaskRecord, scope: TaskListScope) {
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
	const parsedDueDate =
		dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null;

	return (
		task.priority === "high" ||
		task.status === "in_progress" ||
		(Boolean(parsedDueDate) && parsedDueDate <= endOfDay)
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

function getTaskRealtimeFilter(scope: TaskListScope) {
	const notArchivedFilter = "(isArchived = false || isArchived = null)";

	switch (scope.kind) {
		case "inbox":
			return joinFilters(notArchivedFilter, "(project = '' || project = null)");
		case "my-tasks":
			return joinFilters(
				notArchivedFilter,
				pb.filter("assignee = {:assignee}", { assignee: scope.userId }),
			);
		case "today":
		case "upcoming":
			return joinFilters(
				notArchivedFilter,
				pb.filter(
					"assignee = {:assignee} && status != 'completed' && status != 'canceled'",
					{ assignee: scope.userId },
				),
			);
		case "project":
			return joinFilters(
				notArchivedFilter,
				pb.filter("project = {:project}", { project: scope.projectId }),
			);
	}
}

function joinFilters(...filters: Array<string | undefined>) {
	const normalizedFilters = filters.filter((filter): filter is string =>
		Boolean(filter && filter.trim().length > 0),
	);

	return normalizedFilters.length > 0
		? normalizedFilters.map((filter) => `(${filter})`).join(" && ")
		: undefined;
}

async function* createTaskEventsStream(
	signal?: AbortSignal,
	options?: {
		topic?: string;
		filter?: string;
	},
): AsyncIterable<TaskEventStreamChunk> {
	for await (const event of createPocketBaseRealtimeStream<TaskRecord>(
		"tasks",
		options?.topic ?? "*",
		{
			expand: "project,assignee,createdBy",
			...(options?.filter ? { filter: options.filter } : {}),
		},
		signal,
	)) {
		yield {
			kind: "event",
			event,
		};
	}
}

async function* createSubtaskEventsStream(
	signal: AbortSignal | undefined,
	taskId: string,
): AsyncIterable<SubtaskEventStreamChunk> {
	for await (const event of createPocketBaseRealtimeStream<SubtaskRecord>(
		"subtasks",
		"*",
		{
			filter: pb.filter("task = {:task}", { task: taskId }),
		},
		signal,
	)) {
		yield {
			kind: "event",
			event,
		};
	}
}

function getCurrentUserIdOrEmpty(auth: AuthContext) {
	return auth.getState().user?.id ?? "";
}

function getLocalDayKey() {
	return format(new Date(), "yyyy-MM-dd");
}
