import {
	queryOptions,
	experimental_streamedQuery as streamedQuery,
} from "@tanstack/react-query";
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
	return queryOptions({
		queryKey: queryKeys.projects.list,
		queryFn: async () => listProjects(auth),
	});
}

export function projectsListLiveQueryOptions(auth: AuthContext) {
	return queryOptions({
		queryKey: queryKeys.projects.list,
		refetchOnMount: "always",
		queryFn: streamedQuery<ProjectCollectionStreamChunk, ProjectCollectionData>(
			{
				initialValue: getEmptyProjectCollectionData(),
				refetchMode: "append",
				reducer: reduceProjectCollection,
				streamFn: async ({ client, queryKey, signal }) => {
					async function* stream() {
						const existing =
							client.getQueryData<ProjectCollectionData>(queryKey);

						if (!existing) {
							yield {
								kind: "snapshot",
								data: await listProjects(auth),
							} satisfies ProjectCollectionStreamChunk;
						}

						yield* createProjectEventsStream(signal, "*");
					}

					return stream();
				},
			},
		),
	});
}

export function projectDetailSnapshotQueryOptions(
	auth: AuthContext,
	projectId: string,
) {
	return queryOptions({
		queryKey: queryKeys.projects.detail(projectId),
		queryFn: async () => getProjectById(auth, projectId),
	});
}

export function projectDetailLiveQueryOptions(
	auth: AuthContext,
	projectId: string,
) {
	return queryOptions({
		queryKey: queryKeys.projects.detail(projectId),
		refetchOnMount: "always",
		queryFn: streamedQuery<ProjectRecordStreamChunk, ProjectRecord>({
			initialValue: {} as ProjectRecord,
			refetchMode: "append",
			reducer: reduceProjectRecord,
			streamFn: async ({ client, queryKey, signal }) => {
				async function* stream() {
					const existing = client.getQueryData<ProjectRecord>(queryKey);

					if (!existing) {
						yield {
							kind: "snapshot",
							data: await getProjectById(auth, projectId),
						} satisfies ProjectRecordStreamChunk;
					}

					yield* createProjectEventsStream(signal, projectId);
				}

				return stream();
			},
		}),
	});
}

export function projectFormOptionsSnapshotQueryOptions(auth: AuthContext) {
	return queryOptions({
		queryKey: queryKeys.projects.formOptions,
		queryFn: async (): Promise<ProjectFormOptions> =>
			getProjectFormOptions(auth),
	});
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
	if (event.action === "delete" || event.record.isArchived === true) {
		return items.filter((project) => project.id !== event.record.id);
	}

	const hasRecord = items.some((project) => project.id === event.record.id);
	const nextItems = hasRecord
		? items.map((project) =>
				project.id === event.record.id ? event.record : project,
			)
		: [...items, event.record];

	return sortProjects(nextItems);
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
