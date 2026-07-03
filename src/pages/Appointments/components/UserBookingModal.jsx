import { useState, useEffect, useMemo } from 'react'
import { X, ChevronLeft, Check, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { useServices } from '@/hooks/useServices'
import { useActiveCategories } from '@/hooks/useServiceCategories'
import { useCreateAppointment } from '@/hooks/useAppointments'
import { checkAppointmentConflict } from '@/services/appointments/appointmentsService'
import { BUSINESS_HOURS, USER_ROLES } from '@/constants/app'
import { validateAppointmentDateTime } from '@/utils/dateValidation'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const SCHEMA_STEP2 = z.object({
  date: z.string().min(1, 'Seleccioná una fecha'),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora inválida (HH:mm)'),
}).superRefine((data, ctx) => {
  if (!data.date || !data.time) return
  const [year, month, day] = data.date.split('-').map(Number)
  const [hours, minutes] = data.time.split(':').map(Number)
  const appointmentTime = new Date(year, month - 1, day, hours, minutes, 0)

  if (!BUSINESS_HOURS.DAYS.includes(appointmentTime.getDay())) {
    ctx.addIssue({ path: ['date'], code: z.ZodIssueCode.custom, message: 'El salón no atiende este día' })
  }
  if (data.time < BUSINESS_HOURS.START || data.time > BUSINESS_HOURS.END) {
    ctx.addIssue({ path: ['time'], code: z.ZodIssueCode.custom, message: `El horario de atención es de ${BUSINESS_HOURS.START} a ${BUSINESS_HOURS.END}` })
  }
  // NOTA: La validación de turnos en el pasado se maneja en onSubmit según el rol.
  const minAllowedTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
  if (appointmentTime < minAllowedTime) {
    ctx.addIssue({ path: ['time'], code: z.ZodIssueCode.custom, message: 'Debe ser con al menos 2 hs de anticipación' })
  }
})

const STEPS = { CATEGORY: 0, SERVICE: 1, DETAILS: 2 }

function UserBookingModal({ isOpen, onClose, defaultServiceId = null }) {
  const { userProfile, user, role } = useAuth()
  const { data: services, isLoading: loadingServices } = useServices()
  const { data: categories } = useActiveCategories()
  const { mutateAsync: createAppointment, isPending } = useCreateAppointment()

  const [step, setStep] = useState(STEPS.DETAILS)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedServiceId, setSelectedServiceId] = useState(defaultServiceId)

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

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm({
    resolver: zodResolver(SCHEMA_STEP2),
    defaultValues: { date: '', time: '10:00' }
  })

  useEffect(() => {
    if (!isOpen) return
    if (defaultServiceId) {
      setStep(STEPS.DETAILS)
      setSelectedServiceId(defaultServiceId)
      reset({ date: '', time: '10:00' })
    } else if (availableCategories.length === 0) {
      setStep(STEPS.SERVICE)
      setSelectedCategoryId(null)
      setSelectedServiceId(null)
      reset({ date: '', time: '10:00' })
    } else {
      setStep(STEPS.CATEGORY)
      setSelectedCategoryId(null)
      setSelectedServiceId(null)
      reset({ date: '', time: '10:00' })
    }
  }, [isOpen, defaultServiceId])

  useEffect(() => {
    if (defaultServiceId) {
      setValue('date', '')
      setValue('time', '10:00')
    }
  }, [defaultServiceId, setValue])

  const onSubmit = async (data) => {
    try {
      if (!selectedService || !userProfile) {
        toast.error('Error al obtener datos')
        return
      }

      // Validar que el usuario pueda agendar en esta fecha/hora
      // Los administradores pueden agendar en cualquier momento (pasado incluido)
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

      const clientId = userProfile?.uid || user?.uid
      const clientName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Usuario Registrado'

      await createAppointment({
        clientId,
        clientName,
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
    } catch {
      toast.error('No se pudo reservar el turno')
    }
  }

  if (!isOpen) return null

  const today = new Date()
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const renderProgress = () => (
    <div className="flex items-center gap-2 mb-6">
      {[STEPS.CATEGORY, STEPS.SERVICE, STEPS.DETAILS].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors',
            step === s ? 'bg-rose-500 text-white' :
            step > s ? 'bg-emerald-500/20 text-emerald-400' :
            'bg-slate-800 text-slate-500'
          )}>
            {step > s ? <Check className="h-3 w-3" /> : i + 1}
          </div>
          {i < 2 && <div className={cn('h-px w-6', step > s ? 'bg-emerald-500/30' : 'bg-slate-800')} />}
        </div>
      ))}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white z-50">
          <X className="h-5 w-5" />
        </button>

        {step !== STEPS.CATEGORY && (
          <button onClick={() => {
            if (step === STEPS.SERVICE) setStep(STEPS.CATEGORY)
            else if (step === STEPS.DETAILS && !defaultServiceId) {
              setSelectedServiceId(null)
              setStep(availableCategories.length > 0 ? STEPS.CATEGORY : STEPS.SERVICE)
            }
          }} className="absolute left-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <h2 className="text-xl font-bold text-white text-center">Reservar Turno</h2>
        <p className="mb-4 mt-1 text-center text-sm text-slate-400">Podés agendar con hasta 2 horas de anticipación.</p>

        {availableCategories.length > 0 && renderProgress()}

        {/* Step 0: Category selection */}
        {step === STEPS.CATEGORY && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-200">Elegí una categoría</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategoryId(cat.id); setStep(STEPS.SERVICE) }}
                  className={cn(
                    'rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all duration-200',
                    'hover:border-rose-500/30 hover:bg-rose-500/5'
                  )}
                >
                  <p className="font-medium text-white">{cat.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {services?.filter((s) => s.categoryId === cat.id && s.active !== false).length} servicios
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Service selection */}
        {step === STEPS.SERVICE && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-200">
              {selectedCategoryId
                ? `Servicios de ${categories?.find((c) => c.id === selectedCategoryId)?.name || ''}`
                : 'Seleccioná un servicio'}
            </p>
            {loadingServices ? (
              <p className="text-sm text-slate-500">Cargando servicios...</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(selectedCategoryId ? servicesByCategory : services?.filter((s) => s.active !== false) || []).map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => { setSelectedServiceId(svc.id); setStep(STEPS.DETAILS) }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 text-left transition-all duration-200',
                      'hover:border-rose-500/30 hover:bg-rose-500/5'
                    )}
                  >
                    <div>
                      <p className="font-medium text-white">{svc.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{svc.duration} min</p>
                    </div>
                    <p className="font-semibold text-emerald-400">{formatCurrency(svc.price)}</p>
                  </button>
                ))}
                {selectedCategoryId && servicesByCategory.length === 0 && (
                  <p className="text-sm text-slate-500">No hay servicios en esta categoría.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date + Time form */}
        {step === STEPS.DETAILS && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {selectedService && (
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10">
                  <Clock className="h-4 w-4 text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{selectedService.name}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(selectedService.price)} · {selectedService.duration} min</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Fecha"
                min={role === USER_ROLES.ADMIN ? undefined : minDate}
                error={errors.date?.message}
                {...register('date')}
              />
              <Input label="Hora" type="time" step={900} error={errors.time?.message} {...register('time')} />
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" loading={isSubmitting || isPending}>Confirmar Reserva</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default UserBookingModal
