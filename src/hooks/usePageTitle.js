import { useEffect } from 'react'
import { APP_NAME } from '@/constants/app'

/**
 * Hook to dynamically update the browser tab title.
 * Appends the app name for consistency: "Page Title — Marbenails"
 *
 * @param {string} title - The page-specific title
 * @param {boolean} [appendAppName=true] - Whether to append the app name
 *
 * @example
 * usePageTitle('Dashboard')         // => "Dashboard — Marbenails"
 * usePageTitle('Login', false)      // => "Login"
 */
export function usePageTitle(title, appendAppName = true) {
  useEffect(() => {
    const fullTitle = appendAppName ? `${title} — ${APP_NAME}` : title
    document.title = fullTitle

    // Reset to default app title on unmount
    return () => {
      document.title = APP_NAME
    }
  }, [title, appendAppName])
}
