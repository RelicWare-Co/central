import { useState } from 'react'
import { WarningOctagonIcon } from '@phosphor-icons/react'
import {
  createFileRoute,
  redirect,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

type LoginSearch = {
  redirect?: string
}

function validateRedirect(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  return value.startsWith('/') ? value : undefined
}

export const Route = createFileRoute('/login')({
  validateSearch: (search): LoginSearch => ({
    redirect: validateRedirect(search.redirect),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.getState().isAuthenticated) {
      throw redirect({
        to: search.redirect ?? '/app',
      })
    }
  },
  component: LoginRoute,
})

function LoginRoute() {
  const { auth } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/login' })
  const router = useRouter()
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)
    setIsSubmitting(true)

    try {
      await auth.login(identity, password)
      await router.invalidate()
      await navigate({ to: search.redirect ?? '/app' })
    } catch (caughtError) {
      setError(getLoginErrorMessage(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      <a
        href="#login-panel"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-[rgba(255,111,60,0.7)] focus:bg-[rgba(15,16,18,0.96)] focus:px-3 focus:py-2 focus:text-[0.72rem] focus:uppercase focus:tracking-[0.28em]"
      >
        Skip to Login
      </a>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,111,60,0.16),transparent_38%),linear-gradient(180deg,rgba(255,111,60,0.06),transparent_32%),linear-gradient(135deg,#090909_0%,#101113_52%,#070707_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,111,60,0.7),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-[8vw] hidden w-px bg-[linear-gradient(180deg,transparent,rgba(255,111,60,0.26),transparent)] lg:block" />
      <div className="pointer-events-none absolute bottom-16 left-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,111,60,0.18),transparent_68%)] blur-2xl" />

      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl gap-10 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-10">
        <div className="flex min-w-0 flex-col justify-between">
          <div className="max-w-2xl">
            <p className="mb-6 inline-flex items-center gap-3 border border-[rgba(255,111,60,0.28)] bg-[rgba(255,111,60,0.08)] px-4 py-2 text-[0.68rem] uppercase tracking-[0.34em] text-[var(--accent-foreground)]">
              Central Systems
            </p>

            <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.06em] text-balance text-white sm:text-5xl lg:text-7xl">
              Command Project Work Without Friction
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
              Central ordena proyectos, tareas y bloqueos con estados
              explícitos, cero ruido y visibilidad inmediata para equipos
              internos.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ['Signal', 'Inbox, Today y Projects sin capas de PM corporativo.'],
              ['Control', 'Estados visibles, responsables claros y bloqueos con motivo.'],
              ['Tempo', 'Interfaz rápida, operativa y lista para seguimiento diario.'],
            ].map(([title, description]) => (
              <article
                key={title}
                className="border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.03)] p-4 backdrop-blur-sm"
              >
                <h2 className="text-[0.72rem] uppercase tracking-[0.28em] text-[var(--accent-foreground)]">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div
          id="login-panel"
          className="relative flex items-center justify-center lg:justify-end"
        >
          <div className="w-full max-w-md border border-[rgba(255,111,60,0.28)] bg-[linear-gradient(180deg,rgba(18,18,20,0.97),rgba(9,9,10,0.95))] p-6 shadow-[0_0_0_1px_rgba(255,111,60,0.08),0_28px_80px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-5">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.34em] text-[var(--accent-foreground)]">
                  Secure Access
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                  Sign In
                </h2>
              </div>

              <div className="border border-[rgba(255,111,60,0.4)] px-3 py-2 text-right text-[0.68rem] uppercase tracking-[0.24em] text-[var(--accent-foreground)]">
                PB Auth
              </div>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <Label
                  htmlFor="identity"
                  className="text-[0.7rem] uppercase tracking-[0.24em] text-[var(--muted-foreground)]"
                >
                  Email
                </Label>
                <Input
                  id="identity"
                  name="identity"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  placeholder="operator@central.io…"
                  className="h-12 border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus-visible:border-[rgba(255,111,60,0.7)] focus-visible:ring-[rgba(255,111,60,0.28)]"
                  value={identity}
                  onChange={(event) => setIdentity(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[0.7rem] uppercase tracking-[0.24em] text-[var(--muted-foreground)]"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password…"
                  className="h-12 border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 text-sm text-white placeholder:text-[rgba(245,245,245,0.3)] focus-visible:border-[rgba(255,111,60,0.7)] focus-visible:ring-[rgba(255,111,60,0.28)]"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <div
                aria-live="polite"
                className="min-h-6 text-sm text-[var(--destructive)]"
              >
                {error ? (
                  <p className="flex items-start gap-2">
                    <WarningOctagonIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                    <span>{error}</span>
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full border border-[rgba(255,111,60,0.42)] bg-[linear-gradient(180deg,rgba(255,111,60,0.9),rgba(202,59,0,0.92))] text-[0.78rem] font-semibold uppercase tracking-[0.3em] text-black transition-[transform,background-color,box-shadow] hover:bg-[linear-gradient(180deg,rgba(255,136,92,0.95),rgba(222,85,26,0.95))] focus-visible:ring-[rgba(255,111,60,0.34)]"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Authorizing…' : 'Enter System'}
              </Button>
            </form>

            <div className="mt-6 border-t border-[rgba(255,255,255,0.08)] pt-5 text-xs leading-6 text-[var(--muted-foreground)]">
              Usa tu cuenta de la colección <span className="text-white">users</span>{' '}
              en PocketBase. Si el acceso falla, revisa credenciales activas o el
              endpoint configurado.
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function getLoginErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return 'Sign in failed. Verify your credentials and try again.'
}
