import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	NativeSelect,
	NativeSelectOption,
} from "#/components/ui/native-select";
import { Textarea } from "#/components/ui/textarea";
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
		};
	},
	component: NewProjectRoute,
});

function NewProjectRoute() {
	const navigate = useNavigate({ from: Route.fullPath });
	const router = useRouter();
	const { defaults, options } = Route.useLoaderData();
	const [values, setValues] = useState<ProjectFormValues>(defaults);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const project = await createProject(values);

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
			<Card className="border border-border/70 bg-card/70 ring-0">
				<CardHeader className="border-b border-border/70">
					<div>
						<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
							New Project
						</p>
						<CardTitle className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground sm:text-2xl">
							Create Project
						</CardTitle>
						<CardDescription className="mt-2 max-w-3xl text-sm text-muted-foreground">
							Set ownership, scope and explicit status so the team can track
							work with low friction.
						</CardDescription>
					</div>

					<CardAction>
						<Button asChild size="sm" variant="outline">
							<Link to="/app/projects">Cancel</Link>
						</Button>
					</CardAction>
				</CardHeader>
			</Card>

			<Card className="border border-border/70 bg-card/70 ring-0">
				<CardContent className="py-5">
					<form
						className="flex flex-col gap-5"
						noValidate
						onSubmit={handleSubmit}
					>
						<FieldGroup className="grid gap-4 lg:grid-cols-2">
							<Field className="lg:col-span-2">
								<FieldLabel htmlFor="name">Project Name</FieldLabel>
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
								<NativeSelect
									className="w-full"
									id="owner"
									name="owner"
									value={values.owner}
									onChange={(event) =>
										setValues((current) => ({
											...current,
											owner: event.target.value,
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
											status: event.target.value as ProjectFormValues["status"],
										}))
									}
								>
									<NativeSelectOption value="active">Active</NativeSelectOption>
									<NativeSelectOption value="paused">Paused</NativeSelectOption>
									<NativeSelectOption value="blocked">
										Blocked
									</NativeSelectOption>
									<NativeSelectOption value="completed">
										Completed
									</NativeSelectOption>
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

							<Field className="lg:col-span-2">
								<FieldLabel htmlFor="description">Description</FieldLabel>
								<Textarea
									className="min-h-40"
									id="description"
									name="description"
									placeholder="Add scope, expected outcome and boundaries"
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

						<div className="flex justify-end border-t border-border/70 pt-4">
							<Button disabled={isSubmitting} size="lg" type="submit">
								{isSubmitting ? "Creating…" : "Create Project"}
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
