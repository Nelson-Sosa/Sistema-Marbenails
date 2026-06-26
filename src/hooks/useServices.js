import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getServices,
  getAllServices,
  getServiceById,
  getServicesByCategory,
  createService,
  updateService,
  toggleServiceActive,
  deleteService,
} from '@/services/services/servicesService'

const QUERY_KEY = 'services'

/**
 * Fetch all active services (public catalog).
 */
export function useServices() {
  return useQuery({
    queryKey: [QUERY_KEY, 'active'],
    queryFn: getServices,
    staleTime: 1000 * 60 * 30, // 30 minutes (catalog doesn't change often)
  })
}

/**
 * Fetch all services including inactive ones (admin use).
 */
export function useAllServices() {
  return useQuery({
    queryKey: [QUERY_KEY, 'all'],
    queryFn: getAllServices,
  })
}

/**
 * Fetch a single service by ID.
 * @param {string} serviceId
 */
export function useService(serviceId) {
  return useQuery({
    queryKey: [QUERY_KEY, serviceId],
    queryFn: () => getServiceById(serviceId),
    enabled: !!serviceId,
  })
}

/**
 * Mutation: create a new service.
 */
export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

/**
 * Mutation: update a service.
 */
export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateService(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

/**
 * Mutation: toggle service active state.
 */
export function useToggleServiceActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }) => toggleServiceActive(id, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

/**
 * Mutation: delete a service. Admin only.
 */
export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

/**
 * Fetch active services for a specific category.
 * @param {string} categoryId
 */
export function useServicesByCategory(categoryId) {
  return useQuery({
    queryKey: [QUERY_KEY, 'byCategory', categoryId],
    queryFn: () => getServicesByCategory(categoryId),
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 30,
  })
}
