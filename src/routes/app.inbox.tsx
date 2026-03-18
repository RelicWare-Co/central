import { createFileRoute } from '@tanstack/react-router'
import { AppPlaceholderView } from '#/components/app-placeholder-view'

export const Route = createFileRoute('/app/inbox')({
  component: InboxRoute,
})

function InboxRoute() {
  return (
    <AppPlaceholderView
      eyebrow="Inbox"
      title="Unsorted work lands here"
      description="Esta vista va a mostrar tareas sin proyecto para preservar el flujo rápido de captura que define el MVP."
    />
  )
}
