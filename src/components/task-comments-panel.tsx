import {
	ChatCenteredDotsIcon,
	CheckIcon,
	PencilSimpleIcon,
	QuotesIcon,
	TrashIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { type FormEvent, useState } from "react";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { Textarea } from "#/components/ui/textarea";
import type { AuthContext } from "#/lib/auth";
import type { TaskCommentRecord } from "#/lib/comments";
import {
	createTaskComment,
	deleteTaskComment,
	updateTaskComment,
} from "#/lib/comments";
import { taskCommentsLiveQueryOptions } from "#/lib/comments.queries";
import { getErrorMessage } from "#/lib/utils";

type TaskCommentsPanelProps = {
	auth: AuthContext;
	taskId: string;
};

// Avatar component with initials fallback
function Avatar({
	name,
	email,
	className = "",
}: {
	name?: string;
	email?: string;
	className?: string;
}) {
	const initials = name
		? name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.slice(0, 2)
				.toUpperCase()
		: email
			? email[0].toUpperCase()
			: "?";

	const hue =
		((name || email || "").charCodeAt(0) + (name || email || "").length * 30) %
		360;

	return (
		<div
			className={`flex shrink-0 items-center justify-center rounded-full font-medium text-white ${className}`}
			style={{
				background: `linear-gradient(135deg, hsl(${hue} 70% 60%), hsl(${(hue + 40) % 360} 70% 50%))`,
				fontSize: className.includes("size-6") ? "0.65rem" : "0.75rem",
			}}
		>
			{initials}
		</div>
	);
}

export function TaskCommentsPanel({ auth, taskId }: TaskCommentsPanelProps) {
	const { data: comments } = useSuspenseQuery(
		taskCommentsLiveQueryOptions(auth, taskId),
	);
	const [newBody, setNewBody] = useState("");
	const [quotedComment, setQuotedComment] = useState<TaskCommentRecord | null>(
		null,
	);
	const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
	const [editBody, setEditBody] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
	const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);

	const currentUserId = auth.getState().user?.id;

	const createMutation = useMutation({
		mutationFn: async (body: string) =>
			createTaskComment(auth, {
				taskId,
				body,
				quotedCommentId: quotedComment?.id,
			}),
		onSuccess: () => {
			setNewBody("");
			setQuotedComment(null);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async ({
			commentId,
			body,
		}: {
			commentId: string;
			body: string;
		}) => updateTaskComment(auth, commentId, { body }),
		onSuccess: () => {
			setEditingCommentId(null);
			setEditBody("");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (commentId: string) => deleteTaskComment(auth, commentId),
	});

	async function handleCreate(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const trimmed = newBody.trim();
		if (!trimmed) {
			return;
		}

		setError(null);
		setActiveCommentId("creating");

		try {
			await createMutation.mutateAsync(trimmed);
		} catch (caughtError) {
			setError(getErrorMessage(caughtError));
		} finally {
			setActiveCommentId(null);
		}
	}

	async function handleUpdate(comment: TaskCommentRecord) {
		const trimmed = editBody.trim();
		if (!trimmed || trimmed === comment.body) {
			setEditingCommentId(null);
			setEditBody("");
			return;
		}

		setError(null);
		setActiveCommentId(comment.id);

		try {
			await updateMutation.mutateAsync({
				commentId: comment.id,
				body: trimmed,
			});
		} catch (caughtError) {
			setError(getErrorMessage(caughtError));
		} finally {
			setActiveCommentId(null);
		}
	}

	async function handleDelete(commentId: string) {
		if (!confirm("Delete this comment?")) {
			return;
		}

		setError(null);
		setActiveCommentId(commentId);

		try {
			await deleteMutation.mutateAsync(commentId);
		} catch (caughtError) {
			setError(getErrorMessage(caughtError));
		} finally {
			setActiveCommentId(null);
		}
	}

	function startEditing(comment: TaskCommentRecord) {
		setEditingCommentId(comment.id);
		setEditBody(comment.body);
	}

	function cancelEditing() {
		setEditingCommentId(null);
		setEditBody("");
	}

	function handleQuote(comment: TaskCommentRecord) {
		setQuotedComment(comment);
	}

	function cancelQuote() {
		setQuotedComment(null);
	}

	return (
		<section aria-label="Comments" className="flex h-full flex-col gap-4">
			{/* Header */}
			<div className="flex items-center gap-2">
				<div className="flex size-7 items-center justify-center rounded-lg bg-zinc-100">
					<ChatCenteredDotsIcon
						className="size-4 text-zinc-600"
						weight="duotone"
					/>
				</div>
				<p className="text-sm font-medium tracking-tight text-zinc-900">
					Comments
					{comments.length > 0 ? (
						<span className="ml-1.5 text-xs text-zinc-500">
							{comments.length}
						</span>
					) : null}
				</p>
			</div>

			{/* Comment input form - Glassmorphism style */}
			<form
				className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-shadow focus-within:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)]"
				noValidate
				onSubmit={handleCreate}
			>
				{/* Quoted comment preview */}
				{quotedComment ? (
					<div className="border-b border-zinc-100 bg-zinc-50/50 px-4 py-3">
						<div className="flex items-start gap-3">
							<div className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-zinc-200">
								<QuotesIcon className="size-3 text-zinc-600" weight="fill" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs font-medium text-zinc-700">
									Replying to{" "}
									{quotedComment.expand?.author?.name ||
										quotedComment.expand?.author?.email ||
										"Someone"}
								</p>
								<p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-500">
									{quotedComment.body}
								</p>
							</div>
							<Button
								onClick={cancelQuote}
								size="xs"
								type="button"
								variant="ghost"
								className="shrink-0 text-zinc-400 hover:text-zinc-600"
							>
								<XIcon className="size-3.5" />
							</Button>
						</div>
					</div>
				) : null}

				<div className="p-4">
					<Textarea
						autoComplete="off"
						className="min-h-[80px] resize-none border-0 bg-transparent px-0 py-0 text-[15px] leading-relaxed text-zinc-900 shadow-none transition-all placeholder:text-zinc-400 focus-visible:ring-0"
						placeholder="Write a comment..."
						value={newBody}
						onChange={(event) => setNewBody(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
								event.preventDefault();
								handleCreate(event as unknown as FormEvent<HTMLFormElement>);
							}
						}}
					/>
					<div className="mt-3 flex items-center justify-between">
						<p className="text-xs text-zinc-400">Press Cmd+Enter to send</p>
						<Button
							disabled={createMutation.isPending || !newBody.trim()}
							size="sm"
							type="submit"
							className="h-8 rounded-full bg-zinc-900 px-4 text-xs font-medium text-white transition-all hover:-translate-y-[1px] hover:bg-zinc-800 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:opacity-50"
						>
							{createMutation.isPending ? (
								<span className="flex items-center gap-1.5">
									<Spinner className="size-3" />
									Sending…
								</span>
							) : (
								"Send"
							)}
						</Button>
					</div>
				</div>
			</form>

			{/* Error display */}
			{error ? (
				<div
					aria-live="polite"
					className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
				>
					<XIcon className="size-4" />
					{error}
				</div>
			) : null}

			{/* Comments list */}
			<div className="flex-1 overflow-y-auto">
				{comments.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-10 text-center">
						<div className="mb-3 flex size-12 items-center justify-center rounded-full bg-zinc-100">
							<ChatCenteredDotsIcon
								className="size-6 text-zinc-400"
								weight="duotone"
							/>
						</div>
						<p className="text-sm font-medium text-zinc-700">No comments yet</p>
						<p className="mt-1 max-w-[200px] text-xs leading-relaxed text-zinc-500">
							Start the discussion by writing a comment above.
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{comments.map((comment) => {
							const isAuthor = comment.author === currentUserId;
							const isEditing = editingCommentId === comment.id;
							const isBusy = activeCommentId === comment.id;
							const isHovered = hoveredCommentId === comment.id;
							const authorName =
								comment.expand?.author?.name ||
								comment.expand?.author?.email ||
								"Unknown user";

							return (
								<article
									className="group relative rounded-2xl border border-zinc-100 bg-white p-4 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.02)] transition-all hover:border-zinc-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]"
									key={comment.id}
									onMouseEnter={() => setHoveredCommentId(comment.id)}
									onMouseLeave={() => setHoveredCommentId(null)}
								>
									<div className="flex items-start gap-3">
										{/* Avatar */}
										<Avatar
											name={comment.expand?.author?.name}
											email={comment.expand?.author?.email}
											className="size-8"
										/>

										<div className="min-w-0 flex-1">
											{/* Header row */}
											<div className="flex items-center justify-between gap-2">
												<div className="flex items-center gap-2">
													<p className="text-sm font-semibold tracking-tight text-zinc-900">
														{authorName}
													</p>
													<span className="text-xs text-zinc-400">
														{formatDistanceToNow(new Date(comment.createdAt), {
															addSuffix: true,
														})}
														{comment.updatedAt ? (
															<span className="ml-1 text-zinc-300">
																(edited)
															</span>
														) : null}
													</span>
												</div>

												{/* Actions - show on hover for author */}
												{isAuthor && !isEditing ? (
													<div
														className={`flex items-center gap-0.5 transition-opacity ${
															isHovered ? "opacity-100" : "opacity-0"
														}`}
													>
														<Button
															disabled={isBusy}
															onClick={() => startEditing(comment)}
															size="xs"
															type="button"
															variant="ghost"
															className="h-7 w-7 p-0 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
														>
															<PencilSimpleIcon className="size-3.5" />
														</Button>
														<Button
															disabled={isBusy}
															onClick={() => handleDelete(comment.id)}
															size="xs"
															type="button"
															variant="ghost"
															className="h-7 w-7 p-0 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
														>
															<TrashIcon className="size-3.5" />
														</Button>
													</div>
												) : null}
											</div>

											{/* Quoted comment */}
											{comment.quotedComment &&
											comment.expand?.quotedComment ? (
												<div className="mt-3 rounded-xl border-l-[3px] border-zinc-300 bg-zinc-50/80 px-3 py-2.5">
													<div className="flex items-center gap-1.5">
														<QuotesIcon
															className="size-3 text-zinc-400"
															weight="fill"
														/>
														<p className="text-xs font-medium text-zinc-600">
															Reply to{" "}
															{comment.expand.quotedComment.expand?.author
																?.name ||
																comment.expand.quotedComment.expand?.author
																	?.email ||
																"Someone"}
														</p>
													</div>
													<p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-500">
														&ldquo;{comment.expand.quotedComment.body}&rdquo;
													</p>
												</div>
											) : null}

											{/* Comment body */}
											{isEditing ? (
												<div className="mt-2">
													<Textarea
														autoFocus
														className="min-h-[80px] resize-none rounded-xl border-zinc-200 text-[15px] leading-relaxed focus-visible:border-zinc-400 focus-visible:ring-0"
														value={editBody}
														onChange={(event) =>
															setEditBody(event.target.value)
														}
													/>
													<div className="mt-3 flex items-center justify-end gap-2">
														<Button
															onClick={cancelEditing}
															size="sm"
															type="button"
															variant="ghost"
															className="h-8 text-xs text-zinc-500 hover:text-zinc-700"
														>
															Cancel
														</Button>
														<Button
															disabled={
																updateMutation.isPending || !editBody.trim()
															}
															onClick={() => handleUpdate(comment)}
															size="sm"
															type="button"
															className="h-8 rounded-full bg-zinc-900 px-4 text-xs font-medium text-white transition-all hover:-translate-y-[1px] hover:bg-zinc-800 hover:shadow-md active:translate-y-0 active:scale-[0.98]"
														>
															{updateMutation.isPending ? (
																<span className="flex items-center gap-1.5">
																	<Spinner className="size-3" />
																	Saving…
																</span>
															) : (
																<span className="flex items-center gap-1.5">
																	<CheckIcon
																		className="size-3.5"
																		weight="bold"
																	/>
																	Save changes
																</span>
															)}
														</Button>
													</div>
												</div>
											) : (
												<div className="mt-2">
													<p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-800">
														{comment.body}
													</p>
												</div>
											)}

											{/* Quote button - subtle */}
											{!isEditing ? (
												<div className="mt-2 flex justify-end">
													<Button
														disabled={isBusy}
														onClick={() => handleQuote(comment)}
														size="xs"
														type="button"
														variant="ghost"
														className="h-7 gap-1.5 text-xs text-zinc-400 transition-all hover:text-zinc-600"
													>
														<QuotesIcon className="size-3.5" />
														Reply
													</Button>
												</div>
											) : null}
										</div>
									</div>
								</article>
							);
						})}
					</div>
				)}
			</div>
		</section>
	);
}
