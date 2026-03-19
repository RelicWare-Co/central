import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { useBlocker } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { DatePickerField } from "#/components/date-picker-field";
import { RichTextEditor } from "#/components/rich-text-editor";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Collapsible, CollapsibleContent } from "#/components/ui/collapsible";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { formatDateLabel, formatDueDateLabel } from "#/lib/formatting";
import type { TaskFormOptions, TaskFormValues } from "#/lib/tasks";

type TaskEditorFormProps = {
	cancelAction: ReactNode;
	children?: ReactNode;
	description?: string;
	editorOpen: boolean;
	eyebrow: string;
	initialValues: TaskFormValues;
	isCreateMode?: boolean;
	onSubmit: (values: TaskFormValues) => Promise<void>;
	onToggleEditor: (open: boolean) => void;
	options: TaskFormOptions;
	submitLabel: string;
	title: string;
};

export function TaskEditorForm({
	cancelAction,
	children,
	description,
	editorOpen,
	eyebrow,
	initialValues,
	isCreateMode = false,
	onSubmit,
	onToggleEditor,
	options,
	submitLabel,
	title,
}: TaskEditorFormProps) {
	const [values, setValues] = useState(initialValues);
	const [error, setError] = useState<string | null>(null);
	const [isEditorOpen, setIsEditorOpen] = useState(editorOpen);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

	useEffect(() => {
		setValues(initialValues);
		setError(null);
		setIsSubmitting(false);
	}, [initialValues]);

	useEffect(() => {
		setIsEditorOpen(editorOpen);
	}, [editorOpen]);

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

	const projectLabel = getProjectLabel(values.project, options);
	const assigneeLabel = getAssigneeLabel(values.assignee, options);
	const startDateLabel = values.startDate
		? formatDateLabel(values.startDate)
		: "No Start Date";
	const dueDateLabel = formatDueDateLabel(values.dueDate);
	const summaryTitle = values.title.trim() || title;
	const toggleLabel = isEditorOpen
		? "Hide Fields"
		: isCreateMode
			? "Show Fields"
			: "Edit Task";

	function handleToggleEditor(nextOpen: boolean) {
		setIsEditorOpen(nextOpen);
		onToggleEditor(nextOpen);
	}

	return (
		<div className="flex flex-col gap-4">
			<Card className="border border-border/70 bg-card/70 ring-0">
				<CardHeader className="border-b border-border/70">
					<div className="flex flex-col gap-4">
						<div className="flex items-start justify-between gap-4">
							<div className="min-w-0">
								<p className="text-[0.6rem] uppercase tracking-[0.22em] text-accent-foreground">
									{eyebrow}
								</p>
								<CardTitle className="mt-1 text-lg font-semibold tracking-[-0.04em] text-foreground sm:text-xl">
									{summaryTitle}
								</CardTitle>
								{description ? (
									<CardDescription className="mt-1 max-w-2xl text-xs text-muted-foreground">
										{description}
									</CardDescription>
								) : null}
							</div>

							<div className="flex shrink-0 items-center gap-2">
								<Button
									aria-expanded={isEditorOpen}
									onClick={() => handleToggleEditor(!isEditorOpen)}
									size="sm"
									type="button"
									variant={isEditorOpen ? "ghost" : "outline"}
								>
									{isEditorOpen ? (
										<CaretUpIcon data-icon="inline-start" />
									) : (
										<CaretDownIcon data-icon="inline-start" />
									)}
									{toggleLabel}
								</Button>
								{cancelAction}
							</div>
						</div>

						<dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
							<SummaryItem label="Project" value={projectLabel} />
							<SummaryItem label="Assignee" value={assigneeLabel} />
							<SummaryItem
								label="Status"
								value={formatStatusLabel(values.status)}
							/>
							<SummaryItem
								label="Priority"
								value={formatPriorityLabel(values.priority)}
							/>
							<SummaryItem label="Start Date" value={startDateLabel} />
							<SummaryItem label="Due Date" value={dueDateLabel} />
						</dl>

						{values.status === "blocked" && values.blockedReason.trim() ? (
							<div className="rounded-sm border border-border/70 bg-background/45 px-3 py-2">
								<p className="text-[0.6rem] uppercase tracking-[0.18em] text-accent-foreground">
									Blocked Reason
								</p>
								<p className="mt-1 text-sm text-foreground">
									{values.blockedReason.trim()}
								</p>
							</div>
						) : null}
					</div>
				</CardHeader>

				<Collapsible open={isEditorOpen} onOpenChange={handleToggleEditor}>
					<CollapsibleContent className="overflow-hidden border-b border-border/70 data-[state=closed]:animate-out data-[state=open]:animate-in">
						<CardContent className="py-5">
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
									<Select
										value={values.project || "__inbox"}
										onValueChange={(nextValue) =>
											setValues((current) => ({
												...current,
												project: nextValue === "__inbox" ? "" : nextValue,
											}))
										}
									>
										<SelectTrigger aria-label="Project" id="project">
											<SelectValue placeholder="Inbox" />
										</SelectTrigger>
										<SelectContent position="popper">
											<SelectGroup>
												<SelectItem value="__inbox">Inbox</SelectItem>
												{options.projects.map((project) => (
													<SelectItem key={project.id} value={project.id}>
														{project.name} · {project.slug}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</Field>

								<Field>
									<FieldLabel htmlFor="assignee">Assignee</FieldLabel>
									<Select
										value={values.assignee || "__unassigned"}
										onValueChange={(nextValue) =>
											setValues((current) => ({
												...current,
												assignee: nextValue === "__unassigned" ? "" : nextValue,
											}))
										}
									>
										<SelectTrigger aria-label="Assignee" id="assignee">
											<SelectValue placeholder="Unassigned" />
										</SelectTrigger>
										<SelectContent position="popper">
											<SelectGroup>
												<SelectItem value="__unassigned">Unassigned</SelectItem>
												{options.users.map((user) => (
													<SelectItem key={user.id} value={user.id}>
														{user.name || user.email || user.id}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</Field>

								<Field>
									<FieldLabel htmlFor="status">Status</FieldLabel>
									<Select
										value={values.status}
										onValueChange={(nextValue) =>
											setValues((current) => ({
												...current,
												blockedReason:
													nextValue === "blocked" ? current.blockedReason : "",
												status: nextValue as TaskFormValues["status"],
											}))
										}
									>
										<SelectTrigger aria-label="Status" id="status">
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent position="popper">
											<SelectGroup>
												<SelectItem value="pending">Pending</SelectItem>
												<SelectItem value="in_progress">In Progress</SelectItem>
												<SelectItem value="blocked">Blocked</SelectItem>
												<SelectItem value="completed">Completed</SelectItem>
												<SelectItem value="canceled">Canceled</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</Field>

								<Field>
									<FieldLabel htmlFor="priority">Priority</FieldLabel>
									<Select
										value={values.priority}
										onValueChange={(nextValue) =>
											setValues((current) => ({
												...current,
												priority: nextValue as TaskFormValues["priority"],
											}))
										}
									>
										<SelectTrigger aria-label="Priority" id="priority">
											<SelectValue placeholder="Select priority" />
										</SelectTrigger>
										<SelectContent position="popper">
											<SelectGroup>
												<SelectItem value="low">Low</SelectItem>
												<SelectItem value="medium">Medium</SelectItem>
												<SelectItem value="high">High</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</Field>

								<Field>
									<FieldLabel htmlFor="startDate">Start Date</FieldLabel>
									<DatePickerField
										id="startDate"
										label="Start Date"
										name="startDate"
										value={values.startDate}
										onChange={(nextValue) =>
											setValues((current) => ({
												...current,
												startDate: nextValue,
											}))
										}
									/>
								</Field>

								<Field>
									<FieldLabel htmlFor="dueDate">Due Date</FieldLabel>
									<DatePickerField
										id="dueDate"
										label="Due Date"
										name="dueDate"
										value={values.dueDate}
										onChange={(nextValue) =>
											setValues((current) => ({
												...current,
												dueDate: nextValue,
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
							</FieldGroup>
						</CardContent>
					</CollapsibleContent>
				</Collapsible>

				<CardContent className="py-5">
					<form
						className="flex flex-col gap-5"
						noValidate
						onSubmit={handleSubmit}
					>
						<Field className="lg:col-span-2">
							<FieldLabel htmlFor="description">Description</FieldLabel>
							<FieldDescription>
								Use short sections, lists and context notes to make the next
								step obvious.
							</FieldDescription>
							<RichTextEditor
								id="description"
								minHeightClassName="min-h-56"
								placeholder="Add context, expected outcome or follow-up notes"
								value={values.description}
								onChange={(nextDescription) =>
									setValues((current) => ({
										...current,
										description: nextDescription,
									}))
								}
							/>
						</Field>

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

				{children ? (
					<CardContent className="border-t border-border/70 py-5">
						{children}
					</CardContent>
				) : null}
			</Card>
		</div>
	);
}

function SummaryItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-sm border border-border/70 bg-background/45 px-3 py-2">
			<dt className="text-[0.6rem] uppercase tracking-[0.18em] text-accent-foreground">
				{label}
			</dt>
			<dd className="mt-1 truncate text-sm text-foreground">{value}</dd>
		</div>
	);
}

function getProjectLabel(projectId: string, options: TaskFormOptions) {
	if (!projectId) {
		return "Inbox";
	}

	const project = options.projects.find((item) => item.id === projectId);

	if (!project) {
		return "Unknown Project";
	}

	return project.slug ? `${project.name} · ${project.slug}` : project.name;
}

function getAssigneeLabel(assigneeId: string, options: TaskFormOptions) {
	if (!assigneeId) {
		return "Unassigned";
	}

	const user = options.users.find((item) => item.id === assigneeId);

	return user?.name || user?.email || user?.id || "Unknown User";
}

function formatStatusLabel(value: TaskFormValues["status"]) {
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

function formatPriorityLabel(value: TaskFormValues["priority"]) {
	switch (value) {
		case "high":
			return "High";
		case "low":
			return "Low";
		default:
			return "Medium";
	}
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
