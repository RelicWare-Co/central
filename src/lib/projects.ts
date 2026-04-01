import { notFound, redirect } from "@tanstack/react-router";
import type { RecordModel } from "pocketbase";
import type { AuthContext } from "#/lib/auth";
import { formatDateForPocketBase } from "#/lib/formatting";
import { pb } from "#/lib/pocketbase";
import { serializeRichTextValue } from "#/lib/rich-text";

export type ProjectStatus =
	| "active"
	| "paused"
	| "blocked"
	| "completed"
	| "archived";

export type ProjectOwner = RecordModel & {
	email?: string;
	name?: string;
	role?: string;
	username?: string;
};

export type ProjectRecord = RecordModel & {
	description?: string;
	dueDate?: string;
	isArchived?: boolean;
	name: string;
	owner?: string;
	slug: string;
	startDate?: string;
	status: ProjectStatus;
	expand?: {
		owner?: ProjectOwner;
	};
};

export type ProjectsSummary = {
	active: number;
	blocked: number;
	completed: number;
	paused: number;
	total: number;
};

export type ProjectFormValues = {
	description: string;
	dueDate: string;
	name: string;
	owner: string;
	slug: string;
	startDate: string;
	status: Exclude<ProjectStatus, "archived">;
};

export type ProjectFormOptions = {
	currentUserId: string;
	users: Pick<ProjectOwner, "email" | "id" | "name" | "role">[];
};

export async function listProjects(auth: AuthContext) {
	try {
		const items = await pb.collection("projects").getFullList<ProjectRecord>({
			expand: "owner",
			filter: "isArchived = false || isArchived = null",
			sort: "+dueDate,+name",
		});

		return {
			items,
			summary: items.reduce<ProjectsSummary>(
				(counts, project) => {
					counts.total += 1;

					if (project.status === "active") {
						counts.active += 1;
					}

					if (project.status === "blocked") {
						counts.blocked += 1;
					}

					if (project.status === "completed") {
						counts.completed += 1;
					}

					if (project.status === "paused") {
						counts.paused += 1;
					}

					return counts;
				},
				{
					active: 0,
					blocked: 0,
					completed: 0,
					paused: 0,
					total: 0,
				},
			),
		};
	} catch (error) {
		if (isUnauthorizedError(error)) {
			auth.logout();

			throw redirect({
				to: "/login",
				search: {
					redirect: "/app/projects",
				},
			});
		}

		throw error;
	}
}

export async function getProjectById(
	auth: AuthContext,
	projectId: string,
	redirectTo = `/app/projects/${projectId}`,
) {
	try {
		return await pb.collection("projects").getOne<ProjectRecord>(projectId, {
			expand: "owner",
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

export async function getProjectFormOptions(
	auth: AuthContext,
	redirectTo = "/app/projects/new",
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
		const users = await pb
			.collection("users")
			.getFullList<Pick<ProjectOwner, "email" | "id" | "name" | "role">>({
				filter: "isActive = true || isActive = null",
				sort: "+email",
			});

		return {
			currentUserId: userId,
			users,
		} satisfies ProjectFormOptions;
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

export function getDefaultProjectFormValues(
	currentUserId: string,
	overrides: Partial<ProjectFormValues> = {},
) {
	return {
		description: "",
		dueDate: "",
		name: "",
		owner: currentUserId,
		slug: "",
		startDate: "",
		status: "active",
		...overrides,
	} satisfies ProjectFormValues;
}

export async function createProject(
	auth: AuthContext,
	values: ProjectFormValues,
	redirectTo = "/app/projects/new",
) {
	try {
		return await pb
			.collection("projects")
			.create<ProjectRecord>(buildProjectPayload(values));
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

function buildProjectPayload(values: ProjectFormValues) {
	const normalizedName = values.name.trim();
	const normalizedSlug =
		normalizeSlug(values.slug) || normalizeSlug(normalizedName);
	const normalizedDescription = serializeRichTextValue(values.description);

	return {
		description: normalizedDescription || null,
		dueDate: formatDateForPocketBase(values.dueDate),
		isArchived: false,
		name: normalizedName,
		owner: values.owner || null,
		slug: normalizedSlug || `project-${Date.now()}`,
		startDate: formatDateForPocketBase(values.startDate),
		status: values.status,
	};
}

function normalizeSlug(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
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
