import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { useAppointmentsByDate } from '@/hooks/useAppointments'
import { getAvailableAppointments } from '@/services/schedule/scheduleService'
import { cn } from '@/utils/cn'
import { isSameDay } from 'date-fns'

/**
 * TimeSlotGrid — Displays available time slots for the selected date and service duration.
 */
export default function TimeSlotGrid({
  selectedDate,
  selectedTime,
  onSelectTime,
  serviceDuration = 60,
  settings,
}) {
  // Query appointments for the selected day
  const { data: dayAppointments = [], isLoading: loadingAppointments } =
    useAppointmentsByDate(selectedDate)

  // Compute available slots
  const availableSlots = useMemo(() => {
    if (!settings || !selectedDate || loadingAppointments) return []

    const slots = getAvailableAppointments(serviceDuration, dayAppointments, settings)

    // If selected date is today, exclude slots with less than 2 hours lead time
    const isToday = isSameDay(selectedDate, new Date())
    if (!isToday) return slots

    const minAllowedTime = new Date(Date.now() + 2 * 60 * 60 * 1000)

    return slots.filter((slot) => {
      const [hours, minutes] = slot.start.split(':').map(Number)
      const appointmentTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hours,
        minutes,
        0
      )
      return appointmentTime >= minAllowedTime
    })
  }, [settings, selectedDate, serviceDuration, dayAppointments, loadingAppointments])

  if (!selectedDate) return null

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-sm font-bold text-brand-text">
        <Clock className="h-4 w-4 text-brand-primary" />
        <span>Horarios disponibles</span>
      </div>

      {loadingAppointments || !settings ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-12 rounded-xl bg-brand-pastel/30 animate-pulse border border-brand-border/40"
            />
          ))}
        </div>
      ) : availableSlots.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-1">
          {availableSlots.map((slot) => {
            const isSelected = selectedTime === slot.start

            return (
              <button
                key={slot.start}
                type="button"
                onClick={() => onSelectTime(slot.start)}
                className={cn(
                  'h-12 rounded-xl border px-3 py-2 text-center text-sm font-semibold transition-all duration-150',
                  isSelected
                    ? 'border-brand-primary bg-brand-primary text-white shadow-md scale-[1.02]'
                    : 'border-brand-border bg-brand-card text-brand-text hover:border-brand-primary/60 hover:bg-brand-pastel/20'
                )}
              >
                {slot.start}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-brand-border bg-brand-card/40 p-6 text-center">
          <p className="text-sm font-medium text-brand-text">
            No hay horarios disponibles para este servicio en la fecha seleccionada.
          </p>
          <p className="mt-1 text-xs text-brand-text-muted">
            Por favor, seleccioná otro día de la semana en el calendario.
          </p>
        </div>
      )}
    </div>
  )
}

