import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isBefore,
  startOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useAppointmentsByDateRange } from '@/hooks/useAppointments'
import { getAvailableAppointments } from '@/services/schedule/scheduleService'
import { DEPRECATED_BUSINESS_HOURS } from '@/constants/app'
import { cn } from '@/utils/cn'

const DAY_NAMES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

/**
 * WeekCalendarPicker — Horizontal weekly calendar picker.
 *
 * Displays a 7-day strip (Mon-Sun) with availability badges:
 * - "No disp.": Past days or closed salon days
 * - "Completo": Fully booked days
 * - "X horarios": Available slots count for the given service duration
 */
export default function WeekCalendarPicker({
  selectedDate,
  onSelectDate,
  serviceDuration = 60,
  settings,
}) {
  const today = useMemo(() => startOfDay(new Date()), [])

  // Start with current week's Monday
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(selectedDate ? new Date(selectedDate) : today, { weekStartsOn: 1 })
  )

  const weekEnd = useMemo(
    () => endOfWeek(weekStart, { weekStartsOn: 1 }),
    [weekStart]
  )

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  // Fetch all appointments for the current week in a single React Query call
  const { data: weekAppointments = [], isLoading: loadingAppointments } =
    useAppointmentsByDateRange(weekStart, weekEnd)

  // Group appointments by 'yyyy-MM-dd'
  const appointmentsByDay = useMemo(() => {
    const map = {}
    for (const apt of weekAppointments) {
      const aptDate = apt.date?.toDate ? apt.date.toDate() : new Date(apt.date)
      const key = format(aptDate, 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(apt)
    }
    return map
  }, [weekAppointments])

  // Navigation handlers
  const currentWeekStart = useMemo(
    () => startOfWeek(today, { weekStartsOn: 1 }),
    [today]
  )
  // Only allow going to previous week if we are in a future week (never allow past weeks)
  const canGoPrev = isBefore(currentWeekStart, weekStart)

  const handlePrevWeek = () => {
    if (!canGoPrev) return
    setWeekStart((prev) => subDays(prev, 7))
  }

  const handleNextWeek = () => {
    setWeekStart((prev) => addDays(prev, 7))
  }

  // Calculate availability for each of the 7 days
  const daysAvailability = useMemo(() => {
    if (!settings) return []

    const minAllowedTime = new Date(Date.now() + 2 * 60 * 60 * 1000)

    return weekDays.map((day) => {
      const dayStart = startOfDay(day)
      const dayKey = format(day, 'yyyy-MM-dd')
      const isPast = isBefore(dayStart, today)
      const isCurrentDay = isSameDay(day, today)
      const dayOfWeek = day.getDay()

      // Salon open check (from settings or business hours)
      const isOpenDay = DEPRECATED_BUSINESS_HOURS.DAYS.includes(dayOfWeek)

      if (isPast || !isOpenDay) {
        return {
          day,
          dayKey,
          isSelectable: false,
          badgeLabel: 'No disp.',
          badgeType: 'disabled',
          slotsCount: 0,
        }
      }

      // Compute available slots using existing scheduleService algorithm
      const dayAppts = appointmentsByDay[dayKey] || []
      const slots = getAvailableAppointments(serviceDuration, dayAppts, settings)

      // Filter slots that are at least 2 hours in the future if it is today
      const validSlots = slots.filter((slot) => {
        if (!isCurrentDay) return true
        const [hours, minutes] = slot.start.split(':').map(Number)
        const slotDate = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          hours,
          minutes,
          0
        )
        return slotDate >= minAllowedTime
      })

      if (validSlots.length === 0) {
        return {
          day,
          dayKey,
          isSelectable: false,
          badgeLabel: 'Completo',
          badgeType: 'full',
          slotsCount: 0,
        }
      }

      return {
        day,
        dayKey,
        isSelectable: true,
        badgeLabel: `${validSlots.length} horarios`,
        badgeType: 'available',
        slotsCount: validSlots.length,
      }
    })
  }, [weekDays, settings, today, serviceDuration, appointmentsByDay])

  // Filter out days that already passed so they NEVER appear to the client
  const visibleDaysAvailability = useMemo(() => {
    return daysAvailability.filter(
      (item) => !isBefore(startOfDay(item.day), today)
    )
  }, [daysAvailability, today])

  // Automatically advance to the first day with available slots if current selection is full or unavailable
  useEffect(() => {
    if (loadingAppointments || !visibleDaysAvailability.length) return

    const currentSelectedInfo = selectedDate
      ? visibleDaysAvailability.find((item) => isSameDay(item.day, selectedDate))
      : null

    // If no date is selected or the selected date is full / closed, auto-select the next day that has available slots
    if (!currentSelectedInfo || !currentSelectedInfo.isSelectable) {
      const firstAvailableDay = visibleDaysAvailability.find((item) => item.isSelectable)
      if (firstAvailableDay) {
        onSelectDate(firstAvailableDay.day)
      }
    }
  }, [selectedDate, visibleDaysAvailability, loadingAppointments, onSelectDate])

  // Month & Year header (e.g. "Noviembre De 2026")
  const monthYearLabel = useMemo(() => {
    const raw = format(weekStart, 'MMMM yyyy', { locale: es })
    // Capitalize: "Noviembre De 2026"
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [weekStart])

  // Week range label (e.g. "4 - 8" or "9 - 15")
  const weekRangeLabel = useMemo(() => {
    if (visibleDaysAvailability.length === 0) return ''
    const firstDay = visibleDaysAvailability[0].day
    const lastDay = visibleDaysAvailability[visibleDaysAvailability.length - 1].day
    return `${format(firstDay, 'd')} - ${format(lastDay, 'd')}`
  }, [visibleDaysAvailability])

  return (
    <div className="space-y-4">
      {/* ── Header: Month, Year and Week Navigation ────────────────────────── */}
      <div className="flex flex-col items-center justify-center gap-2">
        <h3 className="text-base sm:text-lg font-bold text-brand-text capitalize tracking-wide">
          {monthYearLabel}
        </h3>

        <div className="flex items-center justify-between w-full max-w-md px-2 text-sm text-brand-text-muted">
          <button
            type="button"
            onClick={handlePrevWeek}
            disabled={!canGoPrev}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors font-medium text-xs sm:text-sm',
              canGoPrev
                ? 'text-brand-text hover:text-brand-primary hover:bg-brand-pastel/30'
                : 'text-brand-text-muted/40 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Semana anterior</span>
          </button>

          <span className="font-semibold text-xs sm:text-sm text-brand-text">
            {weekRangeLabel}
          </span>

          <button
            type="button"
            onClick={handleNextWeek}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-brand-text hover:text-brand-primary hover:bg-brand-pastel/30 transition-colors font-medium text-xs sm:text-sm"
          >
            <span>Semana siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Notice: 2 hours advance requirement ────────────────────────────── */}
      <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 text-xs text-rose-400">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
        <span>
          Los turnos para hoy deben agendarse con al menos <strong>2 horas de anticipación</strong>.
        </span>
      </div>

      {/* ── Horizontal Days Strip (Past days do not appear) ───────────────── */}
      <div
        className="grid gap-1.5 sm:gap-2.5"
        style={{
          gridTemplateColumns: `repeat(${Math.max(visibleDaysAvailability.length, 4)}, minmax(0, 1fr))`
        }}
      >
        {visibleDaysAvailability.map((item) => {
          const { day, dayKey, isSelectable, badgeLabel, badgeType } = item
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const dayNumber = format(day, 'd')
          const dayName = DAY_NAMES[day.getDay()]

          return (
            <button
              key={dayKey}
              type="button"
              disabled={!isSelectable || loadingAppointments}
              onClick={() => {
                if (isSelectable) {
                  onSelectDate(day)
                }
              }}
              className={cn(
                'flex flex-col items-center justify-between rounded-2xl py-2.5 sm:py-3 px-1 sm:px-2 transition-all duration-200 select-none min-h-[96px] sm:min-h-[108px]',
                'border text-center relative overflow-hidden',
                // Selected state (matches Patynails pink/brand-primary active styling)
                isSelected
                  ? 'border-brand-primary bg-brand-primary/10 shadow-md ring-2 ring-brand-primary/40 -translate-y-0.5'
                  : isSelectable
                    ? 'border-brand-border bg-brand-card hover:border-brand-primary/60 hover:bg-brand-pastel/20 hover:shadow-sm cursor-pointer'
                    : 'border-brand-border/40 bg-brand-card/30 opacity-40 cursor-not-allowed'
              )}
            >
              {/* Day abbreviation (LUN, MAR, etc.) */}
              <span
                className={cn(
                  'text-[10px] sm:text-xs font-bold tracking-wider',
                  isSelected
                    ? 'text-brand-primary'
                    : isSelectable
                      ? 'text-brand-text-muted'
                      : 'text-brand-text-muted/60'
                )}
              >
                {dayName}
              </span>

              {/* Day number (2, 3, 4...) */}
              <span
                className={cn(
                  'text-base sm:text-xl font-extrabold my-0.5 leading-none',
                  isSelected
                    ? 'text-brand-primary font-black scale-110'
                    : isSelectable
                      ? 'text-brand-text'
                      : 'text-brand-text-muted/60'
                )}
              >
                {dayNumber}
              </span>

              {/* Availability Badge */}
              <div className="w-full flex items-center justify-center mt-1">
                {badgeType === 'available' && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold leading-tight truncate max-w-full',
                      isSelected
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-emerald-500/15 text-emerald-400'
                    )}
                  >
                    {badgeLabel}
                  </span>
                )}
                {badgeType === 'full' && (
                  <span className="rounded-full bg-slate-500/15 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-slate-400 leading-tight">
                    Completo
                  </span>
                )}
                {badgeType === 'disabled' && (
                  <span className="rounded-full bg-slate-500/10 px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-brand-text-muted/60 leading-tight">
                    No disp.
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

