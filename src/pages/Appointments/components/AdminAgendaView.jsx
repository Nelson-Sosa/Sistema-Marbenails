import { useState } from 'react'
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Calendar, Columns2 } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAppointmentsByDate, useUpdateAppointmentStatus } from '@/hooks/useAppointments'
import { useServices } from '@/hooks/useServices'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import AppointmentCard from './AppointmentCard'
import NewAppointmentModal from './NewAppointmentModal'
import WeeklyAgendaView from './WeeklyAgendaView'

export default function AdminAgendaView() {
  const [viewMode, setViewMode] = useState('weekly')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)

  const { data: appointments, isLoading } = useAppointmentsByDate(selectedDate)
  const { data: services } = useServices()
  const { mutate: updateStatus } = useUpdateAppointmentStatus()

  const servicePriceMap = {}
  if (services) {
    services.forEach((s) => { servicePriceMap[s.id] = s.price })
  }

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1))
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1))
  const handleToday = () => setSelectedDate(new Date())

  if (viewMode === 'weekly') {
    return <WeeklyAgendaView />
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {/* ── Header & Actions ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-brand-text">Agenda de Turnos</h1>
            <p className="mt-1 text-sm text-brand-text-muted">
              Gestioná los turnos del día y actualizá sus estados.
            </p>
          </div>
          <div className="flex shrink-0 rounded-lg border border-slate-700 bg-slate-800/50 p-0.5">
            <button
              onClick={() => setViewMode('weekly')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'weekly'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <Columns2 className="h-3.5 w-3.5" />
              Semanal
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'daily'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              Diario
            </button>
          </div>
        </div>
        <Button 
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingAppointment(null)
            setIsModalOpen(true)
          }}
        >
          Nuevo Turno
        </Button>
      </div>

      {/* ── Date Navigator ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2">
        <Button variant="ghost" size="sm" onClick={handlePrevDay} leftIcon={<ChevronLeft className="h-5 w-5" />} />
        
        <div className="min-w-0 flex-1 flex flex-col items-center px-1">
          <span className="text-sm sm:text-lg font-bold capitalize text-white truncate max-w-full">
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </span>
          <button onClick={handleToday} className="text-xs text-rose-400 hover:underline whitespace-nowrap">
            Ir a Hoy
          </button>
        </div>

        <Button variant="ghost" size="sm" onClick={handleNextDay} leftIcon={<ChevronRight className="h-5 w-5" />} />
      </div>

      {/* ── Appointments List ─────────────────────────────────────────────── */}
      <div className="flex-1 space-y-4">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : appointments?.length > 0 ? (
          appointments.map((appointment) => (
            <AppointmentCard 
              key={appointment.id} 
              appointment={appointment} 
              currentPrice={servicePriceMap[appointment.serviceId]}
              onStatusChange={(newStatus) => updateStatus({ id: appointment.id, status: newStatus })}
              onEdit={(apt) => {
                setEditingAppointment(apt)
                setIsModalOpen(true)
              }}
            />
          ))
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/50">
            <CalendarDays className="mb-3 h-10 w-10 text-slate-600" />
            <p className="text-lg font-medium text-slate-300">Agenda libre</p>
            <p className="text-sm text-slate-500">No hay turnos programados para este día.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <NewAppointmentModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false)
            setEditingAppointment(null)
          }} 
          initialDate={selectedDate}
          appointmentToEdit={editingAppointment}
        />
      )}
    </div>
  )
}
