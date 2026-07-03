import { useState, useMemo, useEffect, useCallback } from 'react'
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
import { BUSINESS_HOURS, APPOINTMENT_STATUS, STATUS_CONFIG } from '@/constants/app'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import NewAppointmentModal from './NewAppointmentModal'
import AppointmentDrawer from './AppointmentDrawer'

// ── Constants ──────────────────────────────────────────────────────────────

const DAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const SLOT_INTERVAL = 15

const BUSINESS_START_MIN = (() => {
  const [h, m] = BUSINESS_HOURS.START.split(':').map(Number)
  return h * 60 + m
})()

const BUSINESS_END_MIN = (() => {
  const [h, m] = BUSINESS_HOURS.END.split(':').map(Number)
  return h * 60 + m
})()

const TOTAL_SLOTS = Math.floor((BUSINESS_END_MIN - BUSINESS_START_MIN) / SLOT_INTERVAL)

const ROW_HEIGHT_BREAKPOINTS = {
  base: 22,
  sm: 26,
  lg: 32,
}

const STATUS_CELL_STYLES = {
  [APPOINTMENT_STATUS.PENDING]: 'border-l-amber-500',
  [APPOINTMENT_STATUS.CONFIRMED]: 'border-l-sky-500',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'border-l-rose-500',
  [APPOINTMENT_STATUS.DONE]: 'border-l-emerald-500',
  [APPOINTMENT_STATUS.CANCELLED]: 'border-l-red-500',
  [APPOINTMENT_STATUS.NO_SHOW]: 'border-l-amber-600',
}

const STATUS_BG_TINTS = {
  [APPOINTMENT_STATUS.PENDING]: 'bg-amber-500/10',
  [APPOINTMENT_STATUS.CONFIRMED]: 'bg-sky-500/10',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'bg-rose-500/20',
  [APPOINTMENT_STATUS.DONE]: 'bg-emerald-500/10',
  [APPOINTMENT_STATUS.CANCELLED]: '',
  [APPOINTMENT_STATUS.NO_SHOW]: '',
}

const STATUS_CHIP_STYLES = {
  [APPOINTMENT_STATUS.PENDING]: 'bg-amber-500/15 text-amber-400',
  [APPOINTMENT_STATUS.CONFIRMED]: 'bg-sky-500/15 text-sky-400',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'bg-rose-500/15 text-rose-400',
  [APPOINTMENT_STATUS.DONE]: 'bg-emerald-500/15 text-emerald-400',
  [APPOINTMENT_STATUS.CANCELLED]: 'bg-red-500/15 text-red-400',
  [APPOINTMENT_STATUS.NO_SHOW]: 'bg-amber-600/15 text-amber-500',
}

const NON_BLOCKING_STATUSES = new Set([
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.NO_SHOW,
])

// ── Helpers ────────────────────────────────────────────────────────────────

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
  return startOfWeek(date, { weekStartsOn: 1 })
}

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

function isSlotOccupied(appointment, slotStartMin, slotEndMin) {
  if (!appointment.time || appointment.duration == null) return false
  if (NON_BLOCKING_STATUSES.has(appointment.status)) return false
  const aptStart = toMinutes(appointment.time)
  const safeDuration = Math.min(Number(appointment.duration) || 60, 720)
  const aptEnd = aptStart + safeDuration
  return aptStart < slotEndMin && aptEnd > slotStartMin
}

function getRowHeight() {
  if (typeof window === 'undefined') return ROW_HEIGHT_BREAKPOINTS.base
  const w = window.innerWidth
  if (w >= 1024) return ROW_HEIGHT_BREAKPOINTS.lg
  if (w >= 640) return ROW_HEIGHT_BREAKPOINTS.sm
  return ROW_HEIGHT_BREAKPOINTS.base
}

// ── Component ──────────────────────────────────────────────────────────────

