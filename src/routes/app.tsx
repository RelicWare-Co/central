import { SignOutIcon } from '@phosphor-icons/react'
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { useAuth } from '#/lib/auth'

export const Route = createFileRoute('/app')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.getState().isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: `${location.pathname}${location.search}${location.hash}`,
        },
      })
    }
  },
  component: AppRoute,
})

const navigationItems = [
  {
    description: 'Tasks without a project',
    label: 'Inbox',
    to: '/app/inbox' as const,
  },
  {
    description: 'Work that needs attention now',
    label: 'Today',
    to: '/app/today' as const,
  },
  {
    description: 'Time-based planning lane',
    label: 'Upcoming',
    to: '/app/upcoming' as const,
  },
  {
    description: 'Project portfolio and status',
    label: 'Projects',
    to: '/app/projects' as const,
  },
  {
    description: 'Assigned work for the user',
    label: 'My Tasks',
    to: '/app/my-tasks' as const,
  },
]

function AppRoute() {
  const { auth } = Route.useRouteContext()
  const authState = useAuth(auth)
  const navigate = useNavigate({ from: '/app' })
  const router = useRouter()

  async function handleLogout() {
    auth.logout()
    await router.invalidate()
    await navigate({ to: '/login' })
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,111,60,0.14),transparent_22%),linear-gradient(180deg,#090909_0%,#111214_45%,#080808_100%)] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border border-[rgba(255,111,60,0.24)] bg-[linear-gradient(180deg,rgba(17,17,18,0.96),rgba(12,12,13,0.96))] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.42)]">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-5">
            <p className="text-[0.68rem] uppercase tracking-[0.34em] text-[var(--accent-foreground)]">
              Central Systems
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
              Operations Grid
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
              Estado explícito, poca fricción y una sola superficie para el trabajo interno.
            </p>
          </div>

          <nav aria-label="Primary" className="mt-5 grid gap-2">
            {navigationItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                preload="intent"
                activeOptions={{ exact: true }}
                className="group block border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-3 transition-[border-color,background-color]"
                activeProps={{
                  className:
                    'border-[rgba(255,111,60,0.42)] bg-[rgba(255,111,60,0.12)]',
                  'aria-current': 'page',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.78rem] uppercase tracking-[0.24em] text-white">
                    {item.label}
                  </span>
                  <span className="h-2 w-2 bg-[var(--accent-foreground)] opacity-60 transition-opacity group-aria-[current=page]:opacity-100" />
                </div>
                <p className="mt-2 text-xs leading-6 text-[var(--muted-foreground)]">
                  {item.description}
                </p>
              </Link>
            ))}
          </nav>

          <div className="mt-6 border-t border-[rgba(255,255,255,0.08)] pt-5">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--accent-foreground)]">
              Session
            </p>
            <dl className="mt-3 space-y-3 text-sm leading-6 text-[var(--muted-foreground)]">
              <div>
                <dt className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.46)]">
                  User
                </dt>
                <dd className="text-white">
                  {authState.user?.email ?? authState.user?.username ?? 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.46)]">
                  Role
                </dt>
                <dd className="text-white">{String(authState.user?.role ?? 'member')}</dd>
              </div>
            </dl>

            <Button
              type="button"
              variant="outline"
              className="mt-5 h-11 w-full border-[rgba(255,111,60,0.28)] bg-transparent px-4 text-[0.72rem] uppercase tracking-[0.24em] text-white transition-[background-color,border-color,color] hover:bg-[rgba(255,111,60,0.12)]"
              onClick={handleLogout}
            >
              <SignOutIcon aria-hidden="true" className="size-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        <div className="border border-[rgba(255,255,255,0.08)] bg-[rgba(17,17,18,0.88)] shadow-[0_18px_70px_rgba(0,0,0,0.42)] backdrop-blur-sm">
          <header className="border-b border-[rgba(255,255,255,0.08)] px-5 py-5 sm:px-6">
            <p className="text-[0.68rem] uppercase tracking-[0.32em] text-[var(--accent-foreground)]">
              Authenticated Workspace
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-balance text-white sm:text-4xl">
              Central Command Surface
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
              La navegación principal ya quedó estructurada. Desde aquí podemos crecer en proyectos,
              tareas, inbox y vistas personales sin rehacer el layout.
            </p>
          </header>

          <div className="p-5 sm:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  )
}
