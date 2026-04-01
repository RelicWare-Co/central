import type { RecordModel, RecordSubscribeOptions } from "pocketbase";
import {
	type PocketBaseRealtimeEvent,
	subscribeToCollection,
} from "#/lib/pocketbase";

type AsyncQueue<T> = {
	close: () => void;
	push: (value: T) => void;
	[Symbol.asyncIterator]: () => AsyncIterator<T>;
};

function createAsyncQueue<T>(): AsyncQueue<T> {
	const values: T[] = [];
	const waiters: Array<(result: IteratorResult<T>) => void> = [];
	let closed = false;

	function flush(result: IteratorResult<T>) {
		const next = waiters.shift();

		if (next) {
			next(result);
		} else if (!result.done) {
			values.push(result.value);
		}
	}

	return {
		close() {
			if (closed) {
				return;
			}

			closed = true;

			while (waiters.length > 0) {
				const next = waiters.shift();

				if (next) {
					next({ done: true, value: undefined as never });
				}
			}
		},
		push(value) {
			if (closed) {
				return;
			}

			flush({ done: false, value });
		},
		async *[Symbol.asyncIterator]() {
			while (true) {
				if (values.length > 0) {
					yield values.shift() as T;
					continue;
				}

				if (closed) {
					return;
				}

				const next = await new Promise<IteratorResult<T>>((resolve) => {
					waiters.push(resolve);
				});

				if (next.done) {
					return;
				}

				yield next.value;
			}
		},
	};
}

export async function* createPocketBaseRealtimeStream<
	TRecord extends RecordModel = RecordModel,
>(
	collection: string,
	topic: string,
	options?: RecordSubscribeOptions,
	signal?: AbortSignal,
) {
	const queue = createAsyncQueue<PocketBaseRealtimeEvent<TRecord>>();
	const abortListener = () => {
		queue.close();
	};

	signal?.addEventListener("abort", abortListener, { once: true });

	let unsubscribe: null | (() => Promise<void>) = null;

	try {
		unsubscribe = await subscribeToCollection<TRecord>(
			collection,
			topic,
			(event) => {
				queue.push(event);
			},
			options,
		);

		for await (const event of queue) {
			yield event;
		}
	} finally {
		signal?.removeEventListener("abort", abortListener);
		queue.close();

		if (unsubscribe) {
			await unsubscribe();
		}
	}
}
