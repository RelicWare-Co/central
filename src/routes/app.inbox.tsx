import { createFileRoute } from '@tanstack/react-router'
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
      tasks={items}
      summary={summary}
      emptyTitle="Inbox is clear"
      emptyDescription="Cuando existan tareas sin proyecto en PocketBase, aparecerán aquí como punto de entrada para priorización y asignación."
    />
  )
}
