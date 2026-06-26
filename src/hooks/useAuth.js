import { useAuth } from '@/context/AuthContext'

/**
 * Convenience hook for accessing the AuthContext.
 * Re-exported here so feature modules can import from hooks/ instead of context/.
 *
 * @example
 * const { user, logout, isAuthenticated } = useAuth()
 *
 * @returns {import('@/context/AuthContext').AuthContextValue}
 */
export { useAuth } from '@/context/AuthContext'
