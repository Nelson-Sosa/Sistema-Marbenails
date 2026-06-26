import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
} from '@/services/clients/clientsService'
import { getAppointmentsByClient } from '@/services/appointments/appointmentsService'

const QUERY_KEY = 'clients'

/**
 * Fetch all clients.
 */
export function useClients() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: getClients,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch a single client by ID.
 * @param {string} clientId
 */
export function useClient(clientId) {
  return useQuery({
    queryKey: [QUERY_KEY, clientId],
    queryFn: () => getClientById(clientId),
    enabled: !!clientId,
  })
}

/**
 * Fetch appointment history for a client.
 * @param {string} clientId
 */
export function useClientHistory(clientId) {
  return useQuery({
    queryKey: [QUERY_KEY, clientId, 'history'],
    queryFn: () => getAppointmentsByClient(clientId),
    enabled: !!clientId,
  })
}

/**
 * Mutation: create a new client.
 */
export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

/**
 * Mutation: update an existing client.
 */
export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateClient(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
