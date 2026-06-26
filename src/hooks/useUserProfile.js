import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUserProfile, adminUpdateUserProfile } from '@/services/users/userProfileService'
import { useAuth } from '@/context/AuthContext'

/**
 * Hook to update the current user's own profile.
 * On success, reloads the auth profile so the context reflects changes.
 */
export function useUpdateUserProfile() {
  const { user, loadProfile } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data) => updateUserProfile(user.uid, data),
    onSuccess: async () => {
      // Re-load profile in AuthContext so header/sidebar reflects the new data
      if (loadProfile && user) await loadProfile(user)
      qc.invalidateQueries({ queryKey: ['userProfile', user?.uid] })
    },
  })
}

/**
 * Hook for admin to update any user's phone/whatsapp fields.
 */
export function useAdminUpdateUserProfile() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ uid, data }) => adminUpdateUserProfile(uid, data),
    onSuccess: (_data, { uid }) => {
      qc.invalidateQueries({ queryKey: ['userProfile', uid] })
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
