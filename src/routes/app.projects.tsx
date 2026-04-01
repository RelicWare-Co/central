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
		<section className="flex flex-col gap-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
						Projects
					</p>
					<h3 className="mt-1.5 font-serif text-xl font-normal tracking-[-0.02em] text-foreground sm:text-2xl">
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
				<div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
					<div className="min-w-[200px] flex-1">
						<Input
							placeholder="Search projects..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-9 w-full"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-9 w-[130px]">
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
							<SelectTrigger className="h-9 w-[140px]">
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
				<Empty className="min-h-[200px]">
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
				<div className="flex flex-col">
					{filteredItems.map((project, index) => (
						<article
							key={project.id}
							className={cn(
								"group relative px-4 py-4 transition-colors duration-150 hover:bg-secondary/50 sm:px-5",
								index !== 0 && "border-t border-border",
							)}
						>
							<span
								className={cn(
									"absolute inset-y-0 left-0 w-0.5 transition-opacity",
									getProjectAccentClass(project.status),
								)}
							/>
							<div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(7rem,0.8fr)_minmax(8rem,0.9fr)_minmax(9rem,1fr)_auto] lg:items-start lg:gap-5">
								<div className="min-w-0">
									<p className="text-xs text-muted-foreground">
										{project.slug}
									</p>
									<h3 className="mt-1 text-pretty text-sm font-semibold tracking-[-0.01em] text-foreground">
										<Link
											className="transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
											params={{
												projectId: project.id,
											}}
											to="/app/projects/$projectId"
										>
											{project.name}
										</Link>
									</h3>
									<p className="mt-1 max-w-xl text-sm text-muted-foreground">
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
		default: "border-border bg-secondary text-foreground",
		info: "border-[oklch(0.85_0.04_230)] bg-[oklch(0.95_0.025_230)] text-[oklch(0.42_0.10_230)]",
		success:
			"border-[oklch(0.87_0.035_148)] bg-[oklch(0.955_0.02_148)] text-[oklch(0.40_0.10_148)]",
		warning:
			"border-[oklch(0.87_0.05_85)] bg-[oklch(0.955_0.03_85)] text-[oklch(0.45_0.12_80)]",
		danger:
			"border-[oklch(0.87_0.04_15)] bg-[oklch(0.955_0.02_15)] text-[oklch(0.42_0.13_18)]",
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
			"border-[oklch(0.85_0.04_230)] bg-[oklch(0.95_0.025_230)] text-[oklch(0.42_0.10_230)]",
		archived: "border-border bg-secondary text-muted-foreground",
		blocked:
			"border-[oklch(0.87_0.04_15)] bg-[oklch(0.955_0.02_15)] text-[oklch(0.42_0.13_18)]",
		completed:
			"border-[oklch(0.87_0.035_148)] bg-[oklch(0.955_0.02_148)] text-[oklch(0.40_0.10_148)]",
		paused:
			"border-[oklch(0.87_0.05_85)] bg-[oklch(0.955_0.03_85)] text-[oklch(0.45_0.12_80)]",
	} satisfies Record<ProjectStatus, string>;

	return (
		<Badge variant="outline" className={palette[status]}>
			{status.replace("_", " ")}
		</Badge>
	);
}

function getProjectAccentClass(status: ProjectStatus) {
	const map: Record<ProjectStatus, string> = {
		active: "bg-[oklch(0.55_0.12_230)]",
		paused: "bg-[oklch(0.60_0.14_72)]",
		blocked: "bg-[oklch(0.50_0.155_15)]",
		completed: "bg-[oklch(0.50_0.13_148)]",
		archived: "bg-[oklch(0.75_0.005_80)]",
	};
	return map[status];
}

function getOwnerLabel(project: ProjectRecord) {
	const owner = project.expand?.owner;

	if (!owner) {
		return "Unassigned";
	}

	return owner.name || owner.email || owner.username || "Assigned";
}
