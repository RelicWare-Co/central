import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import type { AuthContext } from "#/lib/auth";
import { formatDateLabel } from "#/lib/formatting";
import { queryKeys } from "#/lib/query-keys";
import {
	createSubtask,
	deleteSubtask,
	type SubtaskRecord,
	updateSubtaskCompletion,
} from "#/lib/tasks";
import { taskSubtasksLiveQueryOptions } from "#/lib/tasks.queries";

type TaskSubtasksPanelProps = {
	auth: AuthContext;
	taskId: string;
};

export function TaskSubtasksPanel({ auth, taskId }: TaskSubtasksPanelProps) {
	const queryClient = useQueryClient();
	const { data: subtasks } = useSuspenseQuery(
		taskSubtasksLiveQueryOptions(auth, taskId),
	);
	const [title, setTitle] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);
	const completedCount = subtasks.filter(
		(subtask) => subtask.isCompleted,
	).length;

	const createMutation = useMutation({
		mutationFn: async ({
			position,
			title: nextTitle,
		}: {
			position: number;
			title: string;
		}) => createSubtask(auth, taskId, nextTitle, position),
		onSuccess: (record) => {
			queryClient.setQueryData<SubtaskRecord[]>(
				queryKeys.tasks.subtasks(taskId),
				(current = []) => sortSubtasks([...current, record]),
			);
		},
	});

	const toggleMutation = useMutation({
		mutationFn: async ({
			isCompleted,
			subtaskId,
		}: {
			isCompleted: boolean;
			subtaskId: string;
		}) => updateSubtaskCompletion(auth, subtaskId, isCompleted),
		onSuccess: (updated) => {
			queryClient.setQueryData<SubtaskRecord[]>(
				queryKeys.tasks.subtasks(taskId),
				(current = []) =>
					sortSubtasks(
						current.map((item) => (item.id === updated.id ? updated : item)),
					),
			);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (subtaskId: string) => deleteSubtask(auth, subtaskId),
		onSuccess: (_result, subtaskId) => {
			queryClient.setQueryData<SubtaskRecord[]>(
				queryKeys.tasks.subtasks(taskId),
				(current = []) => current.filter((item) => item.id !== subtaskId),
			);
		},
	});

	async function handleCreate(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const nextTitle = title.trim();

		if (!nextTitle) {
			return;
		}

		setError(null);

		try {
			await createMutation.mutateAsync({
				position: getNextPosition(subtasks),
				title: nextTitle,
			});
			setTitle("");
		} catch (caughtError) {
			setError(getErrorMessage(caughtError));
		}
	}

	async function handleToggle(subtask: SubtaskRecord, isCompleted: boolean) {
		setError(null);
		setActiveSubtaskId(subtask.id);

		try {
			await toggleMutation.mutateAsync({
				isCompleted,
				subtaskId: subtask.id,
			});
		} catch (caughtError) {
			setError(getErrorMessage(caughtError));
		} finally {
			setActiveSubtaskId(null);
		}
	}

	async function handleDelete(subtaskId: string) {
		setError(null);
		setActiveSubtaskId(subtaskId);

		try {
			await deleteMutation.mutateAsync(subtaskId);
		} catch (caughtError) {
			setError(getErrorMessage(caughtError));
		} finally {
			setActiveSubtaskId(null);
		}
	}

	return (
		<section aria-label="Subtasks" className="flex flex-col gap-3">
			<div>
				<p className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
					Subtasks
				</p>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{subtasks.length > 0
						? `${completedCount} of ${subtasks.length} completed`
						: "Break the work into smaller steps."}
				</p>
			</div>

			<div className="overflow-hidden rounded-xl border border-border bg-card">
				<form
					className="border-b border-border px-4 py-3"
					noValidate
					onSubmit={handleCreate}
				>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<Input
							autoComplete="off"
							className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
							id="new-subtask"
							name="new-subtask"
							placeholder="Add a subtask"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
						/>
						<Button
							className="sm:shrink-0"
							disabled={createMutation.isPending}
							size="sm"
							type="submit"
						>
							{createMutation.isPending ? "Adding…" : "Add"}
						</Button>
					</div>
				</form>

				{error ? (
					<div
						aria-live="polite"
						className="px-4 pt-3 text-sm text-destructive"
					>
						{error}
					</div>
				) : null}

				{subtasks.length === 0 ? (
					<div className="px-4 py-5">
						<p className="text-sm font-medium text-foreground">
							No subtasks yet
						</p>
						<p className="mt-1 max-w-xl text-sm text-muted-foreground">
							Break the work into visible steps. Completing subtasks will not
							change the parent task automatically.
						</p>
					</div>
				) : (
					<div className="divide-y divide-border">
						{subtasks.map((subtask) => {
							const isBusy = activeSubtaskId === subtask.id;

							return (
								<article
									key={subtask.id}
									className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
								>
									<div className="flex min-w-0 items-start gap-3">
										<Checkbox
											aria-label={`Mark ${subtask.title} as completed`}
											checked={Boolean(subtask.isCompleted)}
											className="mt-0.5"
											disabled={isBusy}
											onClick={(event) => {
												event.preventDefault();
												handleToggle(subtask, !subtask.isCompleted);
											}}
										/>

										<div className="min-w-0">
											<p
												className={[
													"text-sm text-foreground",
													subtask.isCompleted
														? "text-muted-foreground line-through"
														: "",
												].join(" ")}
											>
												{subtask.title}
											</p>
											{subtask.isCompleted && subtask.completedAt ? (
												<p className="mt-0.5 text-xs text-muted-foreground">
													Completed {formatDateLabel(subtask.completedAt)}
												</p>
											) : null}
										</div>
									</div>

									<Button
										disabled={isBusy}
										onClick={() => handleDelete(subtask.id)}
										size="xs"
										type="button"
										variant="ghost"
									>
										Remove
									</Button>
								</article>
							);
						})}
					</div>
				)}
			</div>
		</section>
	);
}

function getNextPosition(subtasks: SubtaskRecord[]) {
	const currentMax = subtasks.reduce(
		(max, subtask) => Math.max(max, subtask.position ?? 0),
		0,
	);

	return currentMax + 1;
}

function sortSubtasks(subtasks: SubtaskRecord[]) {
	return [...subtasks].sort((left, right) => {
		const leftPosition = left.position ?? Number.MAX_SAFE_INTEGER;
		const rightPosition = right.position ?? Number.MAX_SAFE_INTEGER;

		if (leftPosition !== rightPosition) {
			return leftPosition - rightPosition;
		}

		return left.id.localeCompare(right.id);
	});
}

function getErrorMessage(error: unknown) {
	if (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof error.message === "string"
	) {
		return error.message;
	}

	return "Subtask update failed. Try again.";
}
