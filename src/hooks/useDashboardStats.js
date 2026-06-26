import { useQuery } from '@tanstack/react-query'
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { getAppointmentsByDateRange } from '@/services/appointments/appointmentsService'
import { getClients } from '@/services/clients/clientsService'
import { APPOINTMENT_STATUS } from '@/constants/app'

/**
 * Hook to calculate Dashboard KPIs for the current day and month.
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const now = new Date()
      const todayStart = startOfDay(now)
      const todayEnd = endOfDay(now)
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)

      // 1. Today's appointments
      const todayAppointments = await getAppointmentsByDateRange(todayStart, todayEnd)

      // 2. Today's income from 'done' appointments
      const todayIncomeAmount = todayAppointments
        .filter((a) => a.status === APPOINTMENT_STATUS.DONE)
        .reduce((sum, a) => sum + (Number(a.price) || 0), 0)

      // 3. Next appointment
      const nowTimeStr = now.toTimeString().substring(0, 5)
      const pendingAppointments = todayAppointments
        .filter(
          (a) =>
            a.status === APPOINTMENT_STATUS.PENDING ||
            a.status === APPOINTMENT_STATUS.CONFIRMED ||
            a.status === APPOINTMENT_STATUS.IN_PROGRESS
        )
        .filter((a) => a.time >= nowTimeStr)
        .sort((a, b) => a.time.localeCompare(b.time))

      const nextAppointment = pendingAppointments.length > 0 ? pendingAppointments[0] : null

      // 4. Clients attended today
      const clientsAttendedToday = todayAppointments.filter(
        (a) => a.status === APPOINTMENT_STATUS.DONE
      ).length

      // 5. Month's appointments + income
      const monthAppointments = await getAppointmentsByDateRange(monthStart, monthEnd)
      const monthIncomeAmount = monthAppointments
        .filter((a) => a.status === APPOINTMENT_STATUS.DONE)
        .reduce((sum, a) => sum + (Number(a.price) || 0), 0)

      // 6. Top services this month
      const serviceCounts = {}
      monthAppointments
        .filter((a) => a.status === APPOINTMENT_STATUS.DONE)
        .forEach((a) => {
          const name = a.serviceName || 'Sin servicio'
          serviceCounts[name] = (serviceCounts[name] || 0) + 1
        })
      const topServices = Object.entries(serviceCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }))

      // 7. Client stats
      const allClients = await getClients()
      const totalClients = allClients.length
      const newClientsThisMonth = allClients.filter((c) => {
        if (!c.createdAt) return false
        const d = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt)
        return d >= monthStart && d <= monthEnd
      }).length

      return {
        todayAppointmentsCount: todayAppointments.length,
        todayIncome: todayIncomeAmount,
        monthIncome: monthIncomeAmount,
        nextAppointment,
        clientsAttendedToday,
        totalClients,
        newClientsThisMonth,
        topServices,
        todayAppointmentsList: todayAppointments,
      }
    },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  })
}
