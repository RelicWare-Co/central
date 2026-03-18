import { createFileRoute } from '@tanstack/react-router'
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
      tasks={items}
      summary={summary}
      emptyTitle="No assigned tasks"
      emptyDescription="Cuando el usuario tenga tareas asignadas en PocketBase, esta vista servirá como su superficie operativa principal."
    />
  )
}
