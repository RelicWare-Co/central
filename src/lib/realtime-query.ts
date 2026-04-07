import {
	queryOptions,
	experimental_streamedQuery as streamedQuery,
} from "@tanstack/react-query";

type SnapshotChunk<TData> = {
	data: TData;
	kind: "snapshot";
};

export function createSnapshotQueryOptions<TData>(
	queryKey: readonly unknown[],
	queryFn: () => Promise<TData>,
) {
	return queryOptions({
		queryFn,
		queryKey,
	});
}

export function createLiveStreamQueryOptions<TChunk, TData>({
	initialValue,
	queryKey,
	reducer,
	streamEvents,
	toSnapshotChunk,
	loadSnapshot,
}: {
	initialValue: TData;
	queryKey: readonly unknown[];
	reducer: (current: TData, chunk: TChunk | SnapshotChunk<TData>) => TData;
	streamEvents: (signal: AbortSignal | undefined) => AsyncIterable<TChunk>;
	toSnapshotChunk?: (data: TData) => TChunk | SnapshotChunk<TData>;
	loadSnapshot: () => Promise<TData>;
}) {
	const makeSnapshotChunk =
		toSnapshotChunk ??
		((data: TData) =>
			({ data, kind: "snapshot" }) satisfies SnapshotChunk<TData>);

	return queryOptions({
		queryKey,
		refetchOnMount: "always",
		queryFn: streamedQuery<TChunk | SnapshotChunk<TData>, TData>({
			initialValue,
			refetchMode: "append",
			reducer,
			streamFn: async ({ client, queryKey: activeQueryKey, signal }) => {
				async function* stream() {
					const existing = client.getQueryData<TData>(activeQueryKey);

					if (!existing) {
						yield makeSnapshotChunk(await loadSnapshot());
					}

					yield* streamEvents(signal);
				}

				return stream();
			},
		}),
	});
}
