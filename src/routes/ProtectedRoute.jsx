import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/routes/routes'
import Spinner from '@/components/ui/Spinner'

/**
 * ProtectedRoute guards all authenticated-only routes.
 *
 * Behavior:
 * - While auth state is loading → shows a full-screen spinner
 * - If user is not authenticated → redirects to /login (preserving intended URL)
 * - If user is authenticated → renders the nested <Outlet />
 *
 * The `state.from` pattern allows LoginPage to redirect back after successful login.
 *
 * @example
 * // In router config:
 * {
 *   element: <ProtectedRoute />,
 *   children: [{ path: '/dashboard', element: <DashboardPage /> }]
 * }
 */
function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-slate-950">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ from: location }}
        replace
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute
