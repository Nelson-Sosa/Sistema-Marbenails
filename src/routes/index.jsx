import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/routes/ProtectedRoute'
import AppLayout from '@/layouts/AppLayout'
import LoginPage from '@/pages/Login/LoginPage'
import DashboardPage from '@/pages/Dashboard/DashboardPage'
import UserDashboardPage from '@/pages/Dashboard/UserDashboardPage'
import AppointmentsPage from '@/pages/Appointments/AppointmentsPage'
import ClientsPage from '@/pages/Clients/ClientsPage'
import ServicesPage from '@/pages/Services/ServicesPage'
import SettingsPage from '@/pages/Settings/SettingsPage'
import ProfilePage from '@/pages/Profile/ProfilePage'
import ProtectedAdminRoute from '@/routes/ProtectedAdminRoute'
import { ROUTES } from '@/routes/routes'

/**
 * Application router configuration using React Router v7's createBrowserRouter.
 *
 * Route structure:
 * /                        → Redirects to /dashboard
 * /login                   → Public: LoginPage
 * (ProtectedRoute)
 *   (AppLayout)
 *     /dashboard           → DashboardPage
 *     /appointments        → AppointmentsPage
 *     /clients             → ClientsPage
 *     /services            → ServicesPage
 *     /settings            → SettingsPage
 * *                        → Redirects to /dashboard
 */
export const router = createBrowserRouter([
  // ─── Root redirect ──────────────────────────────────────────────────────────
  {
    index: true,
    path: '/',
    element: <Navigate to={ROUTES.SERVICES} replace />,
  },

  // ─── Public routes ──────────────────────────────────────────────────────────
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },

  // ─── App Shell (Public & Protected) ─────────────────────────────────────────
  {
    element: <AppLayout />,
    children: [
      // Public routes inside layout
      {
        path: ROUTES.SERVICES,
        element: <ServicesPage />,
      },

      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: ROUTES.APPOINTMENTS,
            element: <AppointmentsPage />,
          },
          {
            path: ROUTES.USER_DASHBOARD,
            element: <UserDashboardPage />,
          },
          {
            path: ROUTES.PROFILE,
            element: <ProfilePage />,
          },
          // Admin only routes
          {
            element: <ProtectedAdminRoute />,
            children: [
              {
                path: ROUTES.DASHBOARD,
                element: <DashboardPage />,
              },
              {
                path: ROUTES.CLIENTS,
                element: <ClientsPage />,
              },
              {
                path: ROUTES.SETTINGS,
                element: <SettingsPage />,
              },
            ],
          },
        ],
      },
      
      {
        path: '*',
        element: <Navigate to={ROUTES.SERVICES} replace />,
      },
    ],
  },
])

export default router
