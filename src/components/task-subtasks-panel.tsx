import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#/components/ui/empty'
import { Input } from '#/components/ui/input'
import { formatDateLabel } from '#/lib/formatting'
import {
  createSubtask,
  deleteSubtask,
  type SubtaskRecord,
  updateSubtaskCompletion,
} from '#/lib/tasks'

type TaskSubtasksPanelProps = {
  initialSubtasks: SubtaskRecord[]
  taskId: string
}

export function TaskSubtasksPanel({
  initialSubtasks,
  taskId,
}: TaskSubtasksPanelProps) {
  const [subtasks, setSubtasks] = useState(initialSubtasks)
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null)
  const completedCount = subtasks.filter((subtask) => subtask.isCompleted).length

  useEffect(() => {
    setSubtasks(initialSubtasks)
    setTitle('')
    setError(null)
    setIsCreating(false)
    setActiveSubtaskId(null)
  }, [initialSubtasks, taskId])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextTitle = title.trim()

    if (!nextTitle) {
      return
    }

    setError(null)
    setIsCreating(true)

    try {
      const record = await createSubtask(taskId, nextTitle, getNextPosition(subtasks))

      setSubtasks((current) => sortSubtasks([...current, record]))
      setTitle('')
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsCreating(false)
    }
  }

  async function handleToggle(subtask: SubtaskRecord, isCompleted: boolean) {
    setError(null)
    setActiveSubtaskId(subtask.id)

    try {
      const updated = await updateSubtaskCompletion(subtask.id, isCompleted)

      setSubtasks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setActiveSubtaskId(null)
    }
  }

  async function handleDelete(subtaskId: string) {
    setError(null)
    setActiveSubtaskId(subtaskId)

    try {
      await deleteSubtask(subtaskId)
      setSubtasks((current) => current.filter((item) => item.id !== subtaskId))
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setActiveSubtaskId(null)
    }
  }

  return (
    <section className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-[rgba(255,255,255,0.08)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--accent-foreground)]">
            Subtasks
          </p>
          <h4 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-white">
            Break the Work Down
          </h4>
        </div>

        <p className="text-sm leading-7 text-[var(--muted-foreground)]">
          {String(completedCount).padStart(2, '0')} of{' '}
          {String(subtasks.length).padStart(2, '0')} completed.
        </p>
      </div>

      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={handleCreate}
        noValidate
      >
        <Input
          id="new-subtask"
          name="new-subtask"
          autoComplete="off"
          placeholder="Add the next concrete subtask…"
          className="h-11 border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 text-sm text-white placeholder:text-[rgba(245,245,245,0.32)] focus-visible:border-[rgba(255,111,60,0.7)] focus-visible:ring-[rgba(255,111,60,0.28)]"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <Button
          type="submit"
          size="lg"
          className="h-11 border border-[rgba(255,111,60,0.42)] bg-[linear-gradient(180deg,rgba(255,111,60,0.9),rgba(202,59,0,0.92))] px-4 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-black transition-[transform,box-shadow,background-color] hover:bg-[linear-gradient(180deg,rgba(255,136,92,0.95),rgba(222,85,26,0.95))]"
          disabled={isCreating}
        >
          {isCreating ? 'Adding…' : 'Add Subtask'}
        </Button>
      </form>

      <div aria-live="polite" className="mt-3 min-h-6 text-sm text-[var(--destructive)]">
        {error ? error : null}
      </div>

      {subtasks.length === 0 ? (
        <Empty className="mt-4 min-h-[220px] border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.16)]">
          <EmptyHeader>
            <EmptyTitle className="text-base uppercase tracking-[0.2em] text-white">
              No subtasks yet
            </EmptyTitle>
            <EmptyDescription className="max-w-md text-sm leading-7 text-[var(--muted-foreground)]">
              Use subtasks to split the task into visible steps without changing the
              status of the main task automatically.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="mt-4 space-y-3">
          {subtasks.map((subtask) => {
            const isBusy = activeSubtaskId === subtask.id

            return (
              <article
                key={subtask.id}
                className="flex flex-col gap-4 border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Checkbox
                    checked={Boolean(subtask.isCompleted)}
                    onClick={(event) => {
                      event.preventDefault()
                      handleToggle(subtask, !Boolean(subtask.isCompleted))
                    }}
                    disabled={isBusy}
                    aria-label={`Mark ${subtask.title} as completed`}
                  />

                  <div className="min-w-0">
                    <p
                      className={`text-sm leading-7 text-white ${
                        subtask.isCompleted
                          ? 'text-[rgba(255,255,255,0.56)] line-through'
                          : ''
                      }`}
                    >
                      {subtask.title}
                    </p>
                    <p className="text-xs leading-6 text-[var(--muted-foreground)]">
                      {subtask.isCompleted && subtask.completedAt
                        ? `Completed ${formatDateLabel(subtask.completedAt)}`
                        : 'Pending'}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="border-[rgba(255,255,255,0.14)] bg-transparent text-[0.72rem] uppercase tracking-[0.18em] text-white transition-[border-color,background-color,color] hover:bg-[rgba(255,255,255,0.06)]"
                  onClick={() => handleDelete(subtask.id)}
                  disabled={isBusy}
                >
                  Remove
                </Button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function getNextPosition(subtasks: SubtaskRecord[]) {
  const currentMax = subtasks.reduce(
    (max, subtask) => Math.max(max, subtask.position ?? 0),
    0,
  )

  return currentMax + 1
}

function sortSubtasks(subtasks: SubtaskRecord[]) {
  return [...subtasks].sort((left, right) => {
    const leftPosition = left.position ?? Number.MAX_SAFE_INTEGER
    const rightPosition = right.position ?? Number.MAX_SAFE_INTEGER

    if (leftPosition !== rightPosition) {
      return leftPosition - rightPosition
    }

    return left.id.localeCompare(right.id)
  })
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

  return 'Subtask update failed. Try again.'
}
