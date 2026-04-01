import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import { Input } from "#/components/ui/input";
import { ProjectCard } from "#/components/ui/project-card";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import type { ProjectRecord } from "#/lib/projects";
import {
	projectsListLiveQueryOptions,
	projectsListSnapshotQueryOptions,
} from "#/lib/projects.queries";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/app/projects")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData({
			...projectsListSnapshotQueryOptions(context.auth),
			revalidateIfStale: true,
		});
	},
	component: ProjectsRoute,
});

function ProjectsRoute() {
	const { auth } = Route.useRouteContext();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const isProjectDetailRoute = pathname.startsWith("/app/projects/");
	const {
		data: { items, summary },
	} = useSuspenseQuery(projectsListLiveQueryOptions(auth));

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [ownerFilter, setOwnerFilter] = useState("all");
	const [isPending, startTransition] = useTransition();

	const owners = useMemo(() => {
		const map = new Map();
		for (const p of items) {
			if (p.expand?.owner) {
				map.set(p.owner, getOwnerLabel(p));
			}
		}
		return Array.from(map.entries());
	}, [items]);

	const handleStatusChange = (value: string) => {
		startTransition(() => {
			setStatusFilter(value);
		});
	};

	const handleOwnerChange = (value: string) => {
		startTransition(() => {
			setOwnerFilter(value);
		});
	};

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

	const hasActiveFilters =
		statusFilter !== "all" || ownerFilter !== "all" || searchQuery !== "";

	const activeFilterCount = [
		statusFilter !== "all",
		ownerFilter !== "all",
		searchQuery !== "",
	].filter(Boolean).length;

	function handleClearFilters() {
		setSearchQuery("");
		setStatusFilter("all");
		setOwnerFilter("all");
	}

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
				<div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
					{/* Search Input */}
					<div className="relative min-w-0 flex-1">
						<MagnifyingGlassIcon
							className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							placeholder="Search projects..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-10 w-full rounded-xl border-border bg-secondary/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground/60 focus-visible:bg-background"
						/>
					</div>

					<Separator orientation="vertical" className="hidden h-8 sm:block" />

					{/* Filter Dropdowns */}
					<div className="flex flex-wrap items-center gap-2">
						<Select value={statusFilter} onValueChange={handleStatusChange}>
							<SelectTrigger
								aria-label="Filter by status"
								className="h-10 w-auto min-w-[140px] gap-2 rounded-xl border-border bg-secondary/50 px-3 text-sm font-medium hover:bg-secondary data-[state=open]:bg-background"
							>
								<SelectValue placeholder="All statuses" />
							</SelectTrigger>
							<SelectContent position="popper" align="end">
								<SelectGroup>
									<SelectItem value="all">All statuses</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="paused">Paused</SelectItem>
									<SelectItem value="blocked">Blocked</SelectItem>
									<SelectItem value="completed">Completed</SelectItem>
									<SelectItem value="archived">Archived</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>

						<Select value={ownerFilter} onValueChange={handleOwnerChange}>
							<SelectTrigger
								aria-label="Filter by owner"
								className="h-10 w-auto min-w-[150px] gap-2 rounded-xl border-border bg-secondary/50 px-3 text-sm font-medium hover:bg-secondary data-[state=open]:bg-background"
							>
								<SelectValue placeholder="All owners" />
							</SelectTrigger>
							<SelectContent position="popper" align="end">
								<SelectGroup>
									<SelectItem value="all">All owners</SelectItem>
									<SelectItem value="unassigned">Unassigned</SelectItem>
									{owners.map(([id, name]) => (
										<SelectItem key={id} value={id}>
											{name}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>

						{hasActiveFilters && (
							<>
								<Separator
									orientation="vertical"
									className="mx-1 hidden h-6 sm:block"
								/>
								<Button
									onClick={handleClearFilters}
									variant="ghost"
									size="sm"
									className="h-10 gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
								>
									<XIcon data-icon="inline-start" className="size-4" />
									Clear
									{activeFilterCount > 0 && (
										<Badge
											variant="secondary"
											className="ml-1 h-5 min-w-5 px-1.5 text-xs"
										>
											{activeFilterCount}
										</Badge>
									)}
								</Button>
							</>
						)}
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
				<div
					className={cn(
						"flex flex-col gap-3",
						isPending && "opacity-70 transition-opacity duration-200",
					)}
				>
					{filteredItems.map((project, index) => (
						<ProjectCard
							key={project.id}
							project={project}
							variant="default"
							size="md"
							index={index}
						/>
					))}
				</div>
			)}
		</section>
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

function getOwnerLabel(project: ProjectRecord) {
	const owner = project.expand?.owner;

	if (!owner) {
		return "Unassigned";
	}

	return owner.name || owner.email || owner.username || "Assigned";
}
