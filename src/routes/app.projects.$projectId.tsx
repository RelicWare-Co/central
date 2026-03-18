import { Link, createFileRoute } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { TaskCollectionView } from '#/components/task-collection-view'
import { formatDateLabel, formatDueDateLabel } from '#/lib/formatting'
import {
  getProjectById,
  type ProjectRecord,
  type ProjectStatus,
} from '#/lib/projects'
import { listProjectTasks } from '#/lib/tasks'

export const Route = createFileRoute('/app/projects/$projectId')({
  loader: async ({ context, params }) => {
    const [project, tasks] = await Promise.all([
      getProjectById(
        context.auth,
        params.projectId,
        `/app/projects/${params.projectId}`,
      ),
      listProjectTasks(
        context.auth,
        params.projectId,
        `/app/projects/${params.projectId}`,
      ),
    ])

    return {
      project,
      tasks,
    }
  },
  component: ProjectDetailRoute,
  notFoundComponent: MissingProjectRoute,
})

function ProjectDetailRoute() {
  const { project, tasks } = Route.useLoaderData()
  const openTasks = tasks.items.filter(
    (task) => task.status !== 'completed' && task.status !== 'canceled',
  ).length

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--accent-foreground)]">
            Project Detail
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-balance text-white">
              {project.name}
            </h3>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            {getProjectDescription(project.description)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 border-[rgba(255,255,255,0.14)] bg-transparent px-4 text-[0.72rem] uppercase tracking-[0.24em] text-white transition-[border-color,background-color,color] hover:bg-[rgba(255,255,255,0.06)]"
            asChild
          >
            <Link to="/app/projects">Back to Projects</Link>
          </Button>

          <Button
            type="button"
            size="lg"
            className="h-11 border border-[rgba(255,111,60,0.42)] bg-[linear-gradient(180deg,rgba(255,111,60,0.9),rgba(202,59,0,0.92))] px-4 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-black transition-[transform,box-shadow,background-color] hover:bg-[linear-gradient(180deg,rgba(255,136,92,0.95),rgba(222,85,26,0.95))]"
            asChild
          >
            <Link
              to="/app/tasks/new"
              search={{
                projectId: project.id,
                source: 'project',
              }}
            >
              New Task
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open Tasks" value={String(openTasks).padStart(2, '0')} />
        <StatCard
          label="Blocked"
          value={String(tasks.summary.blocked).padStart(2, '0')}
        />
        <StatCard
          label="Due Today"
          value={String(tasks.summary.dueToday).padStart(2, '0')}
        />
        <StatCard
          label="Overdue"
          value={String(tasks.summary.overdue).padStart(2, '0')}
        />
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[rgba(255,255,255,0.48)]">
                {project.slug}
              </p>
              <h4 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-white">
                Operating Snapshot
              </h4>
            </div>

            <StatusBadge status={project.status} />
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <MetaItem label="Owner" value={getOwnerLabel(project)} />
            <MetaItem label="Start Date" value={formatDateLabel(project.startDate)} />
            <MetaItem label="Deadline" value={formatDueDateLabel(project.dueDate)} />
            <MetaItem
              label="Completed"
              value={String(tasks.summary.completed).padStart(2, '0')}
            />
          </dl>
        </article>

        <aside className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-5 sm:p-6">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--accent-foreground)]">
            Project Rules
          </p>
          <h4 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-white">
            Keep Work Visible
          </h4>
          <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted-foreground)]">
            <p>
              Use the project detail as the operating surface for execution,
              blockers and deadline review.
            </p>
            <p>
              Archived work should stay out of active views. Blocked tasks should
              expose the reason directly in the list.
            </p>
            <p>
              If new work still lacks context, capture it in Inbox first and move
              it here later.
            </p>
          </div>
        </aside>
      </section>

      <TaskCollectionView
        eyebrow="Project Tasks"
        title="Associated Work"
        description="This list keeps the project grounded in explicit tasks, visible assignees and deadlines that can be acted on."
        headerAction={
          <Button
            type="button"
            variant="outline"
            className="border-[rgba(255,255,255,0.14)] bg-transparent text-[0.72rem] uppercase tracking-[0.18em] text-white transition-[border-color,background-color,color] hover:bg-[rgba(255,255,255,0.06)]"
            asChild
          >
            <Link
              to="/app/tasks/new"
              search={{
                projectId: project.id,
                source: 'project',
              }}
            >
              Add Task
            </Link>
          </Button>
        }
        renderTaskActions={(task) => (
          <Button
            type="button"
            variant="outline"
            className="border-[rgba(255,255,255,0.14)] bg-transparent text-[0.72rem] uppercase tracking-[0.18em] text-white transition-[border-color,background-color,color] hover:bg-[rgba(255,255,255,0.06)]"
            asChild
          >
            <Link
              to="/app/tasks/$taskId"
              params={{
                taskId: task.id,
              }}
              search={{
                projectId: project.id,
                source: 'project',
              }}
            >
              Edit Task
            </Link>
          </Button>
        )}
        tasks={tasks.items}
        summary={tasks.summary}
        emptyTitle="No project tasks yet"
        emptyDescription="Create the first task for this project to make ownership, state and next steps visible."
      />
    </section>
  )
}

function MissingProjectRoute() {
  return (
    <section className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-6">
      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--accent-foreground)]">
        Project Detail
      </p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
        Project Not Found
      </h3>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">
        This project no longer exists or your session cannot access it.
      </p>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="mt-5 h-12 border-[rgba(255,255,255,0.14)] bg-transparent px-5 text-[0.74rem] uppercase tracking-[0.24em] text-white transition-[border-color,background-color,color] hover:bg-[rgba(255,255,255,0.06)]"
        asChild
      >
        <Link to="/app/projects">Back to Projects</Link>
      </Button>
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

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.46)]">
        {label}
      </dt>
      <dd className="mt-2 text-sm text-white">{value}</dd>
    </div>
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

function getProjectDescription(value?: string) {
  if (!value?.trim()) {
    return 'No description yet. This project is ready for tasks, ownership and explicit state tracking.'
  }

  const plainText = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  return (
    plainText ||
    'No description yet. This project is ready for tasks, ownership and explicit state tracking.'
  )
}
