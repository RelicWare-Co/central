import { useRouter } from "@tanstack/react-router";
import type { RecordModel, RecordSubscribeOptions } from "pocketbase";
import { startTransition, useEffect, useEffectEvent, useRef } from "react";
import {
	type PocketBaseRealtimeEvent,
	subscribeToCollection,
} from "#/lib/pocketbase";

type UsePocketBaseRealtimeSubscriptionOptions<
	TRecord extends RecordModel = RecordModel,
> = {
	collection: string;
	enabled?: boolean;
	fields?: RecordSubscribeOptions["fields"];
	filter?: RecordSubscribeOptions["filter"];
	expand?: RecordSubscribeOptions["expand"];
	onEvent: (event: PocketBaseRealtimeEvent<TRecord>) => void;
	topic: string;
};

type UsePocketBaseRealtimeInvalidateOptions<
	TRecord extends RecordModel = RecordModel,
> = Omit<UsePocketBaseRealtimeSubscriptionOptions<TRecord>, "onEvent"> & {
	shouldInvalidate?: (event: PocketBaseRealtimeEvent<TRecord>) => boolean;
};

export function usePocketBaseRealtimeSubscription<
	TRecord extends RecordModel = RecordModel,
>({
	collection,
	enabled = true,
	fields,
	filter,
	expand,
	onEvent,
	topic,
}: UsePocketBaseRealtimeSubscriptionOptions<TRecord>) {
	const handleEvent = useEffectEvent(onEvent);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		let isMounted = true;
		let unsubscribe: null | (() => Promise<void>) = null;

		void subscribeToCollection<TRecord>(
			collection,
			topic,
			(event) => {
				handleEvent(event);
			},
			buildSubscribeOptions({
				expand,
				fields,
				filter,
			}),
		)
			.then((nextUnsubscribe) => {
				if (!isMounted) {
					void nextUnsubscribe();
					return;
				}

				unsubscribe = nextUnsubscribe;
			})
			.catch((error) => {
				if (isMounted) {
					console.error(
						`PocketBase realtime subscription failed for ${collection}:${topic}`,
						error,
					);
				}
			});

		return () => {
			isMounted = false;

			if (unsubscribe) {
				void unsubscribe();
			}
		};
	}, [collection, enabled, expand, fields, filter, topic]);
}

export function usePocketBaseRealtimeInvalidate<
	TRecord extends RecordModel = RecordModel,
>({
	collection,
	enabled = true,
	fields,
	filter,
	expand,
	shouldInvalidate,
	topic,
}: UsePocketBaseRealtimeInvalidateOptions<TRecord>) {
	const router = useRouter();
	const invalidateInFlightRef = useRef(false);
	const handleEvent = useEffectEvent(
		(event: PocketBaseRealtimeEvent<TRecord>) => {
			if (shouldInvalidate && !shouldInvalidate(event)) {
				return;
			}

			if (invalidateInFlightRef.current) {
				return;
			}

			invalidateInFlightRef.current = true;

			startTransition(() => {
				void router.invalidate().finally(() => {
					invalidateInFlightRef.current = false;
				});
			});
		},
	);

	usePocketBaseRealtimeSubscription<TRecord>({
		collection,
		enabled,
		expand,
		fields,
		filter,
		onEvent: handleEvent,
		topic,
	});
}

function buildSubscribeOptions({
	expand,
	fields,
	filter,
}: {
	expand?: RecordSubscribeOptions["expand"];
	fields?: RecordSubscribeOptions["fields"];
	filter?: RecordSubscribeOptions["filter"];
}) {
	if (!expand && !fields && !filter) {
		return undefined;
	}

	return {
		expand,
		fields,
		filter,
	} satisfies RecordSubscribeOptions;
}
