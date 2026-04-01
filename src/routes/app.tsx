import {
	BriefcaseIcon,
	CalendarDotsIcon,
	FolderOpenIcon,
	ListChecksIcon,
	PlusIcon,
	SignOutIcon,
	StackIcon,
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
import { Button } from "#/components/ui/button";
import { useAuth } from "#/lib/auth";
import { cn } from "#/lib/utils";

let initialRefreshDone = false;

export const Route = createFileRoute("/app")({
	beforeLoad: async ({ context, location }) => {
		if (!context.auth.getState().isAuthenticated) {
			throw redirect({
				to: "/login",
				search: {
					redirect: `${location.pathname}${location.searchStr}${location.hash}`,
				},
			});
		}

		if (!initialRefreshDone) {
			initialRefreshDone = true;
			await context.auth.refresh();

			if (!context.auth.getState().isAuthenticated) {
				throw redirect({
					to: "/login",
					search: {
						redirect: `${location.pathname}${location.searchStr}${location.hash}`,
					},
				});
			}
		}
	},
	component: AppRoute,
});

const navigationItems = [
	{
		icon: TrayIcon,
		label: "Inbox",
		matchPrefix: "/app/inbox",
		to: "/app/inbox" as const,
	},
	{
		icon: CalendarDotsIcon,
		label: "Today",
		matchPrefix: "/app/today",
		to: "/app/today" as const,
	},
	{
		icon: BriefcaseIcon,
		label: "Upcoming",
		matchPrefix: "/app/upcoming",
		to: "/app/upcoming" as const,
	},
	{
		icon: FolderOpenIcon,
		label: "Projects",
		matchPrefix: "/app/projects",
		to: "/app/projects" as const,
	},
	{
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
	const primaryAction = getPrimaryAction(pathname);
	const contentContainerClassName = "mx-auto w-full max-w-5xl";

	async function handleLogout() {
		auth.logout();
		await navigate({ replace: true, to: "/login" });
	}

	return (
		<main className="min-h-screen bg-background text-foreground">
			<div className="mx-auto flex min-h-screen max-w-[1440px] flex-col md:flex-row">
				<aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar md:flex md:sticky md:top-0 md:h-screen">
					<div className="flex items-center gap-3 px-5 py-6">
						<div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
							<StackIcon className="size-4" weight="bold" />
						</div>
						<div>
							<p className="text-sm font-semibold tracking-[-0.01em] text-foreground">
								Central
							</p>
							<p className="text-[0.68rem] text-muted-foreground">Workspace</p>
						</div>
					</div>

					<div className="px-3 pb-3">
						<Button asChild className="w-full justify-start" size="sm">
							<Link to={primaryAction.to}>
								<PlusIcon data-icon="inline-start" />
								{primaryAction.label}
							</Link>
						</Button>
					</div>

					<nav
						aria-label="Primary"
						className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3"
					>
						{navigationItems.map((item) => (
							<NavLink key={item.to} item={item} />
						))}
					</nav>

					<div className="flex items-center justify-between gap-2 border-t border-border px-5 py-4">
						<div className="min-w-0 flex-1">
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

				<section className="flex min-w-0 flex-1 flex-col">
					<header className="border-b border-border bg-card px-6 py-5 sm:px-8">
						<div className={`${contentContainerClassName} flex flex-col gap-4`}>
							<div className="flex items-center justify-between gap-4">
								<div className="min-w-0">
									<h2 className="font-serif text-[1.65rem] font-normal tracking-[-0.02em] leading-[1.15] text-foreground sm:text-[1.85rem]">
										{currentView.label}
									</h2>
								</div>

								<Button
									asChild
									className="hidden shrink-0 md:inline-flex"
									size="sm"
								>
									<Link to={primaryAction.to}>
										<PlusIcon data-icon="inline-start" />
										{primaryAction.label}
									</Link>
								</Button>
							</div>

							<nav
								aria-label="Primary mobile"
								className="flex gap-1.5 overflow-x-auto md:hidden"
							>
								{navigationItems.map((item) => (
									<NavLink key={item.to} compact item={item} />
								))}
							</nav>
						</div>
					</header>

					<div className="flex-1 px-6 py-6 sm:px-8">
						<div className={contentContainerClassName}>
							<Outlet />
						</div>
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
		icon: ComponentType<{ className?: string; weight?: string }>;
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
			className={cn(
				"group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150",
				compact ? "shrink-0 whitespace-nowrap" : "w-full",
				isActive
					? "bg-secondary text-foreground font-medium"
					: "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
			)}
			preload="intent"
			to={item.to}
		>
			{isActive && !compact && (
				<span className="absolute left-0 inset-y-1.5 w-0.5 rounded-full bg-foreground" />
			)}
			<span
				className={cn(
					"flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
					isActive
						? "text-foreground"
						: "text-muted-foreground/70 group-hover:text-muted-foreground",
				)}
			>
				<Icon className="size-[0.95rem]" />
			</span>

			<span className="min-w-0 truncate">{item.label}</span>
		</Link>
	);
}

function getCurrentView(pathname: string) {
	if (pathname.startsWith("/app/projects/new")) {
		return { label: "New Project" };
	}

	if (pathname.startsWith("/app/projects/")) {
		return { label: "Project Detail" };
	}

	if (pathname.startsWith("/app/tasks/new")) {
		return { label: "New Task" };
	}

	if (pathname.startsWith("/app/tasks/")) {
		return { label: "Task Detail" };
	}

	return (
		navigationItems.find(
			(item) =>
				pathname === item.matchPrefix ||
				pathname.startsWith(`${item.matchPrefix}/`),
		) ?? { label: "Workspace" }
	);
}

function getPrimaryAction(pathname: string) {
	if (pathname === "/app/projects") {
		return {
			label: "New project",
			to: "/app/projects/new" as const,
		};
	}

	return {
		label: "New task",
		to: "/app/tasks/new" as const,
	};
}
