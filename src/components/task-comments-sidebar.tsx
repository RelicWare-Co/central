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
import { ScrollArea } from "#/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "#/components/ui/sheet";
import { Spinner } from "#/components/ui/spinner";
import { Textarea } from "#/components/ui/textarea";
import { useIsMobile } from "#/hooks/use-mobile";
import type { AuthContext } from "#/lib/auth";
import type { TaskCommentRecord } from "#/lib/comments";
import {
	createTaskComment,
	deleteTaskComment,
	updateTaskComment,
} from "#/lib/comments";
import { taskCommentsLiveQueryOptions } from "#/lib/comments.queries";
import { cn, getErrorMessage } from "#/lib/utils";

type TaskCommentsSidebarProps = {
	auth: AuthContext;
	taskId: string;
};

type TaskCommentsContentProps = {
	comments: TaskCommentRecord[];
	currentUserId?: string;
	newBody: string;
	quotedComment: TaskCommentRecord | null;
	editingCommentId: string | null;
	editBody: string;
	error: string | null;
	activeCommentId: string | null;
	hoveredCommentId: string | null;
	isCreatePending: boolean;
	isUpdatePending: boolean;
	onCancelEditing: () => void;
	onCancelQuote: () => void;
	onCreate: (event: FormEvent<HTMLFormElement>) => void;
	onDelete: (commentId: string) => void;
	onHoverComment: (commentId: string | null) => void;
	onQuote: (comment: TaskCommentRecord) => void;
	onStartEditing: (comment: TaskCommentRecord) => void;
	onUpdate: (comment: TaskCommentRecord) => void;
	setEditBody: (value: string) => void;
	setNewBody: (value: string) => void;
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

function TaskCommentsContent({
	comments,
	currentUserId,
	newBody,
	quotedComment,
	editingCommentId,
	editBody,
	error,
	activeCommentId,
	hoveredCommentId,
	isCreatePending,
	isUpdatePending,
	onCancelEditing,
	onCancelQuote,
	onCreate,
	onDelete,
	onHoverComment,
	onQuote,
	onStartEditing,
	onUpdate,
	setEditBody,
	setNewBody,
}: TaskCommentsContentProps) {
	return (
		<div className="flex h-full min-h-0 flex-col">
			<form
				className="shrink-0 overflow-hidden border-b border-zinc-100 bg-white p-4"
				noValidate
				onSubmit={onCreate}
			>
				{quotedComment ? (
					<div className="mb-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
						<div className="flex items-start gap-2">
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
								onClick={onCancelQuote}
								size="xs"
								type="button"
								variant="ghost"
								className="shrink-0 size-6 p-0 text-zinc-400 hover:text-zinc-600"
							>
								<XIcon className="size-3.5" />
							</Button>
						</div>
					</div>
				) : null}

				<Textarea
					autoComplete="off"
					className="min-h-[80px] resize-none border-zinc-200 text-sm leading-relaxed focus-visible:border-zinc-400 focus-visible:ring-0"
					placeholder="Write a comment..."
					value={newBody}
					onChange={(event) => setNewBody(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
							event.preventDefault();
							onCreate(event as unknown as FormEvent<HTMLFormElement>);
						}
					}}
				/>
				<div className="mt-3 flex items-center justify-between">
					<p className="text-xs text-zinc-400">⌘ + Enter to send</p>
					<Button
						disabled={isCreatePending || !newBody.trim()}
						size="sm"
						type="submit"
						className="h-8 rounded-full bg-zinc-900 px-4 text-xs font-medium text-white transition-all hover:-translate-y-[1px] hover:bg-zinc-800 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:opacity-50"
					>
						{isCreatePending ? (
							<span className="flex items-center gap-1.5">
								<Spinner className="size-3" />
								Sending…
							</span>
						) : (
							"Send"
						)}
					</Button>
				</div>
			</form>

			{error ? (
				<div
					aria-live="polite"
					className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
				>
					<XIcon className="size-4" />
					{error}
				</div>
			) : null}

			<ScrollArea className="min-h-0 flex-1 overflow-hidden">
				<div className="p-4">
					{comments.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-10 text-center">
							<div className="mb-3 flex size-12 items-center justify-center rounded-full bg-zinc-100">
								<ChatCenteredDotsIcon
									className="size-6 text-zinc-400"
									weight="duotone"
								/>
							</div>
							<p className="text-sm font-medium text-zinc-700">
								No comments yet
							</p>
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
										className="group relative rounded-xl border border-zinc-100 bg-white p-3 shadow-sm transition-all hover:border-zinc-200 hover:shadow-md"
										key={comment.id}
										onMouseEnter={() => onHoverComment(comment.id)}
										onMouseLeave={() => onHoverComment(null)}
									>
										<div className="flex items-start gap-2.5">
											<Avatar
												name={comment.expand?.author?.name}
												email={comment.expand?.author?.email}
												className="size-7"
											/>

											<div className="min-w-0 flex-1">
												<div className="flex items-center justify-between gap-2">
													<div className="flex items-center gap-1.5">
														<p className="text-xs font-semibold tracking-tight text-zinc-900">
															{authorName}
														</p>
														<span className="text-[10px] text-zinc-400">
															{formatDistanceToNow(
																new Date(comment.createdAt),
																{
																	addSuffix: true,
																},
															)}
															{comment.updatedAt ? (
																<span className="ml-1 text-zinc-300">
																	(edited)
																</span>
															) : null}
														</span>
													</div>

													{isAuthor && !isEditing ? (
														<div
															className={cn(
																"flex items-center gap-0.5 transition-opacity",
																isHovered ? "opacity-100" : "opacity-0",
															)}
														>
															<Button
																disabled={isBusy}
																onClick={() => onStartEditing(comment)}
																size="xs"
																type="button"
																variant="ghost"
																className="size-6 p-0 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
															>
																<PencilSimpleIcon className="size-3" />
															</Button>
															<Button
																disabled={isBusy}
																onClick={() => onDelete(comment.id)}
																size="xs"
																type="button"
																variant="ghost"
																className="size-6 p-0 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
															>
																<TrashIcon className="size-3" />
															</Button>
														</div>
													) : null}
												</div>

												{comment.quotedComment &&
												comment.expand?.quotedComment ? (
													<div className="mt-2 rounded-lg border-l-2 border-zinc-300 bg-zinc-50/80 px-2.5 py-2">
														<div className="flex items-center gap-1">
															<QuotesIcon
																className="size-2.5 text-zinc-400"
																weight="fill"
															/>
															<p className="text-[10px] font-medium text-zinc-600">
																Reply to{" "}
																{comment.expand.quotedComment.expand?.author
																	?.name ||
																	comment.expand.quotedComment.expand?.author
																		?.email ||
																	"Someone"}
															</p>
														</div>
														<p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-zinc-500">
															&ldquo;{comment.expand.quotedComment.body}&rdquo;
														</p>
													</div>
												) : null}

												{isEditing ? (
													<div className="mt-2">
														<Textarea
															autoFocus
															className="min-h-[60px] resize-none rounded-lg border-zinc-200 text-sm focus-visible:border-zinc-400 focus-visible:ring-0"
															value={editBody}
															onChange={(event) =>
																setEditBody(event.target.value)
															}
														/>
														<div className="mt-2 flex items-center justify-end gap-1.5">
															<Button
																onClick={onCancelEditing}
																size="xs"
																type="button"
																variant="ghost"
																className="h-7 text-xs text-zinc-500 hover:text-zinc-700"
															>
																Cancel
															</Button>
															<Button
																disabled={isUpdatePending || !editBody.trim()}
																onClick={() => onUpdate(comment)}
																size="xs"
																type="button"
																className="h-7 rounded-full bg-zinc-900 px-3 text-xs font-medium text-white"
															>
																{isUpdatePending ? (
																	<span className="flex items-center gap-1">
																		<Spinner className="size-2.5" />
																		Saving…
																	</span>
																) : (
																	<span className="flex items-center gap-1">
																		<CheckIcon
																			className="size-3"
																			weight="bold"
																		/>
																		Save
																	</span>
																)}
															</Button>
														</div>
													</div>
												) : (
													<div className="mt-1.5">
														<p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
															{comment.body}
														</p>
													</div>
												)}

												{!isEditing ? (
													<div className="mt-1.5 flex justify-end">
														<Button
															disabled={isBusy}
															onClick={() => onQuote(comment)}
															size="xs"
															type="button"
															variant="ghost"
															className="h-6 gap-1 px-2 text-[10px] text-zinc-400 transition-all hover:text-zinc-600"
														>
															<QuotesIcon className="size-3" />
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
			</ScrollArea>
		</div>
	);
}

export function TaskCommentsSidebar({
	auth,
	taskId,
}: TaskCommentsSidebarProps) {
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
	const [isOpen, setIsOpen] = useState(false);

	const currentUserId = auth.getState().user?.id;
	const isMobile = useIsMobile();

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
		await submitNewComment();
	}

	async function submitNewComment() {
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

	// Mobile: Sheet
	if (isMobile) {
		return (
			<Sheet open={isOpen} onOpenChange={setIsOpen}>
				<SheetTrigger asChild>
					<Button
						size="sm"
						variant="outline"
						className="relative gap-2 rounded-full border-zinc-200 bg-white shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
					>
						<ChatCenteredDotsIcon className="size-4" weight="duotone" />
						<span className="text-xs font-medium">Comments</span>
						{comments.length > 0 ? (
							<span
								className={cn(
									"absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
									comments.length > 0
										? "bg-emerald-100 text-emerald-700"
										: "bg-zinc-200 text-zinc-700",
								)}
							>
								{comments.length}
							</span>
						) : null}
					</Button>
				</SheetTrigger>
				<SheetContent
					side="right"
					className="flex h-full min-h-0 w-full flex-col p-0 sm:w-[400px]"
					showCloseButton={false}
				>
					<SheetHeader className="flex flex-row items-center justify-between border-b border-zinc-100 px-4 py-3">
						<div className="flex items-center gap-2">
							<div className="flex size-7 items-center justify-center rounded-lg bg-zinc-100">
								<ChatCenteredDotsIcon
									className="size-4 text-zinc-600"
									weight="duotone"
								/>
							</div>
							<SheetTitle className="text-sm font-medium">
								Comments
								{comments.length > 0 ? (
									<span className="ml-1.5 text-xs font-normal text-zinc-500">
										{comments.length}
									</span>
								) : null}
							</SheetTitle>
						</div>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => setIsOpen(false)}
							className="text-zinc-400 hover:text-zinc-600"
						>
							<XIcon />
						</Button>
					</SheetHeader>
					<div className="flex min-h-0 flex-1 overflow-hidden">
						<TaskCommentsContent
							activeCommentId={activeCommentId}
							comments={comments}
							currentUserId={currentUserId}
							editBody={editBody}
							editingCommentId={editingCommentId}
							error={error}
							hoveredCommentId={hoveredCommentId}
							isCreatePending={createMutation.isPending}
							isUpdatePending={updateMutation.isPending}
							newBody={newBody}
							onCancelEditing={cancelEditing}
							onCancelQuote={cancelQuote}
							onCreate={handleCreate}
							onDelete={handleDelete}
							onHoverComment={setHoveredCommentId}
							onQuote={handleQuote}
							onStartEditing={startEditing}
							onUpdate={handleUpdate}
							quotedComment={quotedComment}
							setEditBody={setEditBody}
							setNewBody={setNewBody}
						/>
					</div>
				</SheetContent>
			</Sheet>
		);
	}

	// Desktop: Fixed sidebar panel that slides in from the right
	return (
		<div className="relative">
			{/* Toggle button */}
			<Button
				size="sm"
				variant="outline"
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"relative gap-2 rounded-full border-zinc-200 bg-white shadow-sm transition-all hover:border-zinc-300 hover:shadow-md",
					isOpen && "bg-zinc-100",
				)}
			>
				<ChatCenteredDotsIcon className="size-4" weight="duotone" />
				<span className="text-xs font-medium">
					{isOpen ? "Hide" : "Comments"}
				</span>
				{comments.length > 0 ? (
					<span
						className={cn(
							"absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
							"bg-emerald-100 text-emerald-700",
						)}
					>
						{comments.length}
					</span>
				) : null}
			</Button>

			{/* Sidebar panel */}
			<div
				className={cn(
					"fixed right-0 top-0 z-40 h-[100dvh] max-h-[100dvh] w-[min(100vw-1rem,380px)] border-l border-zinc-200 bg-white shadow-xl transition-transform duration-300 ease-in-out",
					isOpen ? "translate-x-0" : "translate-x-full",
				)}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
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
								<span className="ml-1.5 text-xs font-normal text-zinc-500">
									{comments.length}
								</span>
							) : null}
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => setIsOpen(false)}
						className="text-zinc-400 hover:text-zinc-600"
					>
						<XIcon />
					</Button>
				</div>

				{/* Content */}
				<div className="flex h-[calc(100dvh-52px)] min-h-0 flex-col overflow-hidden">
					<TaskCommentsContent
						activeCommentId={activeCommentId}
						comments={comments}
						currentUserId={currentUserId}
						editBody={editBody}
						editingCommentId={editingCommentId}
						error={error}
						hoveredCommentId={hoveredCommentId}
						isCreatePending={createMutation.isPending}
						isUpdatePending={updateMutation.isPending}
						newBody={newBody}
						onCancelEditing={cancelEditing}
						onCancelQuote={cancelQuote}
						onCreate={handleCreate}
						onDelete={handleDelete}
						onHoverComment={setHoveredCommentId}
						onQuote={handleQuote}
						onStartEditing={startEditing}
						onUpdate={handleUpdate}
						quotedComment={quotedComment}
						setEditBody={setEditBody}
						setNewBody={setNewBody}
					/>
				</div>
			</div>

			{/* Backdrop */}
			{isOpen && (
				<button
					type="button"
					aria-label="Close comments sidebar"
					className="fixed inset-0 z-30 cursor-default bg-black/5 backdrop-blur-[1px] transition-opacity"
					onClick={() => setIsOpen(false)}
					onKeyDown={(event) => {
						if (event.key === "Escape") {
							setIsOpen(false);
						}
					}}
				/>
			)}
		</div>
	);
}
