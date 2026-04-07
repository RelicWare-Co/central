import { describe, expect, it } from "vitest";
import { buildActivityFilter } from "#/lib/activity";

describe("buildActivityFilter", () => {
	it("returns undefined without params", () => {
		expect(buildActivityFilter({})).toBeUndefined();
	});

	it("builds safe filter clauses with pb.filter", () => {
		const filter = buildActivityFilter({
			projectId: "project_1",
			targetUserId: "user_1",
			taskId: "task_1",
		});

		expect(filter).toContain("project = 'project_1'");
		expect(filter).toContain("task = 'task_1'");
		expect(filter).toContain("targetUser = 'user_1'");
		expect(filter).toContain("&&");
	});
});
