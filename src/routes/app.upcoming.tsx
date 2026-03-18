import { createFileRoute } from '@tanstack/react-router'
import { AppPlaceholderView } from '#/components/app-placeholder-view'

export const Route = createFileRoute('/app/upcoming')({
  component: UpcomingRoute,
})

function UpcomingRoute() {
  return (
    <AppPlaceholderView
      eyebrow="Upcoming"
      title="Forward visibility without PM overhead"
      description="La vista de próximas tareas servirá para ordenar fechas y mantener claridad operativa sin meter sprints ni planificación pesada."
    />
  )
}
