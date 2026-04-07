import { isPast, isToday, parseISO } from "date-fns";
import type { RecordModel } from "pocketbase";
import type { AuthContext } from "#/lib/auth";
import { requireAuthUser, runWithAuthRedirect } from "#/lib/data-access";
import { formatDateForPocketBase } from "#/lib/formatting";
import { pb } from "#/lib/pocketbase";
import type { ProjectRecord } from "#/lib/projects";
import { serializeRichTextValue } from "#/lib/rich-text";

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
	const userId = requireAuthUser(auth, "/app/my-tasks");

	return listTasks(auth, {
		filter: pb.filter("assignee = {:assignee}", { assignee: userId }),
		redirectTo: "/app/my-tasks",
	});
}

export async function listTodayTasks(auth: AuthContext) {
	const userId = requireAuthUser(auth, "/app/today");

	const now = new Date();
	const endOfDay = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		23,
		59,
		59,
		999,
	)
		.toISOString()
		.replace("T", " ");

	return listTasks(auth, {
		filter: pb.filter(
			"assignee = {:assignee} && status != 'completed' && status != 'canceled' && (dueDate <= {:endOfDay} || priority = 'high' || status = 'in_progress')",
			{ assignee: userId, endOfDay },
		),
		redirectTo: "/app/today",
	});
}

export async function listUpcomingTasks(auth: AuthContext) {
	const userId = requireAuthUser(auth, "/app/upcoming");

	const now = new Date();
	const endOfDay = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		23,
		59,
		59,
		999,
	)
		.toISOString()
		.replace("T", " ");

	return listTasks(auth, {
		filter: pb.filter(
			"assignee = {:assignee} && status != 'completed' && status != 'canceled' && dueDate > {:endOfDay}",
			{ assignee: userId, endOfDay },
		),
		redirectTo: "/app/upcoming",
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
	return runWithAuthRedirect(
		auth,
		redirectTo,
		async () =>
			pb.collection("tasks").getOne<TaskRecord>(taskId, {
				expand: "project,assignee,createdBy",
			}),
		{
			notFoundOn404: true,
		},
	);
}

export async function getTaskFormOptions(
	auth: AuthContext,
	redirectTo = "/app/tasks/new",
) {
	const userId = requireAuthUser(auth, redirectTo);

	return runWithAuthRedirect(auth, redirectTo, async () => {
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
	});
}

export async function listSubtasksForTask(
	auth: AuthContext,
	taskId: string,
	redirectTo = `/app/tasks/${taskId}`,
) {
	return runWithAuthRedirect(auth, redirectTo, async () =>
		pb.collection("subtasks").getFullList<SubtaskRecord>({
			filter: pb.filter("task = {:task}", { task: taskId }),
			sort: "+position",
		}),
	);
}

export async function createTask(
	auth: AuthContext,
	currentUserId: string,
	values: TaskFormValues,
	redirectTo = "/app/tasks/new",
) {
	return runWithAuthRedirect(auth, redirectTo, async () =>
		pb.collection("tasks").create<TaskRecord>({
			...buildTaskPayload(values),
			createdBy: currentUserId,
		}),
	);
}

export async function updateTask(
	auth: AuthContext,
	taskId: string,
	values: TaskFormValues,
	existingCompletedAt?: string,
	redirectTo = `/app/tasks/${taskId}`,
) {
	return runWithAuthRedirect(
		auth,
		redirectTo,
		async () =>
			pb
				.collection("tasks")
				.update<TaskRecord>(
					taskId,
					buildTaskPayload(values, existingCompletedAt),
				),
		{
			notFoundOn404: true,
		},
	);
}

export async function createSubtask(
	auth: AuthContext,
	taskId: string,
	title: string,
	position: number,
	redirectTo = `/app/tasks/${taskId}`,
) {
	return runWithAuthRedirect(auth, redirectTo, async () =>
		pb.collection("subtasks").create<SubtaskRecord>({
			isCompleted: false,
			position,
			task: taskId,
			title: title.trim(),
		}),
	);
}

export async function updateSubtaskCompletion(
	auth: AuthContext,
	subtaskId: string,
	isCompleted: boolean,
	redirectTo = "/app/tasks",
) {
	return runWithAuthRedirect(
		auth,
		redirectTo,
		async () =>
			pb.collection("subtasks").update<SubtaskRecord>(subtaskId, {
				completedAt: isCompleted ? new Date().toISOString() : null,
				isCompleted,
			}),
		{
			notFoundOn404: true,
		},
	);
}

export async function deleteSubtask(
	auth: AuthContext,
	subtaskId: string,
	redirectTo = "/app/tasks",
) {
	return runWithAuthRedirect(
		auth,
		redirectTo,
		async () => pb.collection("subtasks").delete(subtaskId),
		{
			notFoundOn404: true,
		},
	);
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

export function formatTaskStatusLabel(value: TaskFormValues["status"]): string {
	switch (value) {
		case "in_progress":
			return "In Progress";
		case "blocked":
			return "Blocked";
		case "completed":
			return "Completed";
		case "canceled":
			return "Canceled";
		default:
			return "Pending";
	}
}

export function formatTaskPriorityLabel(
	value: TaskFormValues["priority"],
): string {
	switch (value) {
		case "high":
			return "High";
		case "low":
			return "Low";
		default:
			return "Medium";
	}
}

export function getTaskProjectLabel(
	projectId: string,
	projects: Pick<ProjectRecord, "id" | "name" | "slug" | "status">[],
): string {
	if (!projectId) {
		return "Inbox";
	}

	const project = projects.find((item) => item.id === projectId);

	if (!project) {
		return "Unknown project";
	}

	return project.slug ? `${project.name} · ${project.slug}` : project.name;
}

export function getTaskAssigneeLabel(
	assigneeId: string,
	users: Pick<TaskUser, "email" | "id" | "name" | "role">[],
): string {
	if (!assigneeId) {
		return "Unassigned";
	}

	const user = users.find((item) => item.id === assigneeId);

	return user?.name || user?.email || user?.id || "Unknown user";
}

export function getTaskFormValues(task: TaskRecord) {
	return {
		assignee: task.assignee ?? "",
		blockedReason: task.blockedReason ?? "",
		description: task.description ?? "",
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
	return runWithAuthRedirect(auth, options.redirectTo, async () => {
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
	});
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
	const normalizedDescription = serializeRichTextValue(values.description);
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
