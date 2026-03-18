import { notFound, redirect } from "@tanstack/react-router";
import { isPast, isToday, parseISO } from "date-fns";
import type { RecordModel } from "pocketbase";
import type { AuthContext } from "#/lib/auth";
import { formatDateForPocketBase } from "#/lib/formatting";
import { pb } from "#/lib/pocketbase";
import type { ProjectRecord } from "#/lib/projects";

export type TaskStatus =
	| "pending"
	| "in_progress"
	| "blocked"
	| "completed"
	| "canceled";

export type TaskPriority = "low" | "medium" | "high";

export type TaskUser = RecordModel & {
	email?: string;
	name?: string;
	role?: string;
	username?: string;
};

export type TaskRecord = RecordModel & {
	assignee?: string;
	blockedReason?: string;
	completedAt?: string;
	createdBy?: string;
	description?: string;
	dueDate?: string;
	isArchived?: boolean;
	priority: TaskPriority;
	project?: string;
	startDate?: string;
	status: TaskStatus;
	title: string;
	expand?: {
		assignee?: TaskUser;
		createdBy?: TaskUser;
		project?: Pick<ProjectRecord, "id" | "name" | "slug" | "status">;
	};
};

export type TaskCollectionData = {
	items: TaskRecord[];
	summary: {
		blocked: number;
		completed: number;
		dueToday: number;
		inProgress: number;
		overdue: number;
		total: number;
	};
};

export type TaskFormValues = {
	assignee: string;
	blockedReason: string;
	description: string;
	dueDate: string;
	priority: TaskPriority;
	project: string;
	startDate: string;
	status: TaskStatus;
	title: string;
};

export type TaskFormOptions = {
	currentUserId: string;
	projects: Pick<ProjectRecord, "id" | "name" | "slug" | "status">[];
	users: Pick<TaskUser, "email" | "id" | "name" | "role">[];
};

export type SubtaskRecord = RecordModel & {
	completedAt?: string;
	isCompleted?: boolean;
	position?: number;
	task: string;
	title: string;
};

export async function listInboxTasks(auth: AuthContext) {
	return listTasks(auth, {
		filter: "(project = '' || project = null)",
		redirectTo: "/app/inbox",
	});
}

export async function listMyTasks(auth: AuthContext) {
	const userId = auth.getState().user?.id;

	if (!userId) {
		auth.logout();

		throw redirect({
			to: "/login",
			search: {
				redirect: "/app/my-tasks",
			},
		});
	}

	return listTasks(auth, {
		filter: pb.filter("assignee = {:assignee}", { assignee: userId }),
		redirectTo: "/app/my-tasks",
	});
}

export async function listProjectTasks(
	auth: AuthContext,
	projectId: string,
	redirectTo = `/app/projects/${projectId}`,
) {
	return listTasks(auth, {
		filter: pb.filter("project = {:project}", { project: projectId }),
		redirectTo,
	});
}

export async function getTaskById(
	auth: AuthContext,
	taskId: string,
	redirectTo = `/app/tasks/${taskId}`,
) {
	try {
		return await pb.collection("tasks").getOne<TaskRecord>(taskId, {
			expand: "project,assignee,createdBy",
		});
	} catch (error) {
		if (isUnauthorizedError(error)) {
			auth.logout();

			throw redirect({
				to: "/login",
				search: {
					redirect: redirectTo,
				},
			});
		}

		if (isNotFoundError(error)) {
			throw notFound();
		}

		throw error;
	}
}

export async function getTaskFormOptions(
	auth: AuthContext,
	redirectTo = "/app/tasks/new",
) {
	const userId = auth.getState().user?.id;

	if (!userId) {
		auth.logout();

		throw redirect({
			to: "/login",
			search: {
				redirect: redirectTo,
			},
		});
	}

	try {
		const [projects, users] = await Promise.all([
			pb
				.collection("projects")
				.getFullList<Pick<ProjectRecord, "id" | "name" | "slug" | "status">>({
					filter: "isArchived = false || isArchived = null",
					sort: "+name",
				}),
			pb
				.collection("users")
				.getFullList<Pick<TaskUser, "email" | "id" | "name" | "role">>({
					filter: "isActive = true || isActive = null",
					sort: "+email",
				}),
		]);

		return {
			currentUserId: userId,
			projects,
			users,
		} satisfies TaskFormOptions;
	} catch (error) {
		if (isUnauthorizedError(error)) {
			auth.logout();

			throw redirect({
				to: "/login",
				search: {
					redirect: redirectTo,
				},
			});
		}

		throw error;
	}
}

export async function listSubtasksForTask(
	auth: AuthContext,
	taskId: string,
	redirectTo = `/app/tasks/${taskId}`,
) {
	try {
		return await pb.collection("subtasks").getFullList<SubtaskRecord>({
			filter: pb.filter("task = {:task}", { task: taskId }),
			sort: "+position",
		});
	} catch (error) {
		if (isUnauthorizedError(error)) {
			auth.logout();

			throw redirect({
				to: "/login",
				search: {
					redirect: redirectTo,
				},
			});
		}

		throw error;
	}
}

