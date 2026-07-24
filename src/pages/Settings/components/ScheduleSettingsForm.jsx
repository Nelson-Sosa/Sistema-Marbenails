import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useScheduleSettings, useUpdateScheduleSettings } from '@/hooks/useScheduleSettings'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  openingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora inválida (HH:mm)'),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora inválida (HH:mm)'),
  slotInterval: z.number().min(5).max(120),
  minimumAppointmentDuration: z.number().min(5).max(120),
}).superRefine((data, ctx) => {
  if (data.openingTime >= data.closingTime) {
    ctx.addIssue({
      path: ['openingTime'],
      code: z.ZodIssueCode.custom,
      message: 'La apertura debe ser antes del cierre',
    })
    ctx.addIssue({
      path: ['closingTime'],
      code: z.ZodIssueCode.custom,
      message: 'El cierre debe ser después de la apertura',
    })
  }
})

export default function ScheduleSettingsForm() {
  const { data: settings, isLoading } = useScheduleSettings()
  const { mutateAsync: updateSettings, isPending } = useUpdateScheduleSettings()

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      openingTime: '07:00',
      closingTime: '19:00',
      slotInterval: 30,
      minimumAppointmentDuration: 30,
    }
  })

  useEffect(() => {
    if (settings) {
      reset({
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        slotInterval: settings.slotInterval,
        minimumAppointmentDuration: settings.minimumAppointmentDuration,
      })
    }
  }, [settings, reset])

  const onSubmit = async (data) => {
    try {
      await updateSettings(data)
      toast.success('Configuración guardada correctamente')
      reset(data) // Reset isDirty
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar la configuración')
    }
  }

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-brand-pastel/20 rounded-xl"></div>
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-brand-text">Horarios del negocio</h3>
        <p className="mt-1 text-sm text-brand-text-muted">
          Configurá la apertura, cierre e intervalos de la agenda. 
          <br/><span className="text-brand-primary">ℹ️ Estos cambios afectan automáticamente a las reservas online y agenda administrativa.</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Horario de apertura"
            type="time"
            error={errors.openingTime?.message}
            {...register('openingTime')}
          />
          <Input
            label="Horario de cierre"
            type="time"
            error={errors.closingTime?.message}
            {...register('closingTime')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-text">Intervalo de agenda (minutos)</label>
            <select
              className={`h-10 w-full rounded-lg border bg-brand-bg px-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/50 ${errors.slotInterval ? 'border-red-500' : 'border-brand-border hover:border-brand-primary/50 focus:border-brand-primary'}`}
              {...register('slotInterval', { valueAsNumber: true })}
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos (1 hora)</option>
            </select>
            {errors.slotInterval && <p className="text-xs text-red-400">{errors.slotInterval.message}</p>}
            <p className="text-xs text-brand-text-muted mt-1">Cada cuánto tiempo se pueden agendar turnos.</p>
          </div>

          <Input
            label="Duración mínima (minutos)"
            type="number"
            min={15}
            step={5}
            error={errors.minimumAppointmentDuration?.message}
            {...register('minimumAppointmentDuration', { valueAsNumber: true })}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-brand-border">
          <Button type="submit" loading={isPending} disabled={!isDirty}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  )
}
