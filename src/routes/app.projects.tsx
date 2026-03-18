import { format, isPast, isToday, parseISO } from 'date-fns'
import { createFileRoute } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#/components/ui/empty'
import {
  listProjects,
  type ProjectRecord,
  type ProjectStatus,
} from '#/lib/projects'

export const Route = createFileRoute('/app/projects')({
  loader: async ({ context }) => listProjects(context.auth),
  component: ProjectsRoute,
})

function ProjectsRoute() {
  const { items, summary } = Route.useLoaderData()

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Portfolio" value={String(summary.total).padStart(2, '0')} />
        <StatCard label="Active" value={String(summary.active).padStart(2, '0')} />
        <StatCard label="Blocked" value={String(summary.blocked).padStart(2, '0')} />
        <StatCard label="Completed" value={String(summary.completed).padStart(2, '0')} />
      </div>

      <section className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[rgba(255,255,255,0.08)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--accent-foreground)]">
              Projects
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              Current Portfolio
            </h3>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">
            Primera vista real conectada a PocketBase. Aquí ya filtramos archivados y
            exponemos estado, responsable y vencimiento.
          </p>
        </div>

        {items.length === 0 ? (
          <Empty className="mt-6 min-h-[320px] border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.16)]">
            <EmptyHeader>
              <EmptyTitle className="text-base uppercase tracking-[0.2em] text-white">
                No active projects
              </EmptyTitle>
              <EmptyDescription className="max-w-md text-sm leading-7 text-[var(--muted-foreground)]">
                Cuando empecemos a crear proyectos en PocketBase, esta vista mostrará su
                estado operativo y servirá como punto de entrada al detalle.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {items.map((project) => (
              <article
                key={project.id}
                className="border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[rgba(255,255,255,0.48)]">
                      {project.slug}
                    </p>
                    <h4 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
                      {project.name}
                    </h4>
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                <p className="mt-4 min-h-14 text-sm leading-7 text-[var(--muted-foreground)]">
                  {project.description?.trim() ||
                    'No description yet. This project is ready for tasks, ownership and progress tracking.'}
                </p>

                <dl className="mt-5 grid gap-4 border-t border-[rgba(255,255,255,0.08)] pt-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.46)]">
                      Owner
                    </dt>
                    <dd className="mt-2 text-sm text-white">{getOwnerLabel(project)}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.46)]">
                      Deadline
                    </dt>
                    <dd className="mt-2 text-sm text-white">{getDueLabel(project.dueDate)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--accent-foreground)]">
        {label}
      </p>
      <p className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white">{value}</p>
    </article>
  )
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const palette = {
    active: 'border-[rgba(94,234,212,0.28)] bg-[rgba(94,234,212,0.12)] text-[#c4fff1]',
    blocked: 'border-[rgba(255,111,60,0.34)] bg-[rgba(255,111,60,0.12)] text-[#ffb18d]',
    completed: 'border-[rgba(163,230,53,0.28)] bg-[rgba(163,230,53,0.12)] text-[#e5ffb0]',
    paused: 'border-[rgba(250,204,21,0.28)] bg-[rgba(250,204,21,0.12)] text-[#ffe89b]',
    archived: 'border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.72)]',
  } satisfies Record<ProjectStatus, string>

  return (
    <Badge variant="outline" className={`uppercase tracking-[0.18em] ${palette[status]}`}>
      {status.replace('_', ' ')}
    </Badge>
  )
}

function getOwnerLabel(project: ProjectRecord) {
  const owner = project.expand?.owner

  if (!owner) {
    return 'Unassigned'
  }

  return owner.name || owner.email || owner.username || 'Assigned'
}

function getDueLabel(value?: string) {
  if (!value) {
    return 'No deadline'
  }

  const dueDate = parseISO(value)

  if (Number.isNaN(dueDate.getTime())) {
    return 'Invalid date'
  }

  if (isToday(dueDate)) {
    return `Due today · ${format(dueDate, 'MMM d, yyyy')}`
  }

  if (isPast(dueDate)) {
    return `Overdue · ${format(dueDate, 'MMM d, yyyy')}`
  }

  return format(dueDate, 'MMM d, yyyy')
}