export async function createTask(
	currentUserId: string,
	values: TaskFormValues,
) {
	return pb.collection("tasks").create<TaskRecord>({
		...buildTaskPayload(values),
		createdBy: currentUserId,
	});
}

export async function updateTask(
	taskId: string,
	values: TaskFormValues,
	existingCompletedAt?: string,
) {
	return pb
		.collection("tasks")
		.update<TaskRecord>(taskId, buildTaskPayload(values, existingCompletedAt));
}

export async function createSubtask(
	taskId: string,
	title: string,
	position: number,
) {
	return pb.collection("subtasks").create<SubtaskRecord>({
		isCompleted: false,
		position,
		task: taskId,
		title: title.trim(),
	});
}

export async function updateSubtaskCompletion(
	subtaskId: string,
	isCompleted: boolean,
) {
	return pb.collection("subtasks").update<SubtaskRecord>(subtaskId, {
		completedAt: isCompleted ? new Date().toISOString() : null,
		isCompleted,
	});
}

export async function deleteSubtask(subtaskId: string) {
	return pb.collection("subtasks").delete(subtaskId);
}

export function getDefaultTaskFormValues(
	currentUserId: string,
	overrides: Partial<TaskFormValues> = {},
) {
	return {
		assignee: currentUserId,
		blockedReason: "",
		description: "",
		dueDate: "",
		priority: "medium",
		project: "",
		startDate: "",
		status: "pending",
		title: "",
		...overrides,
	} satisfies TaskFormValues;
}

export function getTaskFormValues(task: TaskRecord) {
	return {
		assignee: task.assignee ?? "",
		blockedReason: task.blockedReason ?? "",
		description: task.description?.replace(/<[^>]+>/g, " ").trim() ?? "",
		dueDate: task.dueDate ? formatDateInputValue(task.dueDate) : "",
		priority: task.priority,
		project: task.project ?? "",
		startDate: task.startDate ? formatDateInputValue(task.startDate) : "",
		status: task.status,
		title: task.title,
	} satisfies TaskFormValues;
}

async function listTasks(
	auth: AuthContext,
	options: {
		filter: string;
		redirectTo: string;
	},
) {
	try {
		const items = await pb.collection("tasks").getFullList<TaskRecord>({
			expand: "project,assignee,createdBy",
			filter: [
				"(isArchived = false || isArchived = null)",
				options.filter,
			].join(" && "),
			sort: "+dueDate,+title",
		});

		return {
			items,
			summary: summarizeTasks(items),
		};
	} catch (error) {
		if (isUnauthorizedError(error)) {
			auth.logout();

			throw redirect({
				to: "/login",
				search: {
					redirect: options.redirectTo,
				},
			});
		}

		throw error;
	}
}

export function summarizeTasks(
	items: TaskRecord[],
): TaskCollectionData["summary"] {
	return items.reduce<TaskCollectionData["summary"]>(
		(summary, task) => {
			summary.total += 1;

			if (task.status === "blocked") {
				summary.blocked += 1;
			}

			if (task.status === "completed") {
				summary.completed += 1;
			}

			if (task.status === "in_progress") {
				summary.inProgress += 1;
			}

			if (task.dueDate) {
				const dueDate = parseISO(task.dueDate);

				if (!Number.isNaN(dueDate.getTime())) {
					const isOpenTask =
						task.status !== "completed" && task.status !== "canceled";

					if (isOpenTask && isToday(dueDate)) {
						summary.dueToday += 1;
					}

					if (isOpenTask && isPast(dueDate) && !isToday(dueDate)) {
						summary.overdue += 1;
					}
				}
			}

			return summary;
		},
		{
			blocked: 0,
			completed: 0,
			dueToday: 0,
			inProgress: 0,
			overdue: 0,
			total: 0,
		},
	);
}

function buildTaskPayload(
	values: TaskFormValues,
	existingCompletedAt?: string,
) {
	const normalizedTitle = values.title.trim();
	const normalizedDescription = values.description.trim();
	const normalizedBlockedReason = values.blockedReason.trim();
	const completedAt =
		values.status === "completed"
			? (existingCompletedAt ?? new Date().toISOString())
			: null;

	return {
		assignee: values.assignee || null,
		blockedReason:
			values.status === "blocked" && normalizedBlockedReason
				? normalizedBlockedReason
				: null,
		completedAt,
		description: normalizedDescription || null,
		dueDate: formatDateForPocketBase(values.dueDate),
		priority: values.priority,
		project: values.project || null,
		startDate: formatDateForPocketBase(values.startDate),
		status: values.status,
		title: normalizedTitle,
	};
}

function formatDateInputValue(value: string) {
	const date = parseISO(value);

	if (Number.isNaN(date.getTime())) {
		return "";
	}

	return date.toISOString().slice(0, 10);
}

function isUnauthorizedError(error: unknown) {
	return (
		typeof error === "object" &&
		error !== null &&
		"status" in error &&
		error.status === 401
	);
}

function isNotFoundError(error: unknown) {
	return (
		typeof error === "object" &&
		error !== null &&
		"status" in error &&
		error.status === 404
	);
}
