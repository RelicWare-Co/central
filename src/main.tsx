import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { createAuthContext } from '#/lib/auth'
import { getRouter } from '#/router'

const auth = createAuthContext()
const router = getRouter(auth)

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<RouterProvider router={router} context={{ auth }} />)
}