export default function WeeklyAgendaView() {
  const today = new Date()
  const [weekStart, setWeekStart] = useState(() => getMonday(today))
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [modalPrefill, setModalPrefill] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [now, setNow] = useState(new Date())
  const [rowHeight, setRowHeight] = useState(getRowHeight())

  // Update current time and responsive row height
  useEffect(() => {
    const updateTime = () => setNow(new Date())
    const updateHeight = () => setRowHeight(getRowHeight())

    const intervalId = setInterval(updateTime, 60000)
    window.addEventListener('resize', updateHeight)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])

  const { data: appointments, isLoading } = useAppointmentsByDateRange(weekStart, weekEnd)
  const { mutate: updateStatus } = useUpdateAppointmentStatus()

  // 15-min time slots
  const timeSlots = useMemo(
    () => generateTimeSlots(BUSINESS_HOURS.START, BUSINESS_HOURS.END, SLOT_INTERVAL),
    []
  )

  // Nota: timeSlots se usa directamente en la columna horaria.
  // Si cambia SLOT_INTERVAL (ej: 15, 20, 30), las etiquetas se actualizan automáticamente.

  const totalHeight = TOTAL_SLOTS * rowHeight

  // Group appointments by day
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

  // Current time indicator position
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()
  const isWithinBusinessHours =
    currentTimeMinutes >= BUSINESS_START_MIN && currentTimeMinutes < BUSINESS_END_MIN
  const currentTimeTop =
    ((currentTimeMinutes - BUSINESS_START_MIN) / SLOT_INTERVAL) * rowHeight

  // ── Handlers ────────────────────────────────────────────────────────────

  const handlePrevWeek = () => setWeekStart(subDays(weekStart, 7))
  const handleNextWeek = () => setWeekStart(addDays(weekStart, 7))
  const handleThisWeek = () => setWeekStart(getMonday(today))

  const handleCellClick = useCallback(
    (day, slot) => {
      const dayKey = format(day, 'yyyy-MM-dd')
      const dayAppts = appointmentsByDay[dayKey] || []
      const slotEnd = slot.startMin + SLOT_INTERVAL
      const found = dayAppts.find(apt => isSlotOccupied(apt, slot.startMin, slotEnd))

      if (found) {
        setSelectedAppointment(found)
      } else {
        setEditingAppointment(null)
        setModalPrefill({ date: day, time: slot.start })
        setIsModalOpen(true)
      }
    },
    [appointmentsByDay]
  )

  const handleAppointmentClick = useCallback((appointment) => {
    setSelectedAppointment(appointment)
  }, [])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAppointment(null)
    setModalPrefill(null)
  }

  const handleCloseDrawer = () => {
    setSelectedAppointment(null)
  }

  const handleEditFromDrawer = () => {
    if (!selectedAppointment) return
    setEditingAppointment(selectedAppointment)
    setSelectedAppointment(null)
    setIsModalOpen(true)
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
    <div className="flex h-full flex-col gap-6 overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-brand-text">Agenda de Turnos</h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Hacé clic en un turno para ver los detalles o en un espacio libre para agendar.
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
      <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-pastel bg-brand-primary-hover p-2">
        <Button variant="ghost" size="sm" onClick={handlePrevWeek} className="text-white hover:text-white/80">
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1 flex flex-col items-center px-1">
          <span className="text-sm sm:text-lg font-bold text-white truncate max-w-full">
            {weekLabel}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70">{yearLabel}</span>
            <button onClick={handleThisWeek} className="text-xs text-white hover:underline whitespace-nowrap">
              Esta semana
            </button>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={handleNextWeek} className="text-white hover:text-white/80">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* ── Calendar Grid ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-brand-border bg-brand-card">
          <div className="flex flex-col min-w-[780px] select-none">
            {/* ── Sticky Header Row ─────────────────────────────────────── */}
            <div className="sticky top-0 z-30 flex">
              <div className="sticky left-0 z-30 w-20 flex-shrink-0 flex items-center justify-center border-r border-b border-brand-border bg-brand-card backdrop-blur-sm h-10 lg:h-14">
                <span className="text-[10px] lg:text-xs font-medium text-brand-text">
                  Hora
                </span>
              </div>
              {weekDays.map((day, di) => {
                const isToday = isSameDay(day, today)
                return (
                  <div
                    key={di}
                    className={cn(
                      'flex-1 flex flex-col items-center justify-center border-r border-b border-brand-border backdrop-blur-sm px-1 lg:px-2 py-1 lg:py-2 last:border-r-0',
                      isToday ? 'bg-brand-primary' : 'bg-brand-pastel'
                    )}
                  >
                    <span className={cn(
                      'text-[10px] lg:text-xs font-semibold uppercase',
                      isToday ? 'text-white' : 'text-brand-text'
                    )}>
                      {DAY_LABELS[day.getDay()]}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 text-sm lg:text-lg font-bold leading-none',
                        isToday ? 'text-white' : 'text-brand-text'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* ── Scrollable Body ───────────────────────────────────────── */}
            <div className="flex relative">
              {/* Time gutter (sticky left) — cada fila de 15 minutos muestra su hora exacta */}
              <div className="sticky left-0 z-20 w-20 flex-shrink-0 bg-brand-card">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.startMin}
                    className={cn(
                      'border-r border-brand-border flex items-start justify-center pt-1',
                      'border-b border-brand-border'
                    )}
                    style={{ height: rowHeight }}
                  >
                    <span
                      className={cn(
                        'leading-none',
                        slot.startMin % 60 === 0
                          ? 'text-[10px] lg:text-xs font-medium text-brand-text'
                          : 'text-[9px] lg:text-[10px] text-brand-text-muted'
                      )}
                    >
                      {slot.start}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map((day, di) => {
                const dayKey = format(day, 'yyyy-MM-dd')
                const dayAppts = appointmentsByDay[dayKey] || []
                const isToday = isSameDay(day, today)

                return (
                  <div
                    key={di}
                    className="flex-1 relative border-r border-brand-border last:border-r-0 min-w-[100px] lg:min-w-[130px]"
                    style={{ height: totalHeight }}
                  >
                    {/* Background grid — each 15-min block is a click target */}
                    {timeSlots.map((slot, si) => (
                      <div
                        key={slot.startMin}
                        onClick={() => handleCellClick(day, slot)}
                        className={cn(
                          'cursor-pointer border-b border-brand-border transition-colors',
                          'hover:bg-emerald-500/5',
                          si % 2 === 1 && 'bg-brand-alt-row'
                        )}
                        style={{ height: rowHeight }}
                      />
                    ))}

                    {/* Appointment blocks — absolutely positioned, compact UI */}
                    {dayAppts
                      .filter(apt => {
                        if (NON_BLOCKING_STATUSES.has(apt.status)) return false
                        const startMin = toMinutes(apt.time)
                        return startMin >= BUSINESS_START_MIN
                      })
                      .map((apt) => {
                        const aptStartMin = toMinutes(apt.time)
                        const safeDuration = Math.min(Number(apt.duration) || 60, 720)
                        const blocks = Math.ceil(safeDuration / SLOT_INTERVAL)
                        const top = ((aptStartMin - BUSINESS_START_MIN) / SLOT_INTERVAL) * rowHeight
                        const height = Math.min(blocks * rowHeight, totalHeight - top)
                        const visible = height >= rowHeight * 0.5
                        const showContent = blocks >= 2

                        const endMin = aptStartMin + safeDuration
                        const endTimeStr = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

                        if (!visible || height <= 0) return null

                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAppointmentClick(apt)
                            }}
                            className={cn(
                              'absolute left-0.5 right-0.5 border-l-[3px] overflow-hidden cursor-pointer bg-slate-900 transition-shadow hover:shadow-lg hover:shadow-black/20 z-10',
                              STATUS_CELL_STYLES[apt.status] || 'border-l-slate-600'
                            )}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              minHeight: `${Math.max(rowHeight, 18)}px`,
                            }}
                          >
                            <div className={cn('absolute inset-0', STATUS_BG_TINTS[apt.status])} />

                            {showContent && (
                              <div className="relative z-10 flex flex-col h-full px-1 lg:px-1.5 py-0.5 lg:py-1 min-h-0">
                                <span className="truncate text-[10px] lg:text-xs font-semibold text-white leading-tight">
                                  {apt.clientName}
                                </span>

                                <div className="flex-1 min-h-0" />

                                <div className="flex items-baseline gap-1">
                                  <span className="text-[9px] lg:text-[10px] font-medium text-slate-400 leading-none">
                                    {apt.time}
                                  </span>
                                  <span className="text-[8px] lg:text-[9px] text-slate-600 leading-none">→</span>
                                  <span className="text-[9px] lg:text-[10px] text-slate-400 leading-none">
                                    {endTimeStr}
                                  </span>
                                </div>

                                <span className={cn(
                                  'self-start mt-px rounded-sm px-1 py-px text-[8px] lg:text-[9px] font-medium leading-tight',
                                  STATUS_CHIP_STYLES[apt.status]
                                )}>
                                  {STATUS_CONFIG[apt.status]?.label || ''}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}

                    {/* Current time indicator */}
                    {isToday && isWithinBusinessHours && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{ top: `${currentTimeTop}px` }}
                      >
                        <div className="flex items-center -ml-0.5">
                          <div className="h-2 w-2 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
                          <div className="flex-1 h-px bg-rose-500" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <NewAppointmentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialDate={
            modalPrefill?.date ||
            (editingAppointment?.date?.toDate
              ? editingAppointment.date.toDate()
              : new Date())
          }
          initialTime={modalPrefill?.time || undefined}
          appointmentToEdit={editingAppointment}
        />
      )}

      {/* ── Drawer ───────────────────────────────────────────────────────── */}
      <AppointmentDrawer
        appointment={selectedAppointment}
        isOpen={!!selectedAppointment}
        onClose={handleCloseDrawer}
        onEdit={handleEditFromDrawer}
        onStatusChange={(newStatus) => {
          if (selectedAppointment) {
            updateStatus({ id: selectedAppointment.id, status: newStatus })
          }
        }}
      />
    </div>
  )
}
