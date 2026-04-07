import { pb } from "#/lib/pocketbase";

export type ActivityAction =
	| "created"
	| "updated"
	| "status_changed"
	| "assigned"
	| "priority_changed"
	| "due_date_changed"
	| "blocked"
	| "unblocked"
	| "completed"
	| "archived"
	| "restored"
	| "deleted";

export type ActivityLogRecord = {
	id: string;
	action: ActivityAction;
	actor: string;
	entityType: "project" | "task" | "subtask";
	eventAt: string;
	message?: string;
	project?: string;
	targetUser?: string;
	task?: string;
	expand?: {
		actor?: { name?: string; username?: string; email?: string };
		targetUser?: { name?: string; username?: string; email?: string };
		task?: { title: string };
		project?: { name: string };
	};
};

type ActivityFilterParams = {
	projectId?: string;
	targetUserId?: string;
	taskId?: string;
};

export function buildActivityFilter({
	projectId,
	targetUserId,
	taskId,
}: ActivityFilterParams) {
	const filters: string[] = [];

	if (projectId) {
		filters.push(pb.filter("project = {:project}", { project: projectId }));
	}

	if (taskId) {
		filters.push(pb.filter("task = {:task}", { task: taskId }));
	}

	if (targetUserId) {
		filters.push(
			pb.filter("targetUser = {:targetUser}", { targetUser: targetUserId }),
		);
	}

	return filters.length > 0 ? filters.join(" && ") : undefined;
}

export async function getActivityLogs(options?: {
	limit?: number;
	projectId?: string;
	targetUserId?: string;
	taskId?: string;
}) {
	try {
		const filter = buildActivityFilter({
			projectId: options?.projectId,
			targetUserId: options?.targetUserId,
			taskId: options?.taskId,
		});

		return await pb
			.collection("activity_logs")
			.getList<ActivityLogRecord>(1, options?.limit || 20, {
				sort: "-eventAt",
				...(filter ? { filter } : {}),
				expand: "actor,targetUser,task,project",
			});
	} catch (error) {
		console.error("Failed to get activity logs", error);
		// Return empty list on error so UI doesn't break
		return {
			items: [],
			totalItems: 0,
			totalPages: 0,
			page: 1,
			perPage: options?.limit || 20,
		};
	}
}
