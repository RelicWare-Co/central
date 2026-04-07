import { describe, expect, it } from "vitest";
import { applyRealtimeCollectionEvent } from "#/lib/realtime-collections";

type Item = {
	id: string;
	isArchived?: boolean;
	name: string;
};

function byNameAsc(items: Item[]) {
	return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

describe("applyRealtimeCollectionEvent", () => {
	it("adds records on create", () => {
		const result = applyRealtimeCollectionEvent<Item>([], {
			action: "create",
			record: {
				id: "1",
				name: "Alpha",
			},
		} as never);

		expect(result).toEqual([
			{
				id: "1",
				name: "Alpha",
			},
		]);
	});

	it("updates records on update", () => {
		const result = applyRealtimeCollectionEvent<Item>(
			[
				{
					id: "1",
					name: "Alpha",
				},
			],
			{
				action: "update",
				record: {
					id: "1",
					name: "Beta",
				},
			} as never,
		);

		expect(result).toEqual([
			{
				id: "1",
				name: "Beta",
			},
		]);
	});

	it("removes records on delete", () => {
		const result = applyRealtimeCollectionEvent<Item>(
			[
				{
					id: "1",
					name: "Alpha",
				},
			],
			{
				action: "delete",
				record: {
					id: "1",
					name: "Alpha",
				},
			} as never,
		);

		expect(result).toEqual([]);
	});

	it("removes records that do not pass includeRecord", () => {
		const result = applyRealtimeCollectionEvent<Item>(
			[
				{
					id: "1",
					name: "Alpha",
				},
			],
			{
				action: "update",
				record: {
					id: "1",
					isArchived: true,
					name: "Alpha",
				},
			} as never,
			{
				includeRecord: (record) => record.isArchived !== true,
			},
		);

		expect(result).toEqual([]);
	});

	it("sorts output when sort is provided", () => {
		const result = applyRealtimeCollectionEvent<Item>(
			[
				{
					id: "2",
					name: "Zulu",
				},
			],
			{
				action: "create",
				record: {
					id: "1",
					name: "Alpha",
				},
			} as never,
			{
				sort: byNameAsc,
			},
		);

		expect(result).toEqual([
			{
				id: "1",
				name: "Alpha",
			},
			{
				id: "2",
				name: "Zulu",
			},
		]);
	});
});
