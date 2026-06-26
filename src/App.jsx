import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes'

/**
 * App root — renders the React Router provider.
 * All global providers are set up in main.jsx above this component.
 */
function App() {
  return <RouterProvider router={router} />
}

export default App
