import { QueryClient, MutationCache } from '@tanstack/react-query'
import toast from 'react-hot-toast'

/**
 * Global TanStack Query client configuration.
 *
 * Defaults:
 * - staleTime: 5 minutes — data is considered fresh for 5 min after fetching
 * - gcTime: 10 minutes — unused cache entries are removed after 10 min
 * - retry: 2 — failed queries retry 2 times before triggering error state
 * - refetchOnWindowFocus: false — prevents unexpected refetches on tab focus
 *
 * Global error handler: shows a toast notification for all query errors
 * that haven't been handled locally (using meta.suppressToast).
 */
export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Allow individual mutations to suppress global error toast
      if (mutation.meta?.suppressToast) return
      toast.error(error?.message || 'Ocurrió un error inesperado')
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      gcTime: 1000 * 60 * 10,     // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})
