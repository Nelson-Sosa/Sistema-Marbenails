import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useAppointmentsByDateRange, useUpdateAppointmentStatus } from '@/hooks/useAppointments'
import { BUSINESS_HOURS, APPOINTMENT_STATUS } from '@/constants/app'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import NewAppointmentModal from './NewAppointmentModal'
import AppointmentStatusMenu from './AppointmentStatusMenu'

const DAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

const SLOT_INTERVAL = 60

const STATUS_CELL_STYLES = {
  [APPOINTMENT_STATUS.PENDING]: 'border-l-amber-500 bg-amber-500/10',
  [APPOINTMENT_STATUS.CONFIRMED]: 'border-l-sky-500 bg-sky-500/10',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'border-l-rose-500 bg-rose-500/20 ring-1 ring-rose-500/30',
  [APPOINTMENT_STATUS.DONE]: 'border-l-emerald-500 bg-emerald-500/10 line-through opacity-70',
  [APPOINTMENT_STATUS.CANCELLED]: 'border-l-red-500 bg-red-500/5 opacity-40',
  [APPOINTMENT_STATUS.NO_SHOW]: 'border-l-amber-600 bg-amber-600/5 opacity-50',
}

const STATUS_DOT_COLORS = {
  [APPOINTMENT_STATUS.PENDING]: 'bg-amber-500',
  [APPOINTMENT_STATUS.CONFIRMED]: 'bg-sky-500',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'bg-rose-500',
  [APPOINTMENT_STATUS.DONE]: 'bg-emerald-500',
  [APPOINTMENT_STATUS.CANCELLED]: 'bg-red-500',
  [APPOINTMENT_STATUS.NO_SHOW]: 'bg-amber-600',
}

const NON_BLOCKING_STATUSES = new Set([
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.NO_SHOW,
])

function toMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function generateTimeSlots(start, end, interval) {
  const slots = []
  const startMin = toMinutes(start)
  const endMin = toMinutes(end)
  for (let m = startMin; m < endMin; m += interval) {
    const h = Math.floor(m / 60)
    const min = m % 60
    const label = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    slots.push({ start: label, startMin: m })
  }
  return slots
}

function getMonday(date) {
  const d = startOfWeek(date, { weekStartsOn: 1 })
  return d
}

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

function isSlotOccupied(appointment, slotStartMin, slotEndMin) {
  if (!appointment.time || appointment.duration == null) return false
  if (NON_BLOCKING_STATUSES.has(appointment.status)) return false
  const aptStart = toMinutes(appointment.time)
  const safeDuration = Math.min(Number(appointment.duration) || 60, 720) // max 12h
  const aptEnd = aptStart + safeDuration
  return aptStart < slotEndMin && aptEnd > slotStartMin
}

