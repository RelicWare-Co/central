import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { TaskCollectionView } from '#/components/task-collection-view'
import { listInboxTasks } from '#/lib/tasks'

export const Route = createFileRoute('/app/inbox')({
  loader: async ({ context }) => listInboxTasks(context.auth),
  component: InboxRoute,
})

function InboxRoute() {
  const { items, summary } = Route.useLoaderData()

  return (
    <TaskCollectionView
      eyebrow="Inbox"
      title="Unsorted Work Lands Here"
      description="Inbox lista tareas sin proyecto para preservar captura rápida, triage manual y claridad operativa antes de clasificar."
      headerAction={
        <Button
          type="button"
          size="lg"
          className="h-11 border border-[rgba(255,111,60,0.42)] bg-[linear-gradient(180deg,rgba(255,111,60,0.9),rgba(202,59,0,0.92))] px-4 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-black transition-[transform,box-shadow,background-color] hover:bg-[linear-gradient(180deg,rgba(255,136,92,0.95),rgba(222,85,26,0.95))]"
          asChild
        >
          <Link
            to="/app/tasks/new"
            search={{
              source: 'inbox',
            }}
          >
            New Task
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
              source: 'inbox',
            }}
          >
            Edit Task
          </Link>
        </Button>
      )}
      tasks={items}
      summary={summary}
      emptyTitle="Inbox is clear"
      emptyDescription="Cuando existan tareas sin proyecto en PocketBase, aparecerán aquí como punto de entrada para priorización y asignación."
    />
  )
}
