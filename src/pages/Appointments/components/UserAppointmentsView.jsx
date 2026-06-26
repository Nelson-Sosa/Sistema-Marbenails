import { useState, useEffect } from 'react'
import { CalendarDays, Plus, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppointmentsByClient, useCancelAppointment } from '@/hooks/useAppointments'
import { useServices } from '@/hooks/useServices'
import { useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/routes/routes'
import { APPOINTMENT_STATUS } from '@/constants/app'
import { formatCurrency } from '@/utils/formatters'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import UserBookingModal from './UserBookingModal'

export default function UserAppointmentsView() {
  const { userProfile, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: services } = useServices()
  const servicePriceMap = {}
  if (services) {
    services.forEach((s) => { servicePriceMap[s.id] = s.price })
  }
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState(null)

  // Use the logged-in user's UID to fetch their appointments
  const clientId = userProfile?.uid || user?.uid
  const { data: appointments, isLoading } = useAppointmentsByClient(clientId)
  const { mutate: cancelAppointment, isPending: isCancelling } = useCancelAppointment()

  const handleCancel = (appointmentId) => {
    cancelAppointment(appointmentId, {
      onSuccess: () => toast.success('Turno cancelado correctamente'),
      onError: () => toast.error('No se pudo cancelar el turno'),
    })
  }

  // Auto-open modal if navigated from Services catalog with a selected service
  useEffect(() => {
    if (location.state?.selectedServiceId) {
      setSelectedServiceId(location.state.selectedServiceId)
      setIsModalOpen(true)
      // Clear state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleOpenModal = () => {
    setSelectedServiceId(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedServiceId(null), 300) // Clear after animation
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case APPOINTMENT_STATUS.PENDING:
        return <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">Pendiente</span>
      case APPOINTMENT_STATUS.CONFIRMED:
        return <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">Confirmado</span>
      case APPOINTMENT_STATUS.DONE:
        return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">Realizado</span>
      case APPOINTMENT_STATUS.CANCELLED:
        return <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-500">Cancelado</span>
      default:
        return <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-500">{status}</span>
    }
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {/* ── Phone missing alert ───────────────────────────────────────────── */}
      {!userProfile?.phone && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start sm:items-center gap-3">
            <Phone className="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5 sm:mt-0" />
            <p className="text-sm text-amber-300">
              <strong>Completá tu número de teléfono</strong> para recibir recordatorios de tus turnos por WhatsApp.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(ROUTES.PROFILE)}
            className="self-start sm:self-auto flex-shrink-0"
          >
            Completar ahora
          </Button>
        </div>
      )}
      {/* ── Header & Actions ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Turnos</h1>
          <p className="mt-1 text-sm text-slate-400">
            Revisá tu historial y próximos turnos agendados.
          </p>
        </div>
        <Button 
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleOpenModal}
        >
          Reservar Turno
        </Button>
      </div>

      {/* ── Appointments List ─────────────────────────────────────────────── */}
      <div className="flex-1 space-y-4">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : appointments?.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {appointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    {appointment.serviceName}
                  </span>
                  {getStatusBadge(appointment.status)}
                </div>
                
                <div className="mt-2 flex flex-col gap-1 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    {appointment.date?.seconds ? format(new Date(appointment.date.seconds * 1000), "EEEE d 'de' MMMM", { locale: es }) : 'Fecha pendiente'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-300">{appointment.time} hs</span>
                    <span>•</span>
                    <span>{formatCurrency(servicePriceMap[appointment.serviceId] ?? appointment.price)}</span>
                  </span>
                </div>

                {/* Cancel button — only for pending or confirmed appointments */}
                {(appointment.status === APPOINTMENT_STATUS.PENDING ||
                  appointment.status === APPOINTMENT_STATUS.CONFIRMED) && (
                  <div className="mt-4 flex justify-end border-t border-slate-800 pt-3">
                    <button
                      onClick={() => handleCancel(appointment.id)}
                      disabled={isCancelling}
                      className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50 transition-colors"
                    >
                      {isCancelling ? 'Cancelando...' : 'Cancelar turno'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/50">
            <CalendarDays className="mb-3 h-10 w-10 text-slate-600" />
            <p className="text-lg font-medium text-slate-300">Aún no tenés turnos</p>
            <p className="mt-1 text-sm text-slate-500">Explorá nuestros servicios y reservá tu primer turno.</p>
            <Button 
              className="mt-4"
              variant="secondary"
              onClick={handleOpenModal}
            >
              Reservar Turno
            </Button>
          </div>
        )}
      </div>

      <UserBookingModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        defaultServiceId={selectedServiceId}
      />
    </div>
  )
}
