import { pb } from "./pocketbase";

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

export async function logActivity({
	action,
	actorId,
	entityType,
	message,
	projectId,
	targetUserId,
	taskId,
}: {
	action: ActivityAction;
	actorId: string;
	entityType: "project" | "task" | "subtask";
	message?: string;
	projectId?: string;
	targetUserId?: string;
	taskId?: string;
}) {
	try {
		await pb.collection("activity_logs").create({
			action,
			actor: actorId,
			entityType,
			eventAt: new Date().toISOString(),
			message,
			project: projectId || null,
			targetUser: targetUserId || null,
			task: taskId || null,
		});
	} catch (error) {
		console.error("Failed to log activity", error);
	}
}

export async function getActivityLogs(options?: {
	limit?: number;
	projectId?: string;
	targetUserId?: string;
	taskId?: string;
}) {
	try {
		const filters = [];

		if (options?.projectId) {
			filters.push(`project = "${options.projectId}"`);
		}
		if (options?.taskId) {
			filters.push(`task = "${options.taskId}"`);
		}
		if (options?.targetUserId) {
			filters.push(`targetUser = "${options.targetUserId}"`);
		}

		return await pb
			.collection("activity_logs")
			.getList<ActivityLogRecord>(1, options?.limit || 20, {
				sort: "-eventAt",
				filter: filters.join(" && "),
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
