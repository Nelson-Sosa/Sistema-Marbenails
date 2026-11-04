import { useState, useRef, useEffect } from 'react'
import { Calendar, Clock, Scissors, User, LogIn, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCreateAppointment } from '@/hooks/useAppointments'
import { usePendingAction } from '@/hooks/usePendingAction'
import { checkAppointmentConflict } from '@/services/appointments/appointmentsService'
import { validateAppointmentDateTime } from '@/utils/dateValidation'
import { formatCurrency } from '@/utils/formatters'
import { ROUTES } from '@/routes/routes'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function BookingConfirmation({
  service,
  date,
  time,
  onBookingSuccess,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, userProfile, role, isAuthenticated } = useAuth()
  const { mutateAsync: createAppointment, isPending } = useCreateAppointment()
  const { savePendingAction } = usePendingAction()

  // Guest inputs state
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestErrors, setGuestErrors] = useState({ name: '', phone: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const nameInputRef = useRef(null)

  // On desktop / notebook, auto-focus guest name.
  // On mobile (< 640px), do NOT force auto-focus so the virtual keyboard does not abruptly pop up and cover the form.
  useEffect(() => {
    if (!isAuthenticated) {
      const isMobile = window.innerWidth < 640
      if (!isMobile) {
        const timer = setTimeout(() => {
          nameInputRef.current?.focus({ preventScroll: true })
        }, 300)
        return () => clearTimeout(timer)
      }
    }
  }, [isAuthenticated, date, time])

  const formattedDate = date
    ? format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
    : ''

  const handleLoginRedirect = () => {
    if (service) {
      savePendingAction({
        type: 'BOOK_SERVICE',
        payload: { serviceId: service.id },
      })
    }
    navigate(ROUTES.LOGIN, { state: { from: location } })
  }

  const handleConfirm = async (e) => {
    e.preventDefault()

    if (!service || !date || !time) {
      toast.error('Por favor completá la selección de servicio, fecha y horario.')
      return
    }

    // Guest validation
    if (!isAuthenticated) {
      let hasError = false
      const newErrors = { name: '', phone: '' }

      if (!guestName.trim() || guestName.trim().length < 2) {
        newErrors.name = 'Ingresá tu nombre y apellido (mínimo 2 letras)'
        hasError = true
      }
      if (!guestPhone.trim() || guestPhone.trim().replace(/\D/g, '').length < 6) {
        newErrors.phone = 'Ingresá un número de teléfono válido (mínimo 6 dígitos)'
        hasError = true
      }

      setGuestErrors(newErrors)
      if (hasError) return
    }

    // Date & Time validation (cannot book past dates / < 2h for non-admins)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dateValidation = validateAppointmentDateTime(dateStr, time, role)
    if (!dateValidation.valid) {
      toast.error(dateValidation.message)
      return
    }

    setIsSubmitting(true)

    try {
      // Re-verify conflicts immediately before writing to Firestore
      const hasConflict = await checkAppointmentConflict(date, time, service.duration)
      if (hasConflict) {
        toast.error('Ese horario acaba de ser ocupado. Por favor elegí otro horario disponible.')
        setIsSubmitting(false)
        return
      }

      const clientId = isAuthenticated ? (userProfile?.uid || user?.uid) : null
      const clientName = isAuthenticated
        ? (userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Usuario Registrado')
        : guestName.trim()
      const clientPhone = isAuthenticated
        ? (userProfile?.phone || null)
        : guestPhone.trim()

      const newId = await createAppointment({
        clientId,
        clientName,
        clientPhone,
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        duration: service.duration,
        date,
        time,
      })

      toast.success('¡Turno confirmado con éxito!')

      onBookingSuccess({
        id: newId,
        serviceName: service.name,
        dateFormatted: formattedDate,
        time,
        clientName,
        clientPhone,
        price: service.price,
      })
    } catch (err) {
      console.error('Error al confirmar reserva:', err)
      toast.error('No se pudo confirmar la reserva. Por favor intentá nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 border-b border-brand-border/60 pb-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        <h3 className="text-base font-bold text-brand-text">Resumen de tu reserva</h3>
      </div>

      {/* ── Summary Card ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-brand-border/70 bg-brand-bg/60 p-3.5 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-pastel/60 text-brand-primary shrink-0">
            <Scissors className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-brand-text truncate">{service.name}</p>
            <p className="text-[11px] text-brand-text-muted">{service.duration} min · {formatCurrency(service.price)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-pastel/60 text-brand-primary shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-brand-text capitalize truncate">{formattedDate}</p>
            <p className="text-[11px] text-brand-text-muted">Fecha del turno</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-pastel/60 text-brand-primary shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-brand-text">{time} hs</p>
            <p className="text-[11px] text-brand-text-muted">Horario de inicio</p>
          </div>
        </div>
      </div>

      {/* ── Confirmation Form (Guest or Authenticated) ────────────────────── */}
      <form onSubmit={handleConfirm} className="space-y-4">
        {isAuthenticated ? (
          <div
            id="contact-form-section"
            className="flex items-center gap-3 rounded-xl border border-brand-border/60 bg-brand-pastel/15 p-3 text-xs sm:text-sm scroll-mt-6"
          >
            <User className="h-4 w-4 text-brand-primary shrink-0" />
            <p className="text-brand-text">
              Reservando a nombre de: <strong>{userProfile?.displayName || user?.displayName || user?.email}</strong>
            </p>
          </div>
        ) : (
          <div
            id="contact-form-section"
            className="space-y-3.5 scroll-mt-6"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-text">
              <User className="h-4 w-4 text-brand-primary" />
              <span>Tus datos de contacto (reserva como invitada)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                ref={nameInputRef}
                label="Nombre y Apellido"
                placeholder="Ej: María González"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value)
                  if (guestErrors.name) setGuestErrors((prev) => ({ ...prev, name: '' }))
                }}
                error={guestErrors.name}
              />

              <div>
                <Input
                  type="tel"
                  label="Número de WhatsApp"
                  placeholder="Ej: 0981 123 456"
                  value={guestPhone}
                  onChange={(e) => {
                    setGuestPhone(e.target.value)
                    if (guestErrors.phone) setGuestErrors((prev) => ({ ...prev, phone: '' }))
                  }}
                  error={guestErrors.phone}
                />
                <p className="mt-1 text-[11px] text-brand-text-muted">
                  Te escribiremos a este WhatsApp para confirmar tu asistencia.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-brand-border/60">
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={handleLoginRedirect}
              className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-primary transition-colors py-1 order-2 sm:order-1"
            >
              <LogIn className="h-3.5 w-3.5" />
              ¿Ya tenés cuenta? Iniciar sesión para acumular visitas →
            </button>
          ) : (
            <div className="order-2 sm:order-1" />
          )}

          <Button
            type="submit"
            size="lg"
            loading={isSubmitting || isPending}
            className="w-full sm:w-auto font-bold px-8 shadow-md shadow-brand-primary/20 order-1 sm:order-2"
          >
            Confirmar Reserva
          </Button>
        </div>
      </form>
    </div>
  )
}
