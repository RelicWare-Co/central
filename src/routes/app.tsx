import {
	BriefcaseIcon,
	CalendarDotsIcon,
	FolderOpenIcon,
	ListChecksIcon,
	PlusIcon,
	SignOutIcon,
	TrayIcon,
} from "@phosphor-icons/react";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import type { ComponentType } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { useAuth } from "#/lib/auth";

export const Route = createFileRoute("/app")({
	beforeLoad: ({ context, location }) => {
		if (!context.auth.getState().isAuthenticated) {
			throw redirect({
				to: "/login",
				search: {
					redirect: `${location.pathname}${location.searchStr}${location.hash}`,
				},
			});
		}
	},
	component: AppRoute,
});

const navigationItems = [
	{
		description: "Captured work that still needs sorting.",
		icon: TrayIcon,
		label: "Inbox",
		matchPrefix: "/app/inbox",
		to: "/app/inbox" as const,
	},
	{
		description: "Immediate work that needs attention now.",
		icon: CalendarDotsIcon,
		label: "Today",
		matchPrefix: "/app/today",
		to: "/app/today" as const,
	},
	{
		description: "Upcoming commitments and time-based work.",
		icon: BriefcaseIcon,
		label: "Upcoming",
		matchPrefix: "/app/upcoming",
		to: "/app/upcoming" as const,
	},
	{
		description: "Portfolio view across all active projects.",
		icon: FolderOpenIcon,
		label: "Projects",
		matchPrefix: "/app/projects",
		to: "/app/projects" as const,
	},
	{
		description: "Assigned work for the current user.",
		icon: ListChecksIcon,
		label: "My Tasks",
		matchPrefix: "/app/my-tasks",
		to: "/app/my-tasks" as const,
	},
];

function AppRoute() {
	const { auth } = Route.useRouteContext();
	const authState = useAuth(auth);
	const navigate = useNavigate();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const currentView = getCurrentView(pathname);

	async function handleLogout() {
		auth.logout();
		await navigate({ replace: true, to: "/login" });
	}

	return (
		<main className="min-h-screen bg-background text-foreground">
			<div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-3 p-3 md:flex-row md:p-4">
				<aside className="hidden w-64 shrink-0 flex-col rounded-3xl border border-border/70 bg-card/85 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur md:flex">
					<div className="flex items-center justify-between gap-3 border-b border-border/70 px-2 pb-4">
						<div>
							<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
								Central
							</p>
							<h1 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-foreground">
								Workspace
							</h1>
						</div>

						<Badge
							variant="outline"
							className="border-border/80 bg-background/70"
						>
							{String(authState.user?.role ?? "member")}
						</Badge>
					</div>

					<div className="py-4">
						<Button asChild className="w-full justify-start" size="lg">
							<Link to="/app/tasks/new">
								<PlusIcon data-icon="inline-start" />
								New Task
							</Link>
						</Button>
					</div>

					<nav aria-label="Primary" className="flex flex-1 flex-col gap-1">
						{navigationItems.map((item) => (
							<NavLink key={item.to} item={item} />
						))}
					</nav>

					<div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 px-2 pt-4">
						<div className="min-w-0">
							<p className="truncate text-sm font-medium text-foreground">
								{authState.user?.name ||
									authState.user?.email ||
									authState.user?.username ||
									"Unknown user"}
							</p>
							<p className="truncate text-xs text-muted-foreground">
								{authState.user?.email ?? "No email available"}
							</p>
						</div>

						<Button
							aria-label="Sign Out"
							onClick={handleLogout}
							size="icon-sm"
							variant="ghost"
						>
							<SignOutIcon />
						</Button>
					</div>
				</aside>

				<section className="flex min-w-0 flex-1 flex-col rounded-[1.75rem] border border-border/70 bg-card/75 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur">
					<header className="border-b border-border/70 px-4 py-4 sm:px-6">
						<div className="flex flex-col gap-4">
							<div className="flex items-start justify-between gap-4">
								<div className="min-w-0">
									<p className="text-[0.65rem] uppercase tracking-[0.24em] text-accent-foreground">
										Authenticated Workspace
									</p>
									<h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-3xl">
										{currentView.label}
									</h2>
									<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
										{currentView.description}
									</p>
								</div>

								<Button
									asChild
									className="hidden shrink-0 md:inline-flex"
									size="lg"
								>
									<Link to="/app/tasks/new">
										<PlusIcon data-icon="inline-start" />
										New Task
									</Link>
								</Button>
							</div>

							<nav
								aria-label="Primary mobile"
								className="flex gap-2 overflow-x-auto md:hidden"
							>
								{navigationItems.map((item) => (
									<NavLink key={item.to} compact item={item} />
								))}
							</nav>
						</div>
					</header>

					<div className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
						<Outlet />
					</div>
				</section>
			</div>
		</main>
	);
}

function NavLink({
	compact = false,
	item,
}: {
	compact?: boolean;
	item: {
		description: string;
		icon: ComponentType<{ className?: string }>;
		label: string;
		matchPrefix: string;
		to: (typeof navigationItems)[number]["to"];
	};
}) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const Icon = item.icon;
	const isActive =
		pathname === item.matchPrefix ||
		pathname.startsWith(`${item.matchPrefix}/`);

	return (
		<Link
			activeProps={{
				"aria-current": "page",
			}}
			className={[
				"group flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors",
				compact ? "shrink-0 whitespace-nowrap" : "w-full",
				isActive
					? "border-border bg-background text-foreground"
					: "border-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground",
			].join(" ")}
			preload="intent"
			to={item.to}
		>
			<span className="flex size-8 items-center justify-center rounded-xl bg-background/80 text-foreground/80 transition-colors group-hover:text-foreground">
				<Icon />
			</span>

			<span className="min-w-0">
				<span className="block text-sm font-medium">{item.label}</span>
				{!compact ? (
					<span className="block truncate text-xs text-muted-foreground">
						{item.description}
					</span>
				) : null}
			</span>
		</Link>
	);
}

function getCurrentView(pathname: string) {
	if (pathname.startsWith("/app/projects/")) {
		return {
			description:
				"Project detail keeps ownership, status and associated tasks in one surface.",
			label: "Project Detail",
		};
	}

	if (pathname.startsWith("/app/tasks/new")) {
		return {
			description:
				"Capture work quickly, keep state explicit and defer extra decisions.",
			label: "New Task",
		};
	}

	if (pathname.startsWith("/app/tasks/")) {
		return {
			description:
				"Update the task without losing the context of where you came from.",
			label: "Task Detail",
		};
	}

	return (
		navigationItems.find(
			(item) =>
				pathname === item.matchPrefix ||
				pathname.startsWith(`${item.matchPrefix}/`),
		) ?? {
			description:
				"Shared operating surface for projects, tasks and inbox work.",
			label: "Workspace",
		}
	);
}
