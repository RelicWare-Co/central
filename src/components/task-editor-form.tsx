import { useBlocker } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	NativeSelect,
	NativeSelectOption,
} from "#/components/ui/native-select";
import { Textarea } from "#/components/ui/textarea";
import type { TaskFormOptions, TaskFormValues } from "#/lib/tasks";

type TaskEditorFormProps = {
	cancelAction: ReactNode;
	children?: ReactNode;
	description: string;
	eyebrow: string;
	initialValues: TaskFormValues;
	onSubmit: (values: TaskFormValues) => Promise<void>;
	options: TaskFormOptions;
	submitLabel: string;
	title: string;
};

export function TaskEditorForm({
	cancelAction,
	children,
	description,
	eyebrow,
	initialValues,
	onSubmit,
	options,
	submitLabel,
	title,
}: TaskEditorFormProps) {
	const [values, setValues] = useState(initialValues);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

	useEffect(() => {
		setValues(initialValues);
		setError(null);
		setIsSubmitting(false);
	}, [initialValues]);

	useBlocker({
		enableBeforeUnload: isDirty && !isSubmitting,
		shouldBlockFn: () => {
			if (!isDirty || isSubmitting) {
				return false;
			}

			return !window.confirm("Discard unsaved changes?");
		},
	});

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		setError(null);
		setIsSubmitting(true);

		try {
			await onSubmit(values);
		} catch (caughtError) {
			setError(getErrorMessage(caughtError));
			setIsSubmitting(false);
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<Card className="border border-border/70 bg-card/70 ring-0">
				<CardHeader className="border-b border-border/70">
					<div>
						<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
							{eyebrow}
						</p>
						<CardTitle className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground sm:text-2xl">
							{title}
						</CardTitle>
						<CardDescription className="mt-2 max-w-3xl text-sm text-muted-foreground">
							{description}
						</CardDescription>
					</div>

					<CardAction>{cancelAction}</CardAction>
				</CardHeader>
			</Card>

			<div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
				<Card className="border border-border/70 bg-card/70 ring-0">
					<CardContent className="py-5">
						<form
							className="flex flex-col gap-5"
							noValidate
							onSubmit={handleSubmit}
						>
							<FieldGroup className="grid gap-4 lg:grid-cols-2">
								<Field className="lg:col-span-2">
									<FieldLabel htmlFor="title">Task Title</FieldLabel>
									<Input
										autoComplete="off"
										autoFocus
										id="title"
										name="title"
										placeholder="Define the next concrete piece of work"
										required
										value={values.title}
										onChange={(event) =>
											setValues((current) => ({
												...current,
												title: event.target.value,
											}))
										}
									/>
								</Field>

								<Field>
									<FieldLabel htmlFor="project">Project</FieldLabel>
									<NativeSelect
										className="w-full"
										id="project"
										name="project"
										value={values.project}
										onChange={(event) =>
											setValues((current) => ({
												...current,
												project: event.target.value,
											}))
										}
									>
										<NativeSelectOption value="">Inbox</NativeSelectOption>
										{options.projects.map((project) => (
											<NativeSelectOption key={project.id} value={project.id}>
												{project.name} · {project.slug}
											</NativeSelectOption>
										))}
									</NativeSelect>
								</Field>

								<Field>
									<FieldLabel htmlFor="assignee">Assignee</FieldLabel>
									<NativeSelect
										className="w-full"
										id="assignee"
										name="assignee"
										value={values.assignee}
										onChange={(event) =>
											setValues((current) => ({
												...current,
												assignee: event.target.value,
											}))
										}
									>
										<NativeSelectOption value="">Unassigned</NativeSelectOption>
										{options.users.map((user) => (
											<NativeSelectOption key={user.id} value={user.id}>
												{user.name || user.email || user.id}
											</NativeSelectOption>
										))}
									</NativeSelect>
								</Field>

								<Field>
									<FieldLabel htmlFor="status">Status</FieldLabel>
									<NativeSelect
										className="w-full"
										id="status"
										name="status"
										value={values.status}
										onChange={(event) =>
											setValues((current) => ({
												...current,
												blockedReason:
													event.target.value === "blocked"
														? current.blockedReason
														: "",
												status: event.target.value as TaskFormValues["status"],
											}))
										}
									>
										<NativeSelectOption value="pending">
											Pending
										</NativeSelectOption>
										<NativeSelectOption value="in_progress">
											In Progress
										</NativeSelectOption>
										<NativeSelectOption value="blocked">
											Blocked
										</NativeSelectOption>
										<NativeSelectOption value="completed">
											Completed
										</NativeSelectOption>
										<NativeSelectOption value="canceled">
											Canceled
										</NativeSelectOption>
									</NativeSelect>
								</Field>

								<Field>
									<FieldLabel htmlFor="priority">Priority</FieldLabel>
									<NativeSelect
										className="w-full"
										id="priority"
										name="priority"
										value={values.priority}
										onChange={(event) =>
											setValues((current) => ({
												...current,
												priority: event.target
													.value as TaskFormValues["priority"],
											}))
										}
									>
										<NativeSelectOption value="low">Low</NativeSelectOption>
										<NativeSelectOption value="medium">
											Medium
										</NativeSelectOption>
										<NativeSelectOption value="high">High</NativeSelectOption>
									</NativeSelect>
								</Field>

								<Field>
									<FieldLabel htmlFor="startDate">Start Date</FieldLabel>
									<Input
										id="startDate"
										name="startDate"
										type="date"
										value={values.startDate}
										onChange={(event) =>
											setValues((current) => ({
												...current,
												startDate: event.target.value,
											}))
										}
									/>
								</Field>

								<Field>
									<FieldLabel htmlFor="dueDate">Due Date</FieldLabel>
									<Input
										id="dueDate"
										name="dueDate"
										type="date"
										value={values.dueDate}
										onChange={(event) =>
											setValues((current) => ({
												...current,
												dueDate: event.target.value,
											}))
										}
									/>
								</Field>

								{values.status === "blocked" ? (
									<Field className="lg:col-span-2">
										<FieldLabel htmlFor="blockedReason">
											Blocked Reason
										</FieldLabel>
										<Input
											id="blockedReason"
											name="blockedReason"
											placeholder="Describe the blocker so the team can act on it"
											required
											value={values.blockedReason}
											onChange={(event) =>
												setValues((current) => ({
													...current,
													blockedReason: event.target.value,
												}))
											}
										/>
									</Field>
								) : null}

								<Field className="lg:col-span-2">
									<FieldLabel htmlFor="description">Description</FieldLabel>
									<Textarea
										className="min-h-40"
										id="description"
										name="description"
										placeholder="Add context, expected outcome or follow-up notes"
										value={values.description}
										onChange={(event) =>
											setValues((current) => ({
												...current,
												description: event.target.value,
											}))
										}
									/>
								</Field>
							</FieldGroup>

							<div
								aria-live="polite"
								className="min-h-5 text-sm text-destructive"
							>
								{error ? error : null}
							</div>

							<div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
								<p className="text-sm text-muted-foreground">
									Inbox stays available by leaving Project empty. Blocked tasks
									should always include a visible reason.
								</p>

								<Button disabled={isSubmitting} size="lg" type="submit">
									{isSubmitting ? "Saving…" : submitLabel}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				<Card className="border border-border/70 bg-card/70 ring-0">
					<CardHeader className="border-b border-border/70">
						<div>
							<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
								Editing Rules
							</p>
							<CardTitle className="mt-2 text-lg font-semibold text-foreground">
								Keep task state explicit
							</CardTitle>
						</div>
					</CardHeader>

					<CardContent className="flex flex-col gap-3 py-4 text-sm text-muted-foreground">
						<p>
							Use Inbox for uncategorized capture and add a project only when it
							matters.
						</p>
						<p>
							<span className="font-medium text-foreground">Blocked</span>{" "}
							should explain the constraint so the next person can act.
						</p>
						<p>
							Descriptions should stay operational: context, expected outcome
							and next owner.
						</p>
						<FieldDescription>
							Completing a task records its timestamp automatically on save.
						</FieldDescription>
					</CardContent>
				</Card>
			</div>

			{children}
		</div>
	);
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

	return "Task save failed. Verify the fields and try again.";
}
