import { createFileRoute } from '@tanstack/react-router'
import { AppPlaceholderView } from '#/components/app-placeholder-view'

export const Route = createFileRoute('/app/my-tasks')({
  component: MyTasksRoute,
})

function MyTasksRoute() {
  return (
    <AppPlaceholderView
      eyebrow="My Tasks"
      title="Personal execution surface"
      description="Esta vista agrupará las tareas asignadas al usuario autenticado para que el enfoque personal y la visibilidad de equipo convivan en la misma app."
    />
  )
}
