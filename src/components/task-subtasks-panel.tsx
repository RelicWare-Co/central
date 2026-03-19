import { type FormEvent, useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { formatDateLabel } from "#/lib/formatting";
import {
	createSubtask,
	deleteSubtask,
	type SubtaskRecord,
	updateSubtaskCompletion,
} from "#/lib/tasks";

type TaskSubtasksPanelProps = {
	initialSubtasks: SubtaskRecord[];
	taskId: string;
};

export function TaskSubtasksPanel({
	initialSubtasks,
	taskId,
}: TaskSubtasksPanelProps) {
	const [subtasks, setSubtasks] = useState(initialSubtasks);
	const [title, setTitle] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);
	const completedCount = subtasks.filter(
		(subtask) => subtask.isCompleted,
	).length;

	useEffect(() => {
		setSubtasks(initialSubtasks);
		setTitle("");
		setError(null);
		setIsCreating(false);
		setActiveSubtaskId(null);
	}, [initialSubtasks]);

	async function handleCreate(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const nextTitle = title.trim();

		if (!nextTitle) {
			return;
		}

		setError(null);
		setIsCreating(true);

		try {
			const record = await createSubtask(
				taskId,
				nextTitle,
				getNextPosition(subtasks),
			);

			setSubtasks((current) => sortSubtasks([...current, record]));
			setTitle("");
		} catch (caughtError) {
			setError(getErrorMessage(caughtError));
		} finally {
			setIsCreating(false);
		}
	}

	async function handleToggle(subtask: SubtaskRecord, isCompleted: boolean) {
		setError(null);
		setActiveSubtaskId(subtask.id);

		try {
			const updated = await updateSubtaskCompletion(subtask.id, isCompleted);

			setSubtasks((current) =>
				current.map((item) => (item.id === updated.id ? updated : item)),
			);
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
			await deleteSubtask(subtaskId);
			setSubtasks((current) => current.filter((item) => item.id !== subtaskId));
		} catch (caughtError) {
			setError(getErrorMessage(caughtError));
		} finally {
			setActiveSubtaskId(null);
		}
	}

	return (
		<section aria-label="Subtasks" className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-[0.6rem] uppercase tracking-[0.22em] text-accent-foreground">
						Subtasks
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						{subtasks.length > 0
							? `${String(completedCount).padStart(2, "0")} of ${String(subtasks.length).padStart(2, "0")} completed.`
							: "Add the next concrete step without separating it from the task."}
					</p>
				</div>
			</div>

			<div className="overflow-hidden rounded-sm border border-border/80 bg-background/55">
				<form
					className="border-b border-border/70 px-3 py-3"
					noValidate
					onSubmit={handleCreate}
				>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<Input
							autoComplete="off"
							className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
							id="new-subtask"
							name="new-subtask"
							placeholder="Add the next concrete subtask"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
						/>
						<Button
							className="sm:shrink-0"
							disabled={isCreating}
							size="sm"
							type="submit"
						>
							{isCreating ? "Adding…" : "Add"}
						</Button>
					</div>
				</form>

				{error ? (
					<div
						aria-live="polite"
						className="px-3 pt-3 text-sm text-destructive"
					>
						{error}
					</div>
				) : null}

				{subtasks.length === 0 ? (
					<div className="px-3 py-4">
						<p className="text-sm font-medium text-foreground">
							No subtasks yet
						</p>
						<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
							Break the work into visible steps here. Completing them will not
							change the parent task automatically.
						</p>
					</div>
				) : (
					<div className="divide-y divide-border/70">
						{subtasks.map((subtask) => {
							const isBusy = activeSubtaskId === subtask.id;

							return (
								<article
									key={subtask.id}
									className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
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
												<p className="mt-1 text-xs text-muted-foreground">
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
