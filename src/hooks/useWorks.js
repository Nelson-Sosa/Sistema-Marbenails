/**
 * useWorks — React Query hooks for the `works` collection.
 * Follows the same architecture as useAppointments.js and useServices.js.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllWorks,
  getPublishedWorks,
  getWorksByClient,
  createWork,
  updateWork,
  toggleWorkPublished,
  deleteWork,
} from '@/services/works/worksService'

export const WORKS_QUERY_KEY = 'works'

/**
 * Fetch ALL works (admin panel).
 */
export function useWorks() {
  return useQuery({
    queryKey: [WORKS_QUERY_KEY, 'all'],
    queryFn: getAllWorks,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Fetch only published works (public gallery).
 */
export function usePublishedWorks() {
  return useQuery({
    queryKey: [WORKS_QUERY_KEY, 'published'],
    queryFn: getPublishedWorks,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Fetch works for a specific client (profile view).
 * @param {string} clientId
 */
export function useClientWorks(clientId) {
  return useQuery({
    queryKey: [WORKS_QUERY_KEY, 'byClient', clientId],
    queryFn: () => getWorksByClient(clientId),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Mutation: create a new work.
 * Invalidates all works queries on success.
 */
export function useCreateWork() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createWork,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WORKS_QUERY_KEY] })
    },
  })
}

/**
 * Mutation: update a work's details (title, description).
 */
export function useUpdateWork() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateWork(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WORKS_QUERY_KEY] })
    },
  })
}

/**
 * Mutation: toggle published state of a work.
 */
export function useToggleWorkPublished() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, published }) => toggleWorkPublished(id, published),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WORKS_QUERY_KEY] })
    },
  })
}

/**
 * Mutation: delete a work document (Firestore only).
 * Images in Cloudinary are NOT deleted (requires Cloud Functions).
 */
export function useDeleteWork() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => deleteWork(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WORKS_QUERY_KEY] })
    },
  })
}
