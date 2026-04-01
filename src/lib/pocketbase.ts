import PocketBase, {
	type RecordModel,
	type RecordSubscribeOptions,
	type RecordSubscription,
	type UnsubscribeFunc,
} from "pocketbase";

const DEFAULT_POCKETBASE_URL = "http://127.0.0.1:8090";

export const pocketbaseUrl =
	import.meta.env.VITE_POCKETBASE_URL ?? DEFAULT_POCKETBASE_URL;

export const pb = new PocketBase(pocketbaseUrl);

// The app intentionally fires concurrent reads from route loaders, suspense
// queries and live streams against the same singleton client. Disabling the SDK
// auto-cancellation prevents valid overlapping requests from surfacing abort
// errors in the UI.
pb.autoCancellation(false);

export type PocketBaseRealtimeEvent<TRecord extends RecordModel = RecordModel> =
	RecordSubscription<TRecord>;

export async function subscribeToCollection<TRecord extends RecordModel>(
	collection: string,
	topic: string,
	callback: (event: PocketBaseRealtimeEvent<TRecord>) => void,
	options?: RecordSubscribeOptions,
): Promise<UnsubscribeFunc> {
	const unsubscribe = await pb
		.collection(collection)
		.subscribe<TRecord>(topic, callback, options);

	return async () => {
		try {
			await unsubscribe();
		} catch {
			// Ignore disconnect races during route transitions and unmount cleanup.
		}
	};
}

export function getCurrentUser() {
	return pb.authStore.record;
}

export function isAuthenticated() {
	return pb.authStore.isValid;
}
