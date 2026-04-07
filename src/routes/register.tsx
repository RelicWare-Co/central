import { ArrowRightIcon, WarningOctagonIcon } from "@phosphor-icons/react";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";

type RegisterSearch = {
	redirect?: string;
};

function validateRedirect(value: unknown) {
	if (typeof value !== "string") {
		return undefined;
	}

	return value.startsWith("/") ? value : undefined;
}

export const Route = createFileRoute("/register")({
	validateSearch: (search): RegisterSearch => ({
		redirect: validateRedirect(search.redirect),
	}),
	beforeLoad: ({ context, search }) => {
		if (context.auth.getState().isAuthenticated) {
			throw redirect({
				to: search.redirect ?? "/app",
			});
		}
	},
	component: RegisterRoute,
});

function RegisterRoute() {
	const { auth } = Route.useRouteContext();
	const search = Route.useSearch();
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		setError(null);
		setIsSubmitting(true);

		// Validate passwords match
		if (password !== passwordConfirm) {
			setError("Passwords do not match");
			setIsSubmitting(false);
			return;
		}

		// Validate password strength
		if (password.length < 8) {
			setError("Password must be at least 8 characters long");
			setIsSubmitting(false);
			return;
		}

		try {
			await auth.register(email, password, passwordConfirm, name || undefined);
			await navigate({ replace: true, to: search.redirect ?? "/app" });
		} catch (caughtError) {
			setError(getRegisterErrorMessage(caughtError));
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
						Create your account
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Join your team and start organizing projects.
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
								<FieldLabel htmlFor="name">Name (optional)</FieldLabel>
								<Input
									autoComplete="name"
									id="name"
									name="name"
									placeholder="Your name"
									spellCheck={false}
									type="text"
									value={name}
									onChange={(event) => setName(event.target.value)}
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									autoComplete="email"
									id="email"
									inputMode="email"
									name="email"
									placeholder="you@company.com"
									required
									spellCheck={false}
									type="email"
									value={email}
									onChange={(event) => setEmail(event.target.value)}
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="password">Password</FieldLabel>
								<Input
									autoComplete="new-password"
									id="password"
									name="password"
									placeholder="At least 8 characters"
									required
									type="password"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="passwordConfirm">
									Confirm password
								</FieldLabel>
								<Input
									autoComplete="new-password"
									id="passwordConfirm"
									name="passwordConfirm"
									placeholder="Confirm your password"
									required
									type="password"
									value={passwordConfirm}
									onChange={(event) => setPasswordConfirm(event.target.value)}
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
								"Creating account..."
							) : (
								<>
									Create account
									<ArrowRightIcon data-icon="inline-end" />
								</>
							)}
						</Button>
					</form>
				</div>

				<p className="mt-6 text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link
						className="text-foreground underline underline-offset-4 hover:text-foreground/80"
						to="/login"
						search={{ redirect: search.redirect }}
					>
						Sign in
					</Link>
				</p>
			</section>
		</main>
	);
}

function getRegisterErrorMessage(error: unknown) {
	if (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof error.message === "string"
	) {
		// Handle common PocketBase errors
		if (
			error.message.includes("already exists") ||
			error.message.includes("unique")
		) {
			return "An account with this email already exists.";
		}
		return error.message;
	}

	return "Registration failed. Please try again.";
}
