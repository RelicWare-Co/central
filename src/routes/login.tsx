import { WarningOctagonIcon } from "@phosphor-icons/react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
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
		<main className="relative min-h-screen overflow-hidden bg-background text-foreground">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(210,121,78,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%)]" />

			<section className="relative mx-auto grid min-h-screen max-w-[1280px] items-center gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
				<div className="max-w-2xl">
					<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
						Central Systems
					</p>
					<h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl lg:text-6xl">
						Trabajo interno claro, rápido y sin peso extra.
					</h1>
					<p className="mt-4 max-w-xl text-base text-muted-foreground">
						Central organiza proyectos, tareas y bloqueos en una superficie
						sobria. Menos paneles, menos ruido y estados siempre visibles.
					</p>

					<div className="mt-8 grid gap-3 sm:grid-cols-3">
						{[
							[
								"Inbox",
								"Captura trabajo sin exigir proyecto desde el primer paso.",
							],
							["Hoy", "Prioriza lo que requiere atención inmediata."],
							[
								"Projects",
								"Mantén dueño, estado y deadlines en la misma vista.",
							],
						].map(([title, description]) => (
							<div
								key={title}
								className="rounded-2xl border border-border/70 bg-card/70 px-4 py-4 text-sm text-muted-foreground"
							>
								<p className="font-medium text-foreground">{title}</p>
								<p className="mt-2">{description}</p>
							</div>
						))}
					</div>
				</div>

				<Card className="border border-border/70 bg-card/85 shadow-[0_24px_80px_rgba(0,0,0,0.28)] ring-0">
					<CardHeader className="border-b border-border/70">
						<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
							Secure Access
						</p>
						<CardTitle className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
							Sign In
						</CardTitle>
						<CardDescription className="text-sm text-muted-foreground">
							Usa tu cuenta de la colección{" "}
							<span className="text-foreground">users</span> en PocketBase.
						</CardDescription>
					</CardHeader>

					<CardContent className="py-5">
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
										placeholder="operator@central.io"
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
								{isSubmitting ? "Authorizing…" : "Enter Workspace"}
							</Button>
						</form>
					</CardContent>
				</Card>
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