export default function WeeklyAgendaView() {
  const today = new Date()
  const [weekStart, setWeekStart] = useState(() => getMonday(today))
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [modalPrefill, setModalPrefill] = useState(null)

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])

  const { data: appointments, isLoading } = useAppointmentsByDateRange(weekStart, weekEnd)
  const { mutate: updateStatus } = useUpdateAppointmentStatus()

  const timeSlots = useMemo(
    () => generateTimeSlots(BUSINESS_HOURS.START, BUSINESS_HOURS.END, SLOT_INTERVAL),
    []
  )

  const appointmentsByDay = useMemo(() => {
    if (!appointments) return {}
    const map = {}
    for (const apt of appointments) {
      const aptDate = apt.date?.toDate ? apt.date.toDate() : new Date(apt.date)
      const key = format(aptDate, 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(apt)
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    }
    return map
  }, [appointments])

  const grid = useMemo(() => {
    const gridMap = {}
    for (const day of weekDays) {
      const dayKey = format(day, 'yyyy-MM-dd')
      const dayAppointments = appointmentsByDay[dayKey] || []
      const dayCol = []

      for (let si = 0; si < timeSlots.length; si++) {
        const slot = timeSlots[si]
        const slotEndMin = slot.startMin + SLOT_INTERVAL
        const found = dayAppointments.find((apt) =>
          isSlotOccupied(apt, slot.startMin, slotEndMin)
        )
        if (found) {
          const aptStartMin = toMinutes(found.time)
          const isFirstSlot = aptStartMin >= slot.startMin && aptStartMin < slotEndMin
          dayCol.push({ type: 'occupied', appointment: found, isFirstSlot })
        } else {
          dayCol.push({ type: 'free', appointment: null, isFirstSlot: false })
        }
      }
      gridMap[dayKey] = dayCol
    }
    return gridMap
  }, [weekDays, timeSlots, appointmentsByDay])

  const handlePrevWeek = () => setWeekStart(subDays(weekStart, 7))
  const handleNextWeek = () => setWeekStart(addDays(weekStart, 7))
  const handleThisWeek = () => setWeekStart(getMonday(today))

  const handleCellClick = (day, slot) => {
    const dayKey = format(day, 'yyyy-MM-dd')
    const cell = grid[dayKey]?.[slot]
    if (!cell) return

    if (cell.type === 'occupied' && cell.appointment) {
      setEditingAppointment(cell.appointment)
      setModalPrefill(null)
      setIsModalOpen(true)
    } else {
      const timeStr = timeSlots[slot].start
      setEditingAppointment(null)
      setModalPrefill({ date: day, time: timeStr })
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAppointment(null)
    setModalPrefill(null)
  }

  const handleNewAppointment = () => {
    setEditingAppointment(null)
    setModalPrefill({ date: today, time: BUSINESS_HOURS.START })
    setIsModalOpen(true)
  }

  const weekLabel = useMemo(() => {
    const start = weekDays[0]
    const end = weekDays[6]
    const fmt = 'd MMM'
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, 'd', { locale: es })} - ${format(end, fmt, { locale: es })}`
    }
    return `${format(start, fmt, { locale: es })} - ${format(end, fmt, { locale: es })}`
  }, [weekDays])

  const yearLabel = format(weekDays[0], 'yyyy', { locale: es })

  return (
    <div className="flex h-full flex-col gap-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-white">Agenda de Turnos</h1>
          <p className="mt-1 text-sm text-slate-400">
            Vista semanal — hace clic en un turno para editarlo o en un espacio libre para agendar.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleNewAppointment}
          className="shrink-0"
        >
          Nuevo Turno
        </Button>
      </div>

      {/* ── Week Navigator ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2">
        <Button variant="ghost" size="sm" onClick={handlePrevWeek}>
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1 flex flex-col items-center px-1">
          <span className="text-sm sm:text-lg font-bold text-white truncate max-w-full">
            {weekLabel}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{yearLabel}</span>
            <button onClick={handleThisWeek} className="text-xs text-rose-400 hover:underline whitespace-nowrap">
              Esta semana
            </button>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={handleNextWeek}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* ── Weekly Grid ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <div
            className="grid min-w-0 lg:min-w-[800px]"
            style={{
              gridTemplateColumns: `80px repeat(7, 1fr)`,
            }}
          >
            {/* ── Header Row ─────────────────────────────────────────────── */}
            <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
              <div className="flex h-10 lg:h-14 items-center justify-center border-r border-slate-800 text-[10px] lg:text-xs font-medium text-slate-500">
                Hora
              </div>
            </div>
            {weekDays.map((day, di) => {
              const isToday = isSameDay(day, today)
              return (
                <div
                  key={di}
                  className={cn(
                    'sticky top-0 z-10 flex flex-col items-center justify-center border-b border-r border-slate-800 bg-slate-900/95 px-1 lg:px-2 py-1 lg:py-2 backdrop-blur-sm last:border-r-0',
                    isToday && 'bg-rose-500/10'
                  )}
                >
                  <span className="text-[10px] lg:text-xs font-semibold uppercase text-slate-400">
                    {DAY_LABELS[day.getDay()]}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 text-sm lg:text-lg font-bold leading-none',
                      isToday ? 'text-rose-400' : 'text-white'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
              )
            })}

            {/* ── Body Rows ──────────────────────────────────────────────── */}
            {timeSlots.map((slot, si) => (
              <div key={si} className="contents">
                {/* Time label */}
                <div className="flex items-start justify-center border-b border-r border-slate-800/50 px-1 py-2">
                  <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                    {slot.start}
                  </span>
                </div>

                {/* Day cells */}
                {weekDays.map((day, di) => {
                  const dayKey = format(day, 'yyyy-MM-dd')
                  const cell = grid[dayKey]?.[si]
                  if (!cell) return <div key={di} className="border-b border-r border-slate-800/50 last:border-r-0" />

                  return (
                    <div
                      key={di}
                      onClick={() => handleCellClick(day, si)}
                      className={cn(
                        'group relative min-h-[44px] lg:min-h-[52px] cursor-pointer border-b border-r border-slate-800/50 p-1.5 transition-colors last:border-r-0 hover:bg-slate-800/50',
                        cell.type === 'occupied'
                          ? STATUS_CELL_STYLES[cell.appointment?.status] || 'border-l-slate-600 bg-slate-800/30'
                          : 'border-l-transparent hover:border-l-emerald-500/30 hover:bg-emerald-500/5'
                      )}
                    >
                      {cell.type === 'occupied' && cell.appointment ? (
                        <div className="flex flex-col gap-0.5">
                          {cell.isFirstSlot && (
                            <>
                              <div className="flex items-center gap-1">
                                <span className="truncate text-xs font-medium text-white">
                                  {cell.appointment.clientName}
                                </span>
                              </div>
                              <div onClick={(e) => e.stopPropagation()}>
                                <AppointmentStatusMenu
                                  currentStatus={cell.appointment.status}
                                  onChange={(newStatus) =>
                                    updateStatus({ id: cell.appointment.id, status: newStatus })
                                  }
                                />
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-[10px] font-medium tracking-wider text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">
                            + LIBRE
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <NewAppointmentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialDate={modalPrefill?.date || (editingAppointment?.date?.toDate ? editingAppointment.date.toDate() : new Date())}
          appointmentToEdit={editingAppointment}
        />
      )}
    </div>
  )
}
