import type { RecordModel } from "pocketbase";
import type { AuthContext } from "#/lib/auth";
import { requireAuthUser, runWithAuthRedirect } from "#/lib/data-access";
import { pb } from "#/lib/pocketbase";
import { isNotFoundError } from "#/lib/utils";

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
	return runWithAuthRedirect(auth, redirectTo, async () =>
		pb.collection("task_comments").getFullList<TaskCommentRecord>({
			filter: pb.filter("task = {:task}", { task: taskId }),
			sort: "-createdAt",
			expand: "author,quotedComment.author",
		}),
	);
}

export async function createTaskComment(
	auth: AuthContext,
	input: CreateCommentInput,
	redirectTo = `/app/tasks/${input.taskId}`,
) {
	const authorId = requireAuthUser(auth, redirectTo);

	return runWithAuthRedirect(auth, redirectTo, async () =>
		pb.collection("task_comments").create<TaskCommentRecord>({
			task: input.taskId,
			author: authorId,
			body: input.body.trim(),
			quotedComment: input.quotedCommentId || null,
			createdAt: new Date().toISOString(),
		}),
	);
}

export async function updateTaskComment(
	auth: AuthContext,
	commentId: string,
	input: UpdateCommentInput,
	redirectTo = "/app/tasks",
) {
	return runWithAuthRedirect(auth, redirectTo, async () => {
		try {
			return await pb
				.collection("task_comments")
				.update<TaskCommentRecord>(commentId, {
					body: input.body.trim(),
					updatedAt: new Date().toISOString(),
				});
		} catch (error) {
			if (isNotFoundError(error)) {
				throw new Error("Comment not found");
			}
			throw error;
		}
	});
}

export async function deleteTaskComment(
	auth: AuthContext,
	commentId: string,
	redirectTo = "/app/tasks",
) {
	return runWithAuthRedirect(auth, redirectTo, async () => {
		try {
			return await pb.collection("task_comments").delete(commentId);
		} catch (error) {
			if (isNotFoundError(error)) {
				throw new Error("Comment not found");
			}
			throw error;
		}
	});
}
