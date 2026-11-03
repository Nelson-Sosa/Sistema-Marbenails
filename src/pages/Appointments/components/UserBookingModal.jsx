import React, { useState, useEffect, useMemo } from 'react'
import { X, ChevronLeft, Clock, User, LogIn } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useServices } from '@/hooks/useServices'
import { useActiveCategories } from '@/hooks/useServiceCategories'
import { useCreateAppointment, useAppointmentsByDate } from '@/hooks/useAppointments'
import { useScheduleSettings } from '@/hooks/useScheduleSettings'
import { usePendingAction } from '@/hooks/usePendingAction'
import { checkAppointmentConflict } from '@/services/appointments/appointmentsService'
import { getAvailableAppointments } from '@/services/schedule/scheduleService'
import { DEPRECATED_BUSINESS_HOURS, USER_ROLES } from '@/constants/app'
import { validateAppointmentDateTime } from '@/utils/dateValidation'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/routes/routes'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

/**
 * Booking flow steps:
 *
 * Authenticated user:   CATEGORY → SERVICE → DETAILS  (submit directly)
 * Unauthenticated user: CATEGORY → SERVICE → DETAILS → GUEST_CONFIRM
 *
 * GUEST_CONFIRM: name + phone form (open by default) with a secondary link to login.
 */
const STEPS = {
  CATEGORY: 'CATEGORY',
  SERVICE: 'SERVICE',
  DETAILS: 'DETAILS',
  GUEST_CONFIRM: 'GUEST_CONFIRM',
}

