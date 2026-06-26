import { useCallback } from 'react'

const PENDING_ACTION_KEY = 'marbenails_pending_action'

/**
 * Hook to manage pending actions that require authentication.
 * Uses sessionStorage to persist actions across redirects to the login page.
 */
export function usePendingAction() {
  /**
   * Save an action to be executed after login.
   * @param {Object} action - Action details (e.g. { type: 'BOOK_SERVICE', payload: { serviceId: '123' } })
   */
  const savePendingAction = useCallback((action) => {
    try {
      sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action))
    } catch (e) {
      console.error('Failed to save pending action:', e)
    }
  }, [])

  /**
   * Retrieve the saved pending action.
   * @returns {Object|null}
   */
  const getPendingAction = useCallback(() => {
    try {
      const data = sessionStorage.getItem(PENDING_ACTION_KEY)
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('Failed to parse pending action:', e)
      return null
    }
  }, [])

  /**
   * Clear the pending action.
   */
  const clearPendingAction = useCallback(() => {
    sessionStorage.removeItem(PENDING_ACTION_KEY)
  }, [])

  return {
    savePendingAction,
    getPendingAction,
    clearPendingAction,
  }
}
