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
		<section className="flex flex-col gap-5">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="text-xs font-medium text-muted-foreground">Projects</p>
					<h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
						Current portfolio
					</h3>
				</div>

				<Button asChild size="sm">
					<Link to="/app/projects/new">New project</Link>
				</Button>
			</div>

			<div className="flex flex-wrap gap-2">
				<SummaryBadge label="Portfolio" value={summary.total} />
				<SummaryBadge label="Active" value={summary.active} />
				<SummaryBadge label="Blocked" value={summary.blocked} />
				<SummaryBadge label="Completed" value={summary.completed} />
			</div>

			{items.length === 0 ? (
				<Empty className="min-h-[200px] border-border/30 bg-card/30">
					<EmptyHeader>
						<EmptyTitle className="text-sm font-medium text-foreground">
							No active projects
						</EmptyTitle>
						<EmptyDescription className="max-w-md text-sm text-muted-foreground">
							Create a project to organize tasks, assign owners and track
							deadlines.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<div className="flex flex-col gap-2">
					{items.map((project) => (
						<article
							key={project.id}
							className="group rounded-xl border border-border/30 bg-card/40 px-4 py-4 transition-colors hover:border-border/50 hover:bg-card/60 sm:px-5"
						>
							<div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(7rem,0.8fr)_minmax(8rem,0.9fr)_minmax(9rem,1fr)_auto] lg:items-start lg:gap-5">
								<div className="min-w-0">
									<p className="text-xs text-muted-foreground">
										{project.slug}
									</p>
									<h3 className="mt-1 text-pretty text-base font-semibold tracking-[-0.02em] text-foreground">
										<Link
											className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
											params={{
												projectId: project.id,
											}}
											to="/app/projects/$projectId"
										>
											{project.name}
										</Link>
									</h3>
									<p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
										{getRichTextPreview(
											project.description,
											"No description yet.",
										)}
									</p>
								</div>

								<div className="flex flex-wrap gap-1.5 lg:flex-col lg:items-start">
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
											Open
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
			<dt className="text-xs text-muted-foreground">{label}</dt>
			<dd
				className={cn(
					"mt-0.5 break-words text-sm font-medium text-foreground",
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
		<div className="inline-flex items-center gap-1.5 rounded-lg border border-border/30 bg-card/50 px-2.5 py-1 text-xs text-muted-foreground">
			<span className="font-semibold tabular-nums text-foreground">
				{String(value).padStart(2, "0")}
			</span>
			{label}
		</div>
	);
}

function StatusBadge({ status }: { status: ProjectStatus }) {
	const palette = {
		active: "border-sky-500/25 bg-sky-500/10 text-sky-400",
		archived: "border-border/40 bg-muted/30 text-muted-foreground",
		blocked: "border-destructive/25 bg-destructive/10 text-destructive",
		completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
		paused: "border-amber-500/25 bg-amber-500/10 text-amber-400",
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