function UserBookingModal({ isOpen, onClose, defaultServiceId = null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { userProfile, user, role, isAuthenticated } = useAuth()
  const { data: services, isLoading: loadingServices } = useServices()
  const { data: categories } = useActiveCategories()
  const { mutateAsync: createAppointment, isPending } = useCreateAppointment()
  const { data: settings } = useScheduleSettings()
  const { savePendingAction } = usePendingAction()

  const [step, setStep] = useState(STEPS.CATEGORY)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedServiceId, setSelectedServiceId] = useState(defaultServiceId)

  // Guest contact data (used at GUEST_CONFIRM step)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestErrors, setGuestErrors] = useState({ name: '', phone: '' })
  const [isSubmittingGuest, setIsSubmittingGuest] = useState(false)

  // Saved date/time from DETAILS step (needed at GUEST_CONFIRM)
  const [confirmedDate, setConfirmedDate] = useState(null)
  const [confirmedTime, setConfirmedTime] = useState(null)

  const availableCategories = categories?.filter((c) =>
    services?.some((s) => s.categoryId === c.id && s.active !== false)
  ) || []

  const servicesByCategory = useMemo(() => {
    if (!services || !selectedCategoryId) return []
    return services.filter((s) => s.categoryId === selectedCategoryId && s.active !== false)
  }, [services, selectedCategoryId])

  const selectedService = useMemo(() => {
    if (!services) return null
    return services.find((s) => s.id === selectedServiceId) || null
  }, [services, selectedServiceId])

  // ─── Date/time form schema ───────────────────────────────────────────────
  const schema = React.useMemo(() => {
    const currentSettings = settings || { openingTime: '07:00', closingTime: '19:00' }
    return z.object({
      date: z.string().min(1, 'Seleccioná una fecha'),
      time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Seleccioná un horario'),
    }).superRefine((data, ctx) => {
      if (!data.date || !data.time) return
      const [year, month, day] = data.date.split('-').map(Number)
      const [hours, minutes] = data.time.split(':').map(Number)
      const appointmentTime = new Date(year, month - 1, day, hours, minutes, 0)

      if (!DEPRECATED_BUSINESS_HOURS.DAYS.includes(appointmentTime.getDay())) {
        ctx.addIssue({ path: ['date'], code: z.ZodIssueCode.custom, message: 'El salón no atiende este día' })
      }
      if (data.time < currentSettings.openingTime || data.time > currentSettings.closingTime) {
        ctx.addIssue({ path: ['time'], code: z.ZodIssueCode.custom, message: `El horario de atención es de ${currentSettings.openingTime} a ${currentSettings.closingTime}` })
      }
      const minAllowedTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
      if (appointmentTime < minAllowedTime) {
        ctx.addIssue({ path: ['time'], code: z.ZodIssueCode.custom, message: 'Debe ser con al menos 2 hs de anticipación' })
      }
    })
  }, [settings])

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { date: '', time: '' }
  })

  const dateValue = watch('date')
  const timeValue = watch('time')
  const selectedDate = useMemo(() => (dateValue ? new Date(`${dateValue}T12:00:00`) : null), [dateValue])
  const { data: dayAppointments = [], isLoading: loadingAppointments } = useAppointmentsByDate(selectedDate)

  const availableSlots = useMemo(() => {
    if (!settings || !selectedDate || !selectedService || loadingAppointments) return []
    return getAvailableAppointments(selectedService.duration, dayAppointments, settings)
  }, [settings, selectedDate, selectedService, dayAppointments, loadingAppointments])

  // Deselect time if it's no longer available
  useEffect(() => {
    if (timeValue && availableSlots.length > 0 && !availableSlots.some(s => s.start === timeValue)) {
      setValue('time', '')
    }
  }, [availableSlots, timeValue, setValue])

  // ─── Reset state when modal opens ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    setSelectedServiceId(defaultServiceId)
    setSelectedCategoryId(null)
    setGuestName('')
    setGuestPhone('')
    setGuestErrors({ name: '', phone: '' })
    setConfirmedDate(null)
    setConfirmedTime(null)
    reset({ date: '', time: '' })

    if (defaultServiceId) {
      setStep(STEPS.DETAILS)
    } else if (availableCategories.length === 0) {
      setStep(STEPS.SERVICE)
    } else {
      setStep(STEPS.CATEGORY)
    }
  }, [isOpen, defaultServiceId, availableCategories.length, reset])

  // ─── DETAILS submit: authenticated → create; guest → go to GUEST_CONFIRM ─
  const onDetailsSubmit = async (data) => {
    if (!selectedService) {
      toast.error('Por favor seleccioná un servicio')
      return
    }

    const dateValidation = validateAppointmentDateTime(data.date, data.time, role)
    if (!dateValidation.valid) {
      toast.error(dateValidation.message)
      return
    }

    const [year, month, day] = data.date.split('-').map(Number)
    const appointmentDate = new Date(year, month - 1, day, 12, 0, 0)

    const hasConflict = await checkAppointmentConflict(appointmentDate, data.time, selectedService.duration)
    if (hasConflict) {
      toast.error('Ese horario ya está ocupado. Elegí otro horario disponible.')
      return
    }

    if (!isAuthenticated) {
      // Save date/time and move to guest contact step
      setConfirmedDate(appointmentDate)
      setConfirmedTime(data.time)
      setStep(STEPS.GUEST_CONFIRM)
      return
    }

    // Authenticated: create appointment directly
    try {
      await createAppointment({
        clientId: userProfile?.uid || user?.uid,
        clientName: userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Usuario Registrado',
        clientPhone: userProfile?.phone || null,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        duration: selectedService.duration,
        date: appointmentDate,
        time: data.time,
      })
      toast.success('Turno agendado correctamente')
      onClose()
      reset()
    } catch (err) {
      console.error('Error al agendar turno:', err)
      toast.error('No se pudo reservar el turno')
    }
  }

  // ─── GUEST_CONFIRM submit ────────────────────────────────────────────────
  const onGuestConfirm = async (e) => {
    e.preventDefault()

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

    if (!selectedService || !confirmedDate || !confirmedTime) {
      toast.error('Faltan datos del turno. Por favor intentá nuevamente.')
      setStep(STEPS.DETAILS)
      return
    }

    setIsSubmittingGuest(true)
    try {
      await createAppointment({
        clientId: null,
        clientName: guestName.trim(),
        clientPhone: guestPhone.trim(),
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        duration: selectedService.duration,
        date: confirmedDate,
        time: confirmedTime,
      })
      toast.success(`¡Listo ${guestName.trim()}! Turno agendado. Te contactaremos por WhatsApp.`)
      onClose()
      reset()
      setGuestName('')
      setGuestPhone('')
    } catch (err) {
      console.error('Error al agendar turno de invitado:', err)
      toast.error('No se pudo reservar el turno')
    } finally {
      setIsSubmittingGuest(false)
    }
  }

  const handleLoginRedirect = () => {
    if (selectedService) {
      savePendingAction({ type: 'BOOK_SERVICE', payload: { serviceId: selectedService.id } })
    }
    onClose()
    navigate(ROUTES.LOGIN, { state: { from: location } })
  }

  const handleBack = () => {
    if (step === STEPS.SERVICE) {
      setStep(availableCategories.length > 0 ? STEPS.CATEGORY : STEPS.CATEGORY)
    } else if (step === STEPS.DETAILS) {
      if (!defaultServiceId) {
        setSelectedServiceId(null)
        setStep(availableCategories.length > 0 ? STEPS.CATEGORY : STEPS.SERVICE)
      }
    } else if (step === STEPS.GUEST_CONFIRM) {
      setStep(STEPS.DETAILS)
    }
  }

  if (!isOpen) return null

  const today = new Date()
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const canGoBack =
    (step === STEPS.SERVICE) ||
    (step === STEPS.DETAILS && !defaultServiceId) ||
    (step === STEPS.GUEST_CONFIRM)

  // ─── Progress indicator (only for wizard with categories) ────────────────
  const showProgress = availableCategories.length > 0 && step !== STEPS.GUEST_CONFIRM
  const progressSteps = [STEPS.CATEGORY, STEPS.SERVICE, STEPS.DETAILS]
  const progressIndex = progressSteps.indexOf(step)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-brand-border bg-brand-card p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-lg p-1 text-brand-text-muted hover:bg-brand-pastel/30 hover:text-brand-text z-50 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Back button */}
        {canGoBack && (
          <button
            onClick={handleBack}
            aria-label="Volver"
            className="absolute left-4 top-4 rounded-lg p-1 text-brand-text-muted hover:bg-brand-pastel/30 hover:text-brand-text transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Header */}
        <h2 className="text-xl font-bold text-brand-text text-center">Reservar Turno</h2>
        {step !== STEPS.GUEST_CONFIRM && (
          <p className="mb-4 mt-1 text-center text-sm text-brand-text-muted">
            Podés agendar con hasta 2 horas de anticipación.
          </p>
        )}

        {/* Progress dots */}
        {showProgress && (
          <div className="flex items-center justify-center gap-2 mb-5">
            {progressSteps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  step === s ? 'bg-brand-primary text-white' :
                  progressIndex > i ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-brand-pastel text-brand-text-muted'
                )}>
                  {progressIndex > i ? '✓' : i + 1}
                </div>
                {i < 2 && <div className={cn('h-px w-6', progressIndex > i ? 'bg-emerald-500/30' : 'bg-brand-border')} />}
              </div>
            ))}
          </div>
        )}

        {/* ─── STEP: CATEGORY ─── */}
        {step === STEPS.CATEGORY && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-brand-text">Elegí una categoría</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategoryId(cat.id); setStep(STEPS.SERVICE) }}
                  className={cn(
                    'rounded-xl border border-brand-border bg-brand-card p-4 text-left transition-all duration-200',
                    'hover:border-brand-primary/50 hover:bg-brand-pastel/30'
                  )}
                >
                  <p className="font-medium text-brand-text">{cat.name}</p>
                  <p className="mt-1 text-xs text-brand-text-muted">
                    {services?.filter((s) => s.categoryId === cat.id && s.active !== false).length} servicios
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP: SERVICE ─── */}
        {step === STEPS.SERVICE && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-brand-text">
              {selectedCategoryId
                ? `Servicios de ${categories?.find((c) => c.id === selectedCategoryId)?.name || ''}`
                : 'Seleccioná un servicio'}
            </p>
            {loadingServices ? (
              <p className="text-sm text-brand-text-muted text-center py-6">Cargando servicios...</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(selectedCategoryId ? servicesByCategory : services?.filter((s) => s.active !== false) || []).map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => { setSelectedServiceId(svc.id); setStep(STEPS.DETAILS) }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl border border-brand-border bg-brand-card p-4 text-left transition-all duration-200',
                      'hover:border-brand-primary/50 hover:bg-brand-pastel/30'
                    )}
                  >
                    <div>
                      <p className="font-medium text-brand-text">{svc.name}</p>
                      <p className="mt-0.5 text-xs text-brand-text-muted">{svc.duration} min</p>
                    </div>
                    <p className="font-semibold text-emerald-400">{formatCurrency(svc.price)}</p>
                  </button>
                ))}
                {selectedCategoryId && servicesByCategory.length === 0 && (
                  <p className="text-sm text-brand-text-muted text-center py-4">No hay servicios en esta categoría.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── STEP: DETAILS (Fecha + Hora) ─── */}
        {step === STEPS.DETAILS && (
          <form onSubmit={handleSubmit(onDetailsSubmit)} className="flex flex-col gap-5">
            {/* Selected service summary */}
            {selectedService && (
              <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-card p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-pastel">
                  <Clock className="h-4 w-4 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-text">{selectedService.name}</p>
                  <p className="text-xs text-brand-text-muted">{formatCurrency(selectedService.price)} · {selectedService.duration} min</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <Input
                type="date"
                label="Fecha"
                min={role === USER_ROLES.ADMIN ? undefined : minDate}
                error={errors.date?.message}
                {...register('date')}
              />

              {dateValue && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-text">Horarios disponibles</label>
                  {loadingAppointments || !settings ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-10 rounded-lg bg-brand-pastel/30 animate-pulse" />
                      ))}
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                      {availableSlots.map(slot => {
                        const isSelected = timeValue === slot.start
                        const [hours, minutes] = slot.start.split(':').map(Number)
                        const [year, month, day] = dateValue.split('-').map(Number)
                        const appointmentTime = new Date(year, month - 1, day, hours, minutes, 0)
                        const minAllowedTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
                        if (appointmentTime < minAllowedTime) return null

                        return (
                          <button
                            key={slot.start}
                            type="button"
                            onClick={() => setValue('time', slot.start, { shouldValidate: true })}
                            className={cn(
                              'rounded-lg border px-2 py-2 text-center text-sm font-medium transition-colors',
                              isSelected
                                ? 'border-brand-primary bg-brand-primary text-white shadow-md'
                                : 'border-brand-border bg-brand-bg text-brand-text hover:border-brand-primary/50'
                            )}
                          >
                            {slot.start}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-red-400">No hay horarios disponibles para este servicio en la fecha seleccionada.</p>
                  )}
                  {errors.time && <p className="text-xs text-red-400">{errors.time.message}</p>}
                </div>
              )}
            </div>

            <div className="mt-2 flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
              <Button
                type="submit"
                loading={isSubmitting || isPending}
                disabled={!timeValue}
              >
                {/* Authenticated: confirm directly. Guest: continue to contact form */}
                {isAuthenticated ? 'Confirmar Reserva' : 'Continuar'}
              </Button>
            </div>
          </form>
        )}

        {/* ─── STEP: GUEST_CONFIRM (Nombre + Teléfono, abierto por defecto) ─── */}
        {step === STEPS.GUEST_CONFIRM && (
          <form onSubmit={onGuestConfirm} className="flex flex-col gap-5">
            {/* Summary card */}
            {selectedService && confirmedTime && (
              <div className="rounded-xl border border-brand-border bg-brand-card p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-brand-text">{selectedService.name}</span>
                  <span className="ml-auto font-semibold text-emerald-400 text-sm">{formatCurrency(selectedService.price)}</span>
                </div>
                <p className="text-xs text-brand-text-muted pl-6">
                  {confirmedDate
                    ? confirmedDate.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' })
                    : ''} · {confirmedTime} hs
                </p>
              </div>
            )}

            {/* Guest name + phone — open by default */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-brand-primary" />
                <p className="text-sm font-semibold text-brand-text">Tus datos de contacto</p>
              </div>

              <Input
                type="text"
                label="Nombre y Apellido"
                placeholder="Ej: María González"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value)
                  if (guestErrors.name) setGuestErrors((prev) => ({ ...prev, name: '' }))
                }}
                error={guestErrors.name}
                autoFocus
              />

              <div>
                <Input
                  type="tel"
                  label="Número de WhatsApp / Teléfono"
                  placeholder="Ej: 0981 123 456"
                  value={guestPhone}
                  onChange={(e) => {
                    setGuestPhone(e.target.value)
                    if (guestErrors.phone) setGuestErrors((prev) => ({ ...prev, phone: '' }))
                  }}
                  error={guestErrors.phone}
                />
                <p className="mt-1 text-[11px] text-brand-text-muted">
                  Te enviamos la confirmación del turno por WhatsApp.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                loading={isSubmittingGuest || isPending}
                fullWidth
              >
                Confirmar Reserva
              </Button>

              {/* Secondary option: login instead */}
              <button
                type="button"
                onClick={handleLoginRedirect}
                className="flex items-center justify-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-primary transition-colors py-1"
              >
                <LogIn className="h-3.5 w-3.5" />
                Preferís iniciar sesión para guardar tu historial de turnos →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default UserBookingModal
