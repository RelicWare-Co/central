import {
	createFileRoute,
	Link,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import { formatDueDateLabel } from "#/lib/formatting";
import {
	listProjects,
	type ProjectRecord,
	type ProjectStatus,
} from "#/lib/projects";

export const Route = createFileRoute("/app/projects")({
	loader: async ({ context }) => listProjects(context.auth),
	component: ProjectsRoute,
});

function ProjectsRoute() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const { items, summary } = Route.useLoaderData();

	if (pathname.startsWith("/app/projects/")) {
		return <Outlet />;
	}

	return (
		<section className="flex flex-col gap-4">
			<div>
				<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
					Projects
				</p>
				<h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground sm:text-2xl">
					Current Portfolio
				</h3>
			</div>

			<div className="flex flex-wrap gap-2">
				<SummaryBadge label="Portfolio" value={summary.total} />
				<SummaryBadge label="Active" value={summary.active} />
				<SummaryBadge label="Blocked" value={summary.blocked} />
				<SummaryBadge label="Completed" value={summary.completed} />
			</div>

			{items.length === 0 ? (
				<Empty className="min-h-[240px] border-border/70 bg-background/35">
					<EmptyHeader>
						<EmptyTitle className="text-sm font-medium text-foreground">
							No active projects
						</EmptyTitle>
						<EmptyDescription className="max-w-md text-sm text-muted-foreground">
							When projects are created in PocketBase, this view will surface
							their status, owner and deadline.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<div className="overflow-hidden rounded-sm border border-border/70 bg-background/20">
					{items.map((project) => (
						<article
							key={project.id}
							className="border-b border-border/70 px-4 py-4 last:border-b-0"
						>
							<div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.8fr)_auto_auto] lg:items-start">
								<div className="min-w-0">
									<p className="text-xs text-muted-foreground">
										{project.slug}
									</p>
									<h3 className="mt-1 text-base font-medium text-foreground">
										<Link
											className="transition-colors hover:text-primary"
											params={{
												projectId: project.id,
											}}
											to="/app/projects/$projectId"
										>
											{project.name}
										</Link>
									</h3>
									<p className="mt-2 max-w-3xl text-sm text-muted-foreground">
										{project.description?.trim() ||
											"No description yet. This project is ready for tasks, ownership and status tracking."}
									</p>
								</div>

								<div className="flex flex-wrap gap-2 lg:justify-end">
									<StatusBadge status={project.status} />
								</div>

								<div className="flex flex-col gap-3 lg:items-end">
									<dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-1">
										<MetaItem label="Owner" value={getOwnerLabel(project)} />
										<MetaItem
											label="Deadline"
											value={formatDueDateLabel(project.dueDate)}
										/>
									</dl>

									<Button asChild size="sm" variant="outline">
										<Link
											params={{
												projectId: project.id,
											}}
											to="/app/projects/$projectId"
										>
											Open Project
										</Link>
									</Button>
								</div>
							</div>
						</article>
					))}
				</div>
			)}
		</section>
	);
}

function MetaItem({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-[0.68rem] uppercase tracking-[0.18em]">{label}</dt>
			<dd className="mt-1 text-sm text-foreground">{value}</dd>
		</div>
	);
}

function SummaryBadge({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-sm border border-border/80 bg-background/85 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
			<span className="font-medium text-foreground">
				{String(value).padStart(2, "0")}
			</span>{" "}
			{label}
		</div>
	);
}

function StatusBadge({ status }: { status: ProjectStatus }) {
	const palette = {
		active: "border-sky-500/20 bg-sky-500/10 text-sky-300",
		archived: "border-border bg-background/70 text-muted-foreground",
		blocked: "border-destructive/20 bg-destructive/10 text-destructive",
		completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
		paused: "border-amber-500/20 bg-amber-500/10 text-amber-300",
	} satisfies Record<ProjectStatus, string>;

	return (
		<Badge variant="outline" className={palette[status]}>
			{status.replace("_", " ")}
		</Badge>
	);
}

function getOwnerLabel(project: ProjectRecord) {
	const owner = project.expand?.owner;

	if (!owner) {
		return "Unassigned";
	}

	return owner.name || owner.email || owner.username || "Assigned";
}
