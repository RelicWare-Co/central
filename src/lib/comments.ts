import { redirect } from "@tanstack/react-router";
import type { RecordModel } from "pocketbase";
import type { AuthContext } from "./auth";
import { pb } from "./pocketbase";
import { isNotFoundError, isUnauthorizedError } from "./utils";

export type TaskCommentRecord = RecordModel & {
	task: string;
	author: string;
	body: string;
	quotedComment?: string;
	createdAt: string;
	updatedAt?: string;
	expand?: {
		author?: {
			id: string;
			name?: string;
			email?: string;
			username?: string;
		};
		quotedComment?: {
			id: string;
			body: string;
			author: string;
			expand?: {
				author?: {
					id: string;
					name?: string;
					email?: string;
				};
			};
		};
	};
};

export type CreateCommentInput = {
	taskId: string;
	body: string;
	quotedCommentId?: string;
};

export type UpdateCommentInput = {
	body: string;
};

export async function listTaskComments(
	auth: AuthContext,
	taskId: string,
	redirectTo = `/app/tasks/${taskId}`,
) {
	try {
		return await pb.collection("task_comments").getFullList<TaskCommentRecord>({
			filter: pb.filter("task = {:task}", { task: taskId }),
			sort: "+createdAt",
			expand: "author,quotedComment.author",
		});
	} catch (error) {
		if (isUnauthorizedError(error)) {
			auth.logout();
			throw redirect({
				to: "/login",
				search: { redirect: redirectTo },
			});
		}
		throw error;
	}
}

export async function createTaskComment(
	auth: AuthContext,
	input: CreateCommentInput,
	redirectTo = `/app/tasks/${input.taskId}`,
) {
	const authorId = auth.getState().user?.id;

	if (!authorId) {
		auth.logout();
		throw redirect({
			to: "/login",
			search: { redirect: redirectTo },
		});
	}

	try {
		return await pb.collection("task_comments").create<TaskCommentRecord>({
			task: input.taskId,
			author: authorId,
			body: input.body.trim(),
			quotedComment: input.quotedCommentId || null,
			createdAt: new Date().toISOString(),
		});
	} catch (error) {
		if (isUnauthorizedError(error)) {
			auth.logout();
			throw redirect({
				to: "/login",
				search: { redirect: redirectTo },
			});
		}
		throw error;
	}
}

export async function updateTaskComment(
	auth: AuthContext,
	commentId: string,
	input: UpdateCommentInput,
	redirectTo = "/app/tasks",
) {
	try {
		return await pb
			.collection("task_comments")
			.update<TaskCommentRecord>(commentId, {
				body: input.body.trim(),
				updatedAt: new Date().toISOString(),
			});
	} catch (error) {
		if (isUnauthorizedError(error)) {
			auth.logout();
			throw redirect({
				to: "/login",
				search: { redirect: redirectTo },
			});
		}
		if (isNotFoundError(error)) {
			throw new Error("Comment not found");
		}
		throw error;
	}
}

export async function deleteTaskComment(
	auth: AuthContext,
	commentId: string,
	redirectTo = "/app/tasks",
) {
	try {
		return await pb.collection("task_comments").delete(commentId);
	} catch (error) {
		if (isUnauthorizedError(error)) {
			auth.logout();
			throw redirect({
				to: "/login",
				search: { redirect: redirectTo },
			});
		}
		if (isNotFoundError(error)) {
			throw new Error("Comment not found");
		}
		throw error;
	}
}
