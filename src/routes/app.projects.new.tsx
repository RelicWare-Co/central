import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { DatePickerField } from "#/components/date-picker-field";
import { RichTextEditor } from "#/components/rich-text-editor";
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
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	createProject,
	getDefaultProjectFormValues,
	getProjectFormOptions,
	type ProjectFormValues,
} from "#/lib/projects";

export const Route = createFileRoute("/app/projects/new")({
	loader: async ({ context }) => {
		const options = await getProjectFormOptions(
			context.auth,
			"/app/projects/new",
		);

		return {
			defaults: getDefaultProjectFormValues(options.currentUserId),
			options,
			auth: context.auth,
		};
	},
	component: NewProjectRoute,
});

function NewProjectRoute() {
	const navigate = useNavigate({ from: Route.fullPath });
	const router = useRouter();
	const { auth, defaults, options } = Route.useLoaderData();
	const [values, setValues] = useState<ProjectFormValues>(defaults);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const project = await createProject(auth, values);

			await router.invalidate();
			await navigate({
				params: {
					projectId: project.id,
				},
				to: "/app/projects/$projectId",
			});
		} catch (caughtError) {
			setError(getErrorMessage(caughtError));
			setIsSubmitting(false);
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader className="border-b border-border">
					<div>
						<p className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
							New project
						</p>
						<CardTitle className="mt-1 font-serif text-xl font-normal tracking-[-0.02em] sm:text-2xl">
							Create project
						</CardTitle>
						<CardDescription className="mt-1.5 max-w-xl text-sm">
							Set ownership, scope and status so the team can track work with
							low friction.
						</CardDescription>
					</div>

					<CardAction>
						<Button asChild size="sm" variant="outline">
							<Link to="/app/projects">Cancel</Link>
						</Button>
					</CardAction>
				</CardHeader>
			</Card>

			<Card>
				<CardContent className="pt-6">
					<form
						className="flex flex-col gap-5"
						noValidate
						onSubmit={handleSubmit}
					>
						<FieldGroup className="grid gap-4 lg:grid-cols-2">
							<Field className="lg:col-span-2">
								<FieldLabel htmlFor="name">Project name</FieldLabel>
								<Input
									autoComplete="off"
									autoFocus
									id="name"
									name="name"
									placeholder="Name the initiative"
									required
									value={values.name}
									onChange={(event) =>
										setValues((current) => ({
											...current,
											name: event.target.value,
										}))
									}
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="slug">Slug</FieldLabel>
								<Input
									autoComplete="off"
									id="slug"
									name="slug"
									placeholder="product-ops"
									value={values.slug}
									onChange={(event) =>
										setValues((current) => ({
											...current,
											slug: event.target.value,
										}))
									}
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="owner">Owner</FieldLabel>
								<Select
									value={values.owner || "__unassigned"}
									onValueChange={(nextValue) =>
										setValues((current) => ({
											...current,
											owner: nextValue === "__unassigned" ? "" : nextValue,
										}))
									}
								>
									<SelectTrigger aria-label="Owner" id="owner">
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
											status: nextValue as ProjectFormValues["status"],
										}))
									}
								>
									<SelectTrigger aria-label="Status" id="status">
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent position="popper">
										<SelectGroup>
											<SelectItem value="active">Active</SelectItem>
											<SelectItem value="paused">Paused</SelectItem>
											<SelectItem value="blocked">Blocked</SelectItem>
											<SelectItem value="completed">Completed</SelectItem>
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

							<Field className="lg:col-span-2">
								<FieldLabel htmlFor="description">Description</FieldLabel>
								<FieldDescription>
									Describe the scope, outcome and boundaries.
								</FieldDescription>
								<RichTextEditor
									id="description"
									minHeightClassName="min-h-40"
									placeholder="Add scope, expected outcome and boundaries"
									value={values.description}
									onChange={(nextDescription) =>
										setValues((current) => ({
											...current,
											description: nextDescription,
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

						<div className="flex justify-end border-t border-border pt-4">
							<Button disabled={isSubmitting} size="lg" type="submit">
								{isSubmitting ? "Creating…" : "Create project"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
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

	return "Project creation failed. Verify the fields and try again.";
}
