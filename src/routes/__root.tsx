import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TooltipProvider } from '#/components/ui/tooltip'
import type { AuthContext } from '#/lib/auth'
import '../styles.css'

export const Route = createRootRouteWithContext<{ auth: AuthContext }>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
    <TooltipProvider>
      <Outlet />
    </TooltipProvider>
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  )
}
