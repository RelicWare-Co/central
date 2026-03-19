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
import { usePocketBaseRealtimeInvalidate } from "#/hooks/use-pocketbase-realtime";
import { formatDueDateLabel } from "#/lib/formatting";
import {
	listProjects,
	type ProjectRecord,
	type ProjectStatus,
} from "#/lib/projects";
import { getRichTextPreview } from "#/lib/rich-text";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/app/projects")({
	loader: async ({ context }) => listProjects(context.auth),
	component: ProjectsRoute,
});

function ProjectsRoute() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const isProjectDetailRoute = pathname.startsWith("/app/projects/");
	const { items, summary } = Route.useLoaderData();

	usePocketBaseRealtimeInvalidate({
		collection: "projects",
		enabled: !isProjectDetailRoute,
		topic: "*",
	});

	if (isProjectDetailRoute) {
		return <Outlet />;
	}

	return (
		<section className="flex flex-col gap-4">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
						Projects
					</p>
					<h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground sm:text-2xl">
						Current Portfolio
					</h3>
				</div>

				<Button asChild size="sm">
					<Link to="/app/projects/new">New Project</Link>
				</Button>
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
							className="border-b border-border/70 px-4 py-5 last:border-b-0 sm:px-5"
						>
							<div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(7rem,0.8fr)_minmax(8.5rem,0.95fr)_minmax(9.5rem,1fr)_auto] lg:items-start lg:gap-5">
								<div className="min-w-0">
									<p className="truncate text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
										{project.slug}
									</p>
									<h3 className="mt-2 text-pretty text-lg font-semibold tracking-[-0.03em] text-foreground">
										<Link
											className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
											params={{
												projectId: project.id,
											}}
											to="/app/projects/$projectId"
										>
											{project.name}
										</Link>
									</h3>
									<p className="mt-2 max-w-2xl break-words text-sm text-muted-foreground">
										{getRichTextPreview(
											project.description,
											"No description yet. This project is ready for tasks, ownership and status tracking.",
										)}
									</p>
								</div>

								<div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
									<StatusBadge status={project.status} />
								</div>

								<MetaItem label="Owner" value={getOwnerLabel(project)} />

								<MetaItem
									label="Deadline"
									value={formatDueDateLabel(project.dueDate)}
									valueClassName="tabular-nums"
								/>

								<div className="flex flex-wrap gap-2 lg:justify-self-end">
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

function MetaItem({
	label,
	value,
	valueClassName,
}: {
	label: string;
	value: string;
	valueClassName?: string;
}) {
	return (
		<div className="min-w-0">
			<dt className="text-[0.68rem] uppercase tracking-[0.18em]">{label}</dt>
			<dd
				className={cn(
					"mt-2 break-words text-sm text-foreground",
					valueClassName,
				)}
			>
				{value}
			</dd>
		</div>
	);
}

function SummaryBadge({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-sm border border-border/80 bg-background/85 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
			<span className="font-medium tabular-nums text-foreground">
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
