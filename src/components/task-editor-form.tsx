import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useBlocker } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  NativeSelect,
  NativeSelectOption,
} from '#/components/ui/native-select'
import { Textarea } from '#/components/ui/textarea'
import type { TaskFormOptions, TaskFormValues } from '#/lib/tasks'

type TaskEditorFormProps = {
  cancelAction: ReactNode
  children?: ReactNode
  description: string
  eyebrow: string
  initialValues: TaskFormValues
  onSubmit: (values: TaskFormValues) => Promise<void>
  options: TaskFormOptions
  submitLabel: string
  title: string
}

export function TaskEditorForm({
  cancelAction,
  children,
  description,
  eyebrow,
  initialValues,
  onSubmit,
  options,
  submitLabel,
  title,
}: TaskEditorFormProps) {
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues)

  useEffect(() => {
    setValues(initialValues)
    setError(null)
    setIsSubmitting(false)
  }, [initialValues])

  useBlocker({
    enableBeforeUnload: isDirty && !isSubmitting,
    shouldBlockFn: () => {
      if (!isDirty || isSubmitting) {
        return false
      }

      return !window.confirm('Discard unsaved changes?')
    },
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit(values)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--accent-foreground)]">
            {eyebrow}
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-balance text-white">
            {title}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            {description}
          </p>
        </div>

        <div className="shrink-0">{cancelAction}</div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form
          className="space-y-5 border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 sm:p-6"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2 lg:col-span-2">
              <Label
                htmlFor="title"
                className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.56)]"
              >
                Task Title
              </Label>
              <Input
                id="title"
                name="title"
                autoComplete="off"
                autoFocus
                placeholder="Define the next concrete piece of work…"
                className="h-12 border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 text-sm text-white placeholder:text-[rgba(245,245,245,0.32)] focus-visible:border-[rgba(255,111,60,0.7)] focus-visible:ring-[rgba(255,111,60,0.28)]"
                value={values.title}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="project"
                className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.56)]"
              >
                Project
              </Label>
              <NativeSelect
                id="project"
                name="project"
                className="w-full"
                value={values.project}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    project: event.target.value,
                  }))
                }
              >
                <NativeSelectOption value="">Inbox</NativeSelectOption>
                {options.projects.map((project) => (
                  <NativeSelectOption key={project.id} value={project.id}>
                    {project.name} · {project.slug}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="assignee"
                className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.56)]"
              >
                Assignee
              </Label>
              <NativeSelect
                id="assignee"
                name="assignee"
                className="w-full"
                value={values.assignee}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    assignee: event.target.value,
                  }))
                }
              >
                <NativeSelectOption value="">Unassigned</NativeSelectOption>
                {options.users.map((user) => (
                  <NativeSelectOption key={user.id} value={user.id}>
                    {user.name || user.email || user.id}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="status"
                className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.56)]"
              >
                Status
              </Label>
              <NativeSelect
                id="status"
                name="status"
                className="w-full"
                value={values.status}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    blockedReason:
                      event.target.value === 'blocked'
                        ? current.blockedReason
                        : '',
                    status: event.target.value as TaskFormValues['status'],
                  }))
                }
              >
                <NativeSelectOption value="pending">Pending</NativeSelectOption>
                <NativeSelectOption value="in_progress">
                  In Progress
                </NativeSelectOption>
                <NativeSelectOption value="blocked">Blocked</NativeSelectOption>
                <NativeSelectOption value="completed">
                  Completed
                </NativeSelectOption>
                <NativeSelectOption value="canceled">Canceled</NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="priority"
                className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.56)]"
              >
                Priority
              </Label>
              <NativeSelect
                id="priority"
                name="priority"
                className="w-full"
                value={values.priority}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    priority: event.target.value as TaskFormValues['priority'],
                  }))
                }
              >
                <NativeSelectOption value="low">Low</NativeSelectOption>
                <NativeSelectOption value="medium">Medium</NativeSelectOption>
                <NativeSelectOption value="high">High</NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="startDate"
                className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.56)]"
              >
                Start Date
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                className="h-12 border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 text-sm text-white focus-visible:border-[rgba(255,111,60,0.7)] focus-visible:ring-[rgba(255,111,60,0.28)]"
                value={values.startDate}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="dueDate"
                className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.56)]"
              >
                Due Date
              </Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                className="h-12 border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 text-sm text-white focus-visible:border-[rgba(255,111,60,0.7)] focus-visible:ring-[rgba(255,111,60,0.28)]"
                value={values.dueDate}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    dueDate: event.target.value,
                  }))
                }
              />
            </div>

            {values.status === 'blocked' ? (
              <div className="space-y-2 lg:col-span-2">
                <Label
                  htmlFor="blockedReason"
                  className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.56)]"
                >
                  Blocked Reason
                </Label>
                <Input
                  id="blockedReason"
                  name="blockedReason"
                  autoComplete="off"
                  placeholder="Describe the blocker so the team can act on it…"
                  className="h-12 border-[rgba(255,111,60,0.24)] bg-[rgba(255,111,60,0.08)] px-4 text-sm text-white placeholder:text-[rgba(255,191,158,0.58)] focus-visible:border-[rgba(255,111,60,0.7)] focus-visible:ring-[rgba(255,111,60,0.28)]"
                  value={values.blockedReason}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      blockedReason: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            ) : null}

            <div className="space-y-2 lg:col-span-2">
              <Label
                htmlFor="description"
                className="text-[0.68rem] uppercase tracking-[0.22em] text-[rgba(255,255,255,0.56)]"
              >
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                autoComplete="off"
                placeholder="Add context, expected outcome or follow-up notes…"
                className="min-h-40 border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-7 text-white placeholder:text-[rgba(245,245,245,0.32)] focus-visible:border-[rgba(255,111,60,0.7)] focus-visible:ring-[rgba(255,111,60,0.28)]"
                value={values.description}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div aria-live="polite" className="min-h-6 text-sm text-[var(--destructive)]">
            {error ? error : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-[rgba(255,255,255,0.08)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-[var(--muted-foreground)]">
              Inbox stays available by leaving Project empty. Blocked tasks should
              always carry a visible reason.
            </p>

            <Button
              type="submit"
              size="lg"
              className="h-12 border border-[rgba(255,111,60,0.4)] bg-[linear-gradient(180deg,rgba(255,111,60,0.92),rgba(202,59,0,0.92))] px-5 text-[0.74rem] font-semibold uppercase tracking-[0.28em] text-black transition-[transform,box-shadow,background-color] hover:bg-[linear-gradient(180deg,rgba(255,136,92,0.95),rgba(222,85,26,0.95))] focus-visible:ring-[rgba(255,111,60,0.3)]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : submitLabel}
            </Button>
          </div>
        </form>

        <aside className="space-y-4 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-5 sm:p-6">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--accent-foreground)]">
              Editing Rules
            </p>
            <h4 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-white">
              Keep Task State Explicit
            </h4>
          </div>

          <div className="space-y-4 text-sm leading-7 text-[var(--muted-foreground)]">
            <p>
              Use Inbox for uncategorized capture. Assign a project only when the
              work belongs to a clear initiative.
            </p>
            <p>
              `Blocked` should explain the constraint. `Completed` records its
              timestamp automatically on save.
            </p>
            <p>
              Keep descriptions operational: current context, expected outcome and
              the next person who should act.
            </p>
          </div>
        </aside>
      </div>

      {children}
    </section>
  )
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return 'Task save failed. Verify the fields and try again.'
}
