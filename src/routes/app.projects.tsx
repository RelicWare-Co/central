import {
	createFileRoute,
	Link,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
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

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [ownerFilter, setOwnerFilter] = useState("all");

	const owners = useMemo(() => {
		const map = new Map();
		for (const p of items) {
			if (p.expand?.owner) {
				map.set(p.owner, getOwnerLabel(p));
			}
		}
		return Array.from(map.entries());
	}, [items]);

	const filteredItems = useMemo(() => {
		return items.filter((project) => {
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				if (
					!project.name.toLowerCase().includes(query) &&
					!project.description?.toLowerCase().includes(query)
				) {
					return false;
				}
			}
			if (statusFilter !== "all" && project.status !== statusFilter)
				return false;
			if (
				ownerFilter !== "all" &&
				(project.owner || "unassigned") !== ownerFilter
			)
				return false;
			return true;
		});
	}, [items, searchQuery, statusFilter, ownerFilter]);

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
				<SummaryBadge
					label="Portfolio"
					value={summary.total}
					variant="default"
				/>
				<SummaryBadge label="Active" value={summary.active} variant="info" />
				<SummaryBadge
					label="Blocked"
					value={summary.blocked}
					variant="danger"
				/>
				<SummaryBadge
					label="Completed"
					value={summary.completed}
					variant="success"
				/>
			</div>

			{items.length > 0 ? (
				<div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-3 sm:p-4">
					<div className="min-w-[200px] flex-1">
						<Input
							placeholder="Search projects..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-9 w-full bg-background"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-9 w-[130px] bg-background">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All statuses</SelectItem>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="paused">Paused</SelectItem>
								<SelectItem value="blocked">Blocked</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
								<SelectItem value="archived">Archived</SelectItem>
							</SelectContent>
						</Select>
						<Select value={ownerFilter} onValueChange={setOwnerFilter}>
							<SelectTrigger className="h-9 w-[140px] bg-background">
								<SelectValue placeholder="Owner" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All owners</SelectItem>
								<SelectItem value="unassigned">Unassigned</SelectItem>
								{owners.map(([id, name]) => (
									<SelectItem key={id} value={id}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			) : null}

			{filteredItems.length === 0 ? (
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
					{filteredItems.map((project) => (
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

function SummaryBadge({
	label,
	value,
	variant = "default",
}: {
	label: string;
	value: number;
	variant?: "default" | "info" | "success" | "warning" | "danger";
}) {
	const palette = {
		default: "border-border/30 bg-card/50 text-foreground",
		info: "border-oklch(0.6 0.12 220 / 0.3) bg-oklch(0.6 0.12 220 / 0.08) text-oklch(0.75 0.1 220)",
		success:
			"border-oklch(0.65 0.14 145 / 0.3) bg-oklch(0.65 0.14 145 / 0.08) text-oklch(0.8 0.1 145)",
		warning:
			"border-oklch(0.72 0.14 85 / 0.3) bg-oklch(0.72 0.14 85 / 0.08) text-oklch(0.85 0.1 85)",
		danger:
			"border-oklch(0.55 0.16 25 / 0.3) bg-oklch(0.55 0.16 25 / 0.08) text-oklch(0.75 0.12 25)",
	};

	return (
		<div
			className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${palette[variant]}`}
		>
			<span className="font-semibold tabular-nums">
				{String(value).padStart(2, "0")}
			</span>
			{label}
		</div>
	);
}

function StatusBadge({ status }: { status: ProjectStatus }) {
	const palette = {
		active:
			"border-oklch(0.6 0.12 220 / 0.4) bg-oklch(0.6 0.12 220 / 0.12) text-oklch(0.75 0.1 220)",
		archived:
			"border-oklch(0.35 0.02 280 / 0.3) bg-oklch(0.28 0.02 280 / 0.1) text-oklch(0.6 0.02 280)",
		blocked:
			"border-oklch(0.55 0.16 25 / 0.4) bg-oklch(0.55 0.16 25 / 0.12) text-oklch(0.75 0.12 25)",
		completed:
			"border-oklch(0.65 0.14 145 / 0.4) bg-oklch(0.65 0.14 145 / 0.12) text-oklch(0.8 0.1 145)",
		paused:
			"border-oklch(0.72 0.14 85 / 0.4) bg-oklch(0.72 0.14 85 / 0.12) text-oklch(0.85 0.1 85)",
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
