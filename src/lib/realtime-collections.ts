import type { RecordModel } from "pocketbase";
import type { PocketBaseRealtimeEvent } from "#/lib/pocketbase";

export function applyRealtimeCollectionEvent<TRecord extends RecordModel>(
	items: TRecord[],
	event: PocketBaseRealtimeEvent<TRecord>,
	options: {
		includeRecord?: (record: TRecord) => boolean;
		sort?: (records: TRecord[]) => TRecord[];
	} = {},
) {
	const includeRecord = options.includeRecord ?? (() => true);

	if (event.action === "delete" || !includeRecord(event.record)) {
		const nextItems = items.filter((item) => item.id !== event.record.id);
		return options.sort ? options.sort(nextItems) : nextItems;
	}

	const hasRecord = items.some((item) => item.id === event.record.id);
	const nextItems = hasRecord
		? items.map((item) => (item.id === event.record.id ? event.record : item))
		: [...items, event.record];

	return options.sort ? options.sort(nextItems) : nextItems;
}
