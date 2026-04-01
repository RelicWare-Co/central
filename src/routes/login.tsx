import { ArrowRightIcon, WarningOctagonIcon } from "@phosphor-icons/react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";

type LoginSearch = {
	redirect?: string;
};

function validateRedirect(value: unknown) {
	if (typeof value !== "string") {
		return undefined;
	}

	return value.startsWith("/") ? value : undefined;
}

export const Route = createFileRoute("/login")({
	validateSearch: (search): LoginSearch => ({
		redirect: validateRedirect(search.redirect),
	}),
	beforeLoad: ({ context, search }) => {
		if (context.auth.getState().isAuthenticated) {
			throw redirect({
				to: search.redirect ?? "/app",
			});
		}
	},
	component: LoginRoute,
});

function LoginRoute() {
	const { auth } = Route.useRouteContext();
	const search = Route.useSearch();
	const navigate = useNavigate();
	const [identity, setIdentity] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		setError(null);
		setIsSubmitting(true);

		try {
			await auth.login(identity, password);
			await navigate({ replace: true, to: search.redirect ?? "/app" });
		} catch (caughtError) {
			setError(getLoginErrorMessage(caughtError));
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-background text-foreground">
			<section className="mx-auto w-full max-w-[400px] px-5 py-12">
				<div className="mb-10 text-center">
					<p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
						Central
					</p>
					<h1 className="mt-3 font-serif text-3xl font-normal tracking-[-0.02em] leading-[1.15] text-foreground">
						Sign in to your workspace
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Projects, tasks and team coordination in one place.
					</p>
				</div>

				<div className="rounded-xl border border-border bg-card p-6">
					<form
						className="flex flex-col gap-5"
						noValidate
						onSubmit={handleSubmit}
					>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="identity">Email</FieldLabel>
								<Input
									autoComplete="email"
									id="identity"
									inputMode="email"
									name="identity"
									placeholder="you@company.com"
									required
									spellCheck={false}
									type="email"
									value={identity}
									onChange={(event) => setIdentity(event.target.value)}
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="password">Password</FieldLabel>
								<Input
									autoComplete="current-password"
									id="password"
									name="password"
									placeholder="Enter your password"
									required
									type="password"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
								/>
							</Field>
						</FieldGroup>

						<div
							aria-live="polite"
							className="min-h-5 text-sm text-destructive"
						>
							{error ? (
								<p className="flex items-start gap-2">
									<WarningOctagonIcon
										aria-hidden="true"
										className="mt-0.5 size-4 shrink-0"
									/>
									<span>{error}</span>
								</p>
							) : null}
						</div>

						<Button disabled={isSubmitting} size="lg" type="submit">
							{isSubmitting ? (
								"Signing in..."
							) : (
								<>
									Sign in
									<ArrowRightIcon data-icon="inline-end" />
								</>
							)}
						</Button>
					</form>
				</div>

				<p className="mt-6 text-center text-xs text-muted-foreground">
					Use your credentials from the PocketBase users collection.
				</p>
			</section>
		</main>
	);
}

function getLoginErrorMessage(error: unknown) {
	if (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof error.message === "string"
	) {
		return error.message;
	}

	return "Sign in failed. Verify your credentials and try again.";
}
