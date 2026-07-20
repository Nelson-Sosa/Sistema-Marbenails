/**
 * Application route constants.
 * Centralize all route paths here to avoid magic strings across the codebase.
 * When adding new routes, add them here first.
 */
export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  REGISTER: '/register',

  // Protected routes
  DASHBOARD: '/dashboard',
  USER_DASHBOARD: '/my-dashboard',
  APPOINTMENTS: '/appointments',
  CLIENTS: '/clients',
  SERVICES: '/services',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  WORKS: '/trabajos',
  ADMIN_WORKS: '/admin/trabajos',

  // Nested routes (future)
  APPOINTMENT_DETAIL: '/appointments/:id',
  CLIENT_DETAIL: '/clients/:id',
  SERVICE_DETAIL: '/services/:id',
}
