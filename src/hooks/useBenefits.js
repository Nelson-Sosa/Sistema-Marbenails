import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBenefitsHistory,
  getLastBenefitsEvent,
  redeemFreeService,
} from '@/services/benefits/benefitsService'
import { getBenefitsSettings } from '@/services/settings/settingsService'

const BENEFITS_KEY = 'benefits'

/**
 * Fetch the salon's benefits program settings.
 */
export function useBenefitsSettings() {
  return useQuery({
    queryKey: [BENEFITS_KEY, 'settings'],
    queryFn: getBenefitsSettings,
    staleTime: 1000 * 60 * 15,
  })
}

/**
 * Fetch benefits/reward history for a specific client.
 * @param {string} clientId
 */
export function useBenefitsHistory(clientId) {
  return useQuery({
    queryKey: [BENEFITS_KEY, 'history', clientId],
    queryFn: () => getBenefitsHistory(clientId),
    enabled: !!clientId,
  })
}

/**
 * Fetch the most recent benefits event for a client.
 * @param {string} clientId
 */
export function useLastBenefitsEvent(clientId) {
  return useQuery({
    queryKey: [BENEFITS_KEY, 'lastEvent', clientId],
    queryFn: () => getLastBenefitsEvent(clientId),
    enabled: !!clientId,
  })
}

/**
 * Mutation: redeem a free service for a client.
 */
export function useRedeemFreeService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ clientId, adminUid }) => redeemFreeService(clientId, adminUid),
    onSuccess: (result, { clientId }) => {
      if (result?.success) {
        qc.invalidateQueries({ queryKey: ['clients'] })
        qc.invalidateQueries({ queryKey: [BENEFITS_KEY, 'history', clientId] })
        qc.invalidateQueries({ queryKey: [BENEFITS_KEY, 'lastEvent', clientId] })
      }
    },
  })
}
