import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { TaskCollectionView } from '#/components/task-collection-view'
import { listMyTasks } from '#/lib/tasks'

export const Route = createFileRoute('/app/my-tasks')({
  loader: async ({ context }) => listMyTasks(context.auth),
  component: MyTasksRoute,
})

function MyTasksRoute() {
  const { items, summary } = Route.useLoaderData()

  return (
    <TaskCollectionView
      eyebrow="My Tasks"
      title="Assigned Work Surface"
      description="My Tasks agrupa el trabajo del usuario autenticado para ejecución diaria, seguimiento de bloqueos y deadlines visibles."
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
              source: 'my-tasks',
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
              source: 'my-tasks',
            }}
          >
            Edit Task
          </Link>
        </Button>
      )}
      tasks={items}
      summary={summary}
      emptyTitle="No assigned tasks"
      emptyDescription="Cuando el usuario tenga tareas asignadas en PocketBase, esta vista servirá como su superficie operativa principal."
    />
  )
}
