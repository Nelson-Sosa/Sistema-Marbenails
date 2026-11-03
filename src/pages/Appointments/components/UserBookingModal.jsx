import React, { useState, useEffect, useMemo } from 'react'
import { X, ChevronLeft, Clock, User, LogIn, UserCheck, Sparkles } from 'lucide-react'
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

const STEPS = {
  AUTH_CHOICE: 'AUTH_CHOICE',
  GUEST_DATA: 'GUEST_DATA',
  CATEGORY: 'CATEGORY',
  SERVICE: 'SERVICE',
  DETAILS: 'DETAILS',
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

  const [step, setStep] = useState(STEPS.DETAILS)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedServiceId, setSelectedServiceId] = useState(defaultServiceId)

  // Guest inputs state
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestErrors, setGuestErrors] = useState({ name: '', phone: '' })

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

  // Build schema dynamically based on settings
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

  // Determine starting step whenever the modal opens
  useEffect(() => {
    if (!isOpen) return

    setSelectedServiceId(defaultServiceId)
    setSelectedCategoryId(null)
    reset({ date: '', time: '' })

    if (!isAuthenticated) {
      // Unauthenticated client: show choice screen
      setStep(STEPS.AUTH_CHOICE)
    } else if (defaultServiceId) {
      setStep(STEPS.DETAILS)
    } else if (availableCategories.length === 0) {
      setStep(STEPS.SERVICE)
    } else {
      setStep(STEPS.CATEGORY)
    }
  }, [isOpen, defaultServiceId, isAuthenticated, availableCategories.length, reset])

  const handleSelectLogin = () => {
    const serviceToSave = selectedServiceId || defaultServiceId
    if (serviceToSave) {
      savePendingAction({ type: 'BOOK_SERVICE', payload: { serviceId: serviceToSave } })
    }
    onClose()
    navigate(ROUTES.LOGIN, { state: { from: location } })
  }

  const handleContinueAsGuest = () => {
    setStep(STEPS.GUEST_DATA)
  }

  const handleValidateGuestData = (e) => {
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

    // Proceed to details if service is already selected, else pick category/service
    if (selectedServiceId || defaultServiceId) {
      setStep(STEPS.DETAILS)
    } else if (availableCategories.length > 0) {
      setStep(STEPS.CATEGORY)
    } else {
      setStep(STEPS.SERVICE)
    }
  }

  const handleBack = () => {
    if (step === STEPS.GUEST_DATA) {
      setStep(STEPS.AUTH_CHOICE)
    } else if (step === STEPS.CATEGORY) {
      if (!isAuthenticated) setStep(STEPS.GUEST_DATA)
    } else if (step === STEPS.SERVICE) {
      if (selectedCategoryId) {
        setStep(STEPS.CATEGORY)
      } else if (!isAuthenticated) {
        setStep(STEPS.GUEST_DATA)
      }
    } else if (step === STEPS.DETAILS) {
      if (!defaultServiceId) {
        setSelectedServiceId(null)
        setStep(availableCategories.length > 0 ? STEPS.CATEGORY : STEPS.SERVICE)
      } else if (!isAuthenticated) {
        setStep(STEPS.GUEST_DATA)
      }
    }
  }

  const onSubmit = async (data) => {
    try {
      if (!selectedService) {
        toast.error('Por favor seleccioná un servicio')
        return
      }

      if (!isAuthenticated && (!guestName.trim() || !guestPhone.trim())) {
        toast.error('Por favor completá tus datos de contacto')
        setStep(STEPS.GUEST_DATA)
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

      const clientId = isAuthenticated ? (userProfile?.uid || user?.uid) : null
      const clientName = isAuthenticated
        ? (userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Usuario Registrado')
        : guestName.trim()
      const clientPhone = isAuthenticated
        ? (userProfile?.phone || null)
        : guestPhone.trim()

      await createAppointment({
        clientId,
        clientName,
        clientPhone,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        duration: selectedService.duration,
        date: appointmentDate,
        time: data.time,
      })

      toast.success(
        isAuthenticated
          ? 'Turno agendado correctamente'
          : `¡Listo ${clientName}! Turno agendado correctamente. Te contactaremos por WhatsApp.`
      )
      onClose()
      reset()
      setGuestName('')
      setGuestPhone('')
      setGuestErrors({ name: '', phone: '' })
    } catch (err) {
      console.error('Error al agendar turno:', err)
      toast.error('No se pudo reservar el turno')
    }
  }

  if (!isOpen) return null

  const today = new Date()
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const isGuestFlow = !isAuthenticated
  const canGoBack =
    step === STEPS.GUEST_DATA ||
    (step === STEPS.CATEGORY && isGuestFlow) ||
    (step === STEPS.SERVICE && (selectedCategoryId || isGuestFlow)) ||
    (step === STEPS.DETAILS && (!defaultServiceId || isGuestFlow))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-brand-border bg-brand-card p-4 sm:p-6 shadow-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-lg p-1 text-brand-text-muted hover:bg-brand-pastel/30 hover:text-brand-text z-50 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {canGoBack && (
          <button
            onClick={handleBack}
            aria-label="Volver"
            className="absolute left-4 top-4 rounded-lg p-1 text-brand-text-muted hover:bg-brand-pastel/30 hover:text-brand-text transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* ─── STEP: AUTH_CHOICE (Invitado o Login) ─── */}
        {step === STEPS.AUTH_CHOICE && (
          <div className="py-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-brand-text text-center">Reservar Turno</h2>
            <p className="mt-1 text-center text-sm text-brand-text-muted">
              Elegí cómo preferís confirmar tu reserva
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {/* Opción 1: Continuar como invitado */}
              <button
                type="button"
                onClick={handleContinueAsGuest}
                className={cn(
                  'group flex items-start gap-4 rounded-2xl border border-brand-border bg-brand-card p-4 text-left transition-all duration-200',
                  'hover:border-brand-primary hover:bg-brand-primary/5 hover:shadow-md'
                )}
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-pastel text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-brand-text">Continuar como invitado</p>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                      Rápido
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-brand-text-muted leading-relaxed">
                    Reservá en el instante completando solo tu nombre y número de WhatsApp para contactarte.
                  </p>
                </div>
              </button>

              {/* Opción 2: Iniciar sesión o registrarme */}
              <button
                type="button"
                onClick={handleSelectLogin}
                className={cn(
                  'group flex items-start gap-4 rounded-2xl border border-brand-border bg-brand-card p-4 text-left transition-all duration-200',
                  'hover:border-brand-primary hover:bg-brand-primary/5 hover:shadow-md'
                )}
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-pastel text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <LogIn className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-brand-text">Iniciar sesión / Registrarme</p>
                  <p className="mt-1 text-xs text-brand-text-muted leading-relaxed">
                    Guardá tu historial de turnos y acumulá visitas para ganar servicios gratuitos de fidelidad.
                  </p>
                </div>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* ─── STEP: GUEST_DATA (Nombre + Teléfono) ─── */}
        {step === STEPS.GUEST_DATA && (
          <form onSubmit={handleValidateGuestData} className="py-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary mb-3">
              <User className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-brand-text text-center">Tus Datos de Contacto</h2>
            <p className="mt-1 text-center text-sm text-brand-text-muted">
              Completá tus datos para que podamos agendar y recordarte tu turno
            </p>

            <div className="mt-6 space-y-4">
              <div>
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
              </div>

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
                  Te escribiremos a este WhatsApp para enviarte la confirmación del turno.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={handleBack}>
                Volver
              </Button>
              <Button type="submit">
                Continuar
              </Button>
            </div>
          </form>
        )}

        {/* ─── STEP: CATEGORY ─── */}
        {step === STEPS.CATEGORY && (
          <div>
            <h2 className="text-xl font-bold text-brand-text text-center">Reservar Turno</h2>
            <p className="mb-4 mt-1 text-center text-sm text-brand-text-muted">
              Elegí una categoría de servicio
            </p>

            <div className="space-y-3">
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
          </div>
        )}

        {/* ─── STEP: SERVICE ─── */}
        {step === STEPS.SERVICE && (
          <div>
            <h2 className="text-xl font-bold text-brand-text text-center">Reservar Turno</h2>
            <p className="mb-4 mt-1 text-center text-sm text-brand-text-muted">
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
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-brand-text text-center">Confirmar Horario</h2>
            <p className="text-center text-sm text-brand-text-muted -mt-2">
              Podés agendar con hasta 2 horas de anticipación.
            </p>

            {/* Servicio seleccionado */}
            {selectedService && (
              <div className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-card p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-pastel">
                    <Clock className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text">{selectedService.name}</p>
                    <p className="text-xs text-brand-text-muted">{selectedService.duration} min</p>
                  </div>
                </div>
                <p className="font-semibold text-emerald-400">{formatCurrency(selectedService.price)}</p>
              </div>
            )}

            {/* Info de a nombre de quién se reserva */}
            <div className="flex items-center justify-between rounded-xl border border-brand-border/60 bg-brand-pastel/20 px-3 py-2 text-xs">
              <span className="text-brand-text-muted flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-brand-primary" />
                <span>Reservando para: <strong>{isAuthenticated ? (userProfile?.displayName || user?.displayName || user?.email) : guestName}</strong></span>
              </span>
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setStep(STEPS.GUEST_DATA)}
                  className="font-medium text-brand-primary hover:underline ml-2 shrink-0"
                >
                  Cambiar
                </button>
              )}
            </div>

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
                        
                        // Skip slots that are within 2 hours from now if the date is today
                        const [hours, minutes] = slot.start.split(':').map(Number)
                        const [year, month, day] = dateValue.split('-').map(Number)
                        const appointmentTime = new Date(year, month - 1, day, hours, minutes, 0)
                        const minAllowedTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
                        
                        if (appointmentTime < minAllowedTime) return null;
                        
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
              <Button type="submit" loading={isSubmitting || isPending} disabled={!timeValue}>Confirmar Reserva</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default UserBookingModal
