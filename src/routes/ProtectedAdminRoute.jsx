import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/routes/routes'
import Spinner from '@/components/ui/Spinner'

/**
 * ProtectedAdminRoute guards all admin-only routes.
 *
 * Behavior:
 * - While auth state is loading → shows a full-screen spinner
 * - If user is not authenticated → redirects to /login
 * - If user is not admin → redirects to /dashboard
 * - If user is admin → renders the nested <Outlet />
 */
function ProtectedAdminRoute() {
  const { isAuthenticated, role, loading, loadingRole } = useAuth()
  const location = useLocation()

  // Wait for both auth state AND Firestore role before making decisions
  if (loading || loadingRole) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
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

  if (role !== 'admin') {
    return <Navigate to={ROUTES.SERVICES} replace />
  }

  return <Outlet />
}

export default ProtectedAdminRoute
