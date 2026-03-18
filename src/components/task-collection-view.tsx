import { format, isPast, isToday, parseISO } from 'date-fns'
import { Badge } from '#/components/ui/badge'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#/components/ui/empty'
import type { TaskCollectionData, TaskPriority, TaskRecord, TaskStatus } from '#/lib/tasks'

type TaskCollectionViewProps = {
  description: string
  emptyDescription: string
  emptyTitle: string
  eyebrow: string
  tasks: TaskRecord[]
  title: string
  summary: TaskCollectionData['summary']
}

export function TaskCollectionView({
  description,
  emptyDescription,
  emptyTitle,
  eyebrow,
  summary,
  tasks,
  title,
}: TaskCollectionViewProps) {
  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={String(summary.total).padStart(2, '0')} />
        <StatCard
          label="In Progress"
          value={String(summary.inProgress).padStart(2, '0')}
        />
        <StatCard label="Blocked" value={String(summary.blocked).padStart(2, '0')} />
        <StatCard label="Due Today" value={String(summary.dueToday).padStart(2, '0')} />
        <StatCard label="Overdue" value={String(summary.overdue).padStart(2, '0')} />
      </div>

      <section className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[rgba(255,255,255,0.08)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--accent-foreground)]">
              {eyebrow}
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              {title}
            </h3>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">
            {description}
          </p>
        </div>

        {tasks.length === 0 ? (
          <Empty className="mt-6 min-h-[320px] border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.16)]">
            <EmptyHeader>
              <EmptyTitle className="text-base uppercase tracking-[0.2em] text-white">
                {emptyTitle}
              </EmptyTitle>
              <EmptyDescription className="max-w-md text-sm leading-7 text-[var(--muted-foreground)]">
                {emptyDescription}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[rgba(255,255,255,0.48)]">
                      {getTaskScopeLabel(task)}
                    </p>
                    <h4 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
                      {task.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </div>

                <p className="mt-4 min-h-14 text-sm leading-7 text-[var(--muted-foreground)]">
                  {getDescription(task.description)}
                </p>

                {task.status === 'blocked' && task.blockedReason ? (
                  <div className="mt-4 border border-[rgba(255,111,60,0.2)] bg-[rgba(255,111,60,0.08)] px-3 py-3 text-sm leading-6 text-[#ffbf9e]">
                    {task.blockedReason}
                  </div>
                ) : null}

                <dl className="mt-5 grid gap-4 border-t border-[rgba(255,255,255,0.08)] pt-5 sm:grid-cols-3">
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.46)]">
                      Due
                    </dt>
                    <dd className="mt-2 text-sm text-white">{getDueLabel(task.dueDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.46)]">
                      Assignee
                    </dt>
                    <dd className="mt-2 text-sm text-white">{getUserLabel(task.expand?.assignee)}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.46)]">
                      Creator
                    </dt>
                    <dd className="mt-2 text-sm text-white">
                      {getUserLabel(task.expand?.createdBy)}
                    </dd>
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

function StatusBadge({ status }: { status: TaskStatus }) {
  const palette = {
    blocked: 'border-[rgba(255,111,60,0.34)] bg-[rgba(255,111,60,0.12)] text-[#ffb18d]',
    canceled: 'border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.72)]',
    completed: 'border-[rgba(163,230,53,0.28)] bg-[rgba(163,230,53,0.12)] text-[#e5ffb0]',
    in_progress:
      'border-[rgba(94,234,212,0.28)] bg-[rgba(94,234,212,0.12)] text-[#c4fff1]',
    pending: 'border-[rgba(250,204,21,0.28)] bg-[rgba(250,204,21,0.12)] text-[#ffe89b]',
  } satisfies Record<TaskStatus, string>

  return (
    <Badge variant="outline" className={`uppercase tracking-[0.18em] ${palette[status]}`}>
      {status.replace('_', ' ')}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const palette = {
    high: 'border-[rgba(255,111,60,0.34)] bg-[rgba(255,111,60,0.12)] text-[#ffb18d]',
    low: 'border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.72)]',
    medium: 'border-[rgba(250,204,21,0.28)] bg-[rgba(250,204,21,0.12)] text-[#ffe89b]',
  } satisfies Record<TaskPriority, string>

  return (
    <Badge variant="outline" className={`uppercase tracking-[0.18em] ${palette[priority]}`}>
      {priority}
    </Badge>
  )
}

function getTaskScopeLabel(task: TaskRecord) {
  const project = task.expand?.project

  if (!project) {
    return 'Inbox'
  }

  return `${project.slug} · ${project.name}`
}

function getDescription(value?: string) {
  if (!value?.trim()) {
    return 'No description yet. This task is ready for state, assignment and follow-up.'
  }

  const plainText = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  return plainText || 'No description yet. This task is ready for state, assignment and follow-up.'
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

function getUserLabel(
  user?: {
    email?: string
    name?: string
    username?: string
  },
) {
  if (!user) {
    return 'Unassigned'
  }

  return user.name || user.email || user.username || 'Assigned'
}
