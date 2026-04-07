import type { AuthContext } from "#/lib/auth";
import type { PocketBaseRealtimeEvent } from "#/lib/pocketbase";
import {
	getProjectById,
	getProjectFormOptions,
	listProjects,
	type ProjectFormOptions,
	type ProjectRecord,
	type ProjectsSummary,
} from "#/lib/projects";
import { queryKeys } from "#/lib/query-keys";
import { applyRealtimeCollectionEvent } from "#/lib/realtime-collections";
import {
	createLiveStreamQueryOptions,
	createSnapshotQueryOptions,
} from "#/lib/realtime-query";
import { createPocketBaseRealtimeStream } from "#/lib/realtime-stream";

export type ProjectCollectionData = Awaited<ReturnType<typeof listProjects>>;

type ProjectCollectionStreamChunk =
	| {
			kind: "snapshot";
			data: ProjectCollectionData;
	  }
	| ProjectEventStreamChunk;

type ProjectRecordStreamChunk =
	| {
			kind: "snapshot";
			data: ProjectRecord;
	  }
	| ProjectEventStreamChunk;

type ProjectEventStreamChunk = {
	kind: "event";
	event: PocketBaseRealtimeEvent<ProjectRecord>;
};

export function projectsListSnapshotQueryOptions(auth: AuthContext) {
	return createSnapshotQueryOptions(queryKeys.projects.list, async () =>
		listProjects(auth),
	);
}

export function projectsListLiveQueryOptions(auth: AuthContext) {
	return createLiveStreamQueryOptions<
		ProjectEventStreamChunk,
		ProjectCollectionData
	>({
		initialValue: getEmptyProjectCollectionData(),
		queryKey: queryKeys.projects.list,
		reducer: reduceProjectCollection,
		loadSnapshot: async () => listProjects(auth),
		streamEvents: (signal) => createProjectEventsStream(signal, "*"),
	});
}

export function projectDetailSnapshotQueryOptions(
	auth: AuthContext,
	projectId: string,
) {
	return createSnapshotQueryOptions(
		queryKeys.projects.detail(projectId),
		async () => getProjectById(auth, projectId),
	);
}

export function projectDetailLiveQueryOptions(
	auth: AuthContext,
	projectId: string,
) {
	return createLiveStreamQueryOptions<ProjectEventStreamChunk, ProjectRecord>({
		initialValue: {} as ProjectRecord,
		queryKey: queryKeys.projects.detail(projectId),
		reducer: reduceProjectRecord,
		loadSnapshot: async () => getProjectById(auth, projectId),
		streamEvents: (signal) => createProjectEventsStream(signal, projectId),
	});
}

export function projectFormOptionsSnapshotQueryOptions(auth: AuthContext) {
	return createSnapshotQueryOptions(
		queryKeys.projects.formOptions,
		async (): Promise<ProjectFormOptions> => getProjectFormOptions(auth),
	);
}

function getEmptyProjectCollectionData(): ProjectCollectionData {
	return {
		items: [],
		summary: {
			active: 0,
			blocked: 0,
			completed: 0,
			paused: 0,
			total: 0,
		},
	};
}

function reduceProjectCollection(
	current: ProjectCollectionData,
	chunk: ProjectCollectionStreamChunk,
): ProjectCollectionData {
	if (chunk.kind === "snapshot") {
		return normalizeProjectCollection(chunk.data.items);
	}

	const nextItems = applyProjectEvent(current.items, chunk.event);

	return normalizeProjectCollection(nextItems);
}

function reduceProjectRecord(
	current: ProjectRecord,
	chunk: ProjectRecordStreamChunk,
): ProjectRecord {
	if (chunk.kind === "snapshot") {
		return chunk.data;
	}

	if (chunk.event.action === "delete") {
		return current;
	}

	return chunk.event.record;
}

function normalizeProjectCollection(
	items: ProjectRecord[],
): ProjectCollectionData {
	const nextItems = sortProjects(
		items.filter((project) => project.isArchived !== true),
	);

	return {
		items: nextItems,
		summary: summarizeProjects(nextItems),
	};
}

function applyProjectEvent(
	items: ProjectRecord[],
	event: PocketBaseRealtimeEvent<ProjectRecord>,
) {
	return applyRealtimeCollectionEvent(items, event, {
		includeRecord: (record) => record.isArchived !== true,
		sort: sortProjects,
	});
}

function summarizeProjects(items: ProjectRecord[]): ProjectsSummary {
	return items.reduce<ProjectsSummary>(
		(counts, project) => {
			counts.total += 1;

			if (project.status === "active") {
				counts.active += 1;
			}

			if (project.status === "blocked") {
				counts.blocked += 1;
			}

			if (project.status === "completed") {
				counts.completed += 1;
			}

			if (project.status === "paused") {
				counts.paused += 1;
			}

			return counts;
		},
		{
			active: 0,
			blocked: 0,
			completed: 0,
			paused: 0,
			total: 0,
		},
	);
}

function sortProjects(items: ProjectRecord[]) {
	return [...items].sort((left, right) => {
		const leftDueDate = left.dueDate ?? "";
		const rightDueDate = right.dueDate ?? "";

		if (leftDueDate !== rightDueDate) {
			return leftDueDate.localeCompare(rightDueDate);
		}

		if (left.name !== right.name) {
			return left.name.localeCompare(right.name);
		}

		return left.id.localeCompare(right.id);
	});
}

async function* createProjectEventsStream(
	signal?: AbortSignal,
	topic = "*",
): AsyncIterable<ProjectEventStreamChunk> {
	for await (const event of createPocketBaseRealtimeStream<ProjectRecord>(
		"projects",
		topic,
		{
			expand: "owner",
		},
		signal,
	)) {
		yield {
			kind: "event",
			event,
		};
	}
}
