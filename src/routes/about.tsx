import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
	component: About,
});

function About() {
	return (
		<main className="min-h-screen bg-[linear-gradient(180deg,#090909_0%,#101113_100%)] px-6 py-10 text-white">
			<section className="mx-auto max-w-3xl border border-[rgba(255,111,60,0.24)] bg-[rgba(17,17,18,0.82)] p-6 sm:p-8">
				<p className="text-[0.68rem] uppercase tracking-[0.32em] text-[var(--accent-foreground)]">
					About Central
				</p>
				<h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-5xl">
					Operational clarity for internal teams.
				</h1>
				<p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted-foreground)]">
					Central está orientado a proyectos, tareas y subtareas con estados
					explícitos, baja fricción y visibilidad diaria. Esta pantalla queda
					como referencia simple mientras la navegación principal toma forma.
				</p>
			</section>
		</main>
	);
}
