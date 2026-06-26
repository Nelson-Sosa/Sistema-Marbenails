import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRecentNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/services/notifications/notificationsService'

const QUERY_KEY = 'notifications'

export function useNotifications() {
  return useQuery({
    queryKey: [QUERY_KEY, 'recent'],
    queryFn: () => getRecentNotifications(50),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [QUERY_KEY, 'unreadCount'],
    queryFn: getUnreadCount,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}

export function useMarkAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
