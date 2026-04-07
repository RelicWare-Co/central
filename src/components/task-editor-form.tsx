import { CheckIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { useBlocker } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { DatePickerField } from "#/components/date-picker-field";
import { RichTextEditor } from "#/components/rich-text-editor";
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
import { getRichTextPreview } from "#/lib/rich-text";
import {
	formatTaskPriorityLabel,
	formatTaskStatusLabel,
	getTaskAssigneeLabel,
	getTaskProjectLabel,
	type TaskFormOptions,
	type TaskFormValues,
} from "#/lib/tasks";
import { getErrorMessage } from "#/lib/utils";

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
	const [isDescriptionEditorOpen, setIsDescriptionEditorOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

	useEffect(() => {
		setValues(initialValues);
		setError(null);
		setIsDescriptionEditorOpen(false);
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
		: "No start date";
	const dueDateLabel = formatDueDateLabel(values.dueDate);
	const summaryTitle = values.title.trim() || title;
	const toggleLabel = isEditorOpen
		? "Hide fields"
		: isCreateMode
			? "Show fields"
			: "Edit task";

	function handleToggleEditor(nextOpen: boolean) {
		setIsEditorOpen(nextOpen);
		onToggleEditor(nextOpen);
	}

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader className="border-b border-border">
					<div className="flex flex-col gap-4">
						<div className="flex items-start justify-between gap-4">
							<div className="min-w-0">
								<p className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
									{eyebrow}
								</p>
								<CardTitle className="mt-1 font-serif text-lg font-normal tracking-[-0.02em] sm:text-xl">
									{summaryTitle}
								</CardTitle>
								{description ? (
									<CardDescription className="mt-1 max-w-xl text-sm">
										{description}
									</CardDescription>
								) : null}
							</div>

							<div className="flex shrink-0 items-center gap-2">
								<button
									aria-expanded={isEditorOpen}
									onClick={() => handleToggleEditor(!isEditorOpen)}
									type="button"
									className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md active:scale-[0.98]"
								>
									<PencilSimpleIcon className="size-4" weight="duotone" />
									{toggleLabel}
								</button>
								{cancelAction}
							</div>
						</div>

						<dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
							<SummaryItem label="Project" value={projectLabel} />
							<SummaryItem label="Assignee" value={assigneeLabel} />
							<SummaryItem
								label="Status"
								value={formatTaskStatusLabel(values.status)}
							/>
							<SummaryItem
								label="Priority"
								value={formatTaskPriorityLabel(values.priority)}
							/>
							<SummaryItem label="Start date" value={startDateLabel} />
							<SummaryItem label="Due date" value={dueDateLabel} />
						</dl>

						{values.status === "blocked" && values.blockedReason.trim() ? (
							<div className="rounded-lg border border-[oklch(0.87_0.04_15)] bg-[oklch(0.955_0.02_15)] px-3.5 py-2.5">
								<p className="text-xs font-medium text-muted-foreground">
									Blocked reason
								</p>
								<p className="mt-0.5 text-sm text-foreground">
									{values.blockedReason.trim()}
								</p>
							</div>
						) : null}
					</div>
				</CardHeader>

				<Collapsible open={isEditorOpen} onOpenChange={handleToggleEditor}>
					<CollapsibleContent className="overflow-hidden border-b border-border data-[state=closed]:animate-out data-[state=open]:animate-in">
						<CardContent className="py-5">
							<FieldGroup className="grid gap-4 lg:grid-cols-2">
								<Field className="lg:col-span-2">
									<FieldLabel htmlFor="title">Task title</FieldLabel>
									<Input
										autoComplete="off"
										autoFocus
										id="title"
										name="title"
										placeholder="What needs to be done?"
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
									<FieldLabel htmlFor="startDate">Start date</FieldLabel>
									<DatePickerField
										id="startDate"
										label="Start date"
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
									<FieldLabel htmlFor="dueDate">Due date</FieldLabel>
									<DatePickerField
										id="dueDate"
										label="Due date"
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
											Blocked reason
										</FieldLabel>
										<Input
											id="blockedReason"
											name="blockedReason"
											placeholder="What is blocking this task?"
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
								Add context, expected outcome or follow-up notes.
							</FieldDescription>
							{isDescriptionEditorOpen ? (
								<RichTextEditor
									id="description"
									minHeightClassName="min-h-56"
									placeholder="Describe the work, expected outcome or next steps"
									value={values.description}
									onChange={(nextDescription) =>
										setValues((current) => ({
											...current,
											description: nextDescription,
										}))
									}
								/>
							) : (
								<button
									type="button"
									className="w-full rounded-sm border border-border bg-card p-3 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/30"
									onClick={() => setIsDescriptionEditorOpen(true)}
								>
									{values.description.trim()
										? getRichTextPreview(values.description, "Edit description")
										: "Add context, expected outcome or follow-up notes."}
								</button>
							)}
						</Field>

						<div
							aria-live="polite"
							className="min-h-5 text-sm text-destructive"
						>
							{error ? error : null}
						</div>

						<div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm text-muted-foreground">
								Leave Project empty to send to Inbox. Blocked tasks need a
								reason.
							</p>

							<button
								disabled={isSubmitting}
								type="submit"
								className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-[1px] hover:bg-zinc-800 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
							>
								<CheckIcon className="size-4" weight="bold" />
								{isSubmitting ? "Saving..." : submitLabel}
							</button>
						</div>
					</form>
				</CardContent>

				{children ? (
					<CardContent className="border-t border-border py-5">
						{children}
					</CardContent>
				) : null}
			</Card>
		</div>
	);
}

function SummaryItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-border bg-secondary/50 px-3.5 py-2">
			<dt className="text-xs text-muted-foreground">{label}</dt>
			<dd className="mt-0.5 truncate text-sm font-medium text-foreground">
				{value}
			</dd>
		</div>
	);
}

function getProjectLabel(projectId: string, options: TaskFormOptions) {
	return getTaskProjectLabel(projectId, options.projects);
}

function getAssigneeLabel(assigneeId: string, options: TaskFormOptions) {
	return getTaskAssigneeLabel(assigneeId, options.users);
}
