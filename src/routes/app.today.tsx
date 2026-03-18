import { createFileRoute } from '@tanstack/react-router'
import { AppPlaceholderView } from '#/components/app-placeholder-view'

export const Route = createFileRoute('/app/today')({
  component: TodayRoute,
})

function TodayRoute() {
  return (
    <AppPlaceholderView
      eyebrow="Today"
      title="Focus lane for immediate work"
      description="Aquí vamos a priorizar vencidas, tareas para hoy, prioritarias y en progreso del usuario, como define AGENTS.md."
    />
  )
}
