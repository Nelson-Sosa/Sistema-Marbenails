import { useQuery } from '@tanstack/react-query'
import { getScheduleSettings, DEFAULT_SCHEDULE_SETTINGS } from '@/services/schedule/scheduleService'

export function useScheduleSettings() {
  return useQuery({
    queryKey: ['scheduleSettings'],
    queryFn: getScheduleSettings,
    initialData: DEFAULT_SCHEDULE_SETTINGS,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })
}
