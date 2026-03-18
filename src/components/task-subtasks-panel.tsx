import { type FormEvent, useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "#/components/ui/field";
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
		<Card className="border border-border/70 bg-card/70 ring-0">
			<CardHeader className="border-b border-border/70">
				<div>
					<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
						Subtasks
					</p>
					<CardTitle className="mt-2 text-lg font-semibold text-foreground">
						Break the work down
					</CardTitle>
					<CardDescription className="mt-2 text-sm text-muted-foreground">
						{String(completedCount).padStart(2, "0")} of{" "}
						{String(subtasks.length).padStart(2, "0")} completed.
					</CardDescription>
				</div>
			</CardHeader>

			<CardContent className="py-5">
				<form
					className="flex flex-col gap-4"
					noValidate
					onSubmit={handleCreate}
				>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="new-subtask">New subtask</FieldLabel>
							<div className="flex flex-col gap-2 sm:flex-row">
								<Input
									autoComplete="off"
									id="new-subtask"
									name="new-subtask"
									placeholder="Add the next concrete subtask"
									value={title}
									onChange={(event) => setTitle(event.target.value)}
								/>
								<Button disabled={isCreating} size="lg" type="submit">
									{isCreating ? "Adding…" : "Add Subtask"}
								</Button>
							</div>
						</Field>
					</FieldGroup>
				</form>

				<div
					aria-live="polite"
					className="mt-3 min-h-5 text-sm text-destructive"
				>
					{error ? error : null}
				</div>

				{subtasks.length === 0 ? (
					<div className="pt-4">
						<Empty className="min-h-[200px] border-border/70 bg-background/60">
							<EmptyHeader>
								<EmptyTitle className="text-sm font-medium text-foreground">
									No subtasks yet
								</EmptyTitle>
								<EmptyDescription className="max-w-md text-sm text-muted-foreground">
									Use subtasks to split the work into visible steps without
									changing the main task automatically.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</div>
				) : (
					<div className="mt-4 divide-y divide-border/70 rounded-sm border border-border/80 bg-background/60">
						{subtasks.map((subtask) => {
							const isBusy = activeSubtaskId === subtask.id;

							return (
								<article
									key={subtask.id}
									className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
								>
									<div className="flex min-w-0 items-start gap-3">
										<Checkbox
											aria-label={`Mark ${subtask.title} as completed`}
											checked={Boolean(subtask.isCompleted)}
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
											<p className="mt-1 text-xs text-muted-foreground">
												{subtask.isCompleted && subtask.completedAt
													? `Completed ${formatDateLabel(subtask.completedAt)}`
													: "Pending"}
											</p>
										</div>
									</div>

									<Button
										disabled={isBusy}
										onClick={() => handleDelete(subtask.id)}
										size="sm"
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
			</CardContent>
		</Card>
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
