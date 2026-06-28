import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useClients } from '@/hooks/useClients'
import { useServices } from '@/hooks/useServices'
import { useCreateAppointment, useUpdateAppointmentDetails } from '@/hooks/useAppointments'
import { useAuth } from '@/context/AuthContext'
import { checkAppointmentConflict } from '@/services/appointments/appointmentsService'
import { BUSINESS_HOURS } from '@/constants/app'
import { validateAppointmentDateTime } from '@/utils/dateValidation'
import { formatCurrency } from '@/utils/formatters'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/utils/cn'

const schema = z.object({
  clientId: z.string().min(1, 'Seleccioná un cliente'),
  serviceId: z.string().min(1, 'Seleccioná un servicio'),
  date: z.string().min(1, 'Seleccioná una fecha'),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora inválida (HH:mm)')
}).superRefine((data, ctx) => {
  if (!data.date || !data.time) return
  
  const [year, month, day] = data.date.split('-').map(Number)
  const [hours, minutes] = data.time.split(':').map(Number)
  
  const appointmentTime = new Date(year, month - 1, day, hours, minutes, 0)
  
  // Validate day of week
  if (!BUSINESS_HOURS.DAYS.includes(appointmentTime.getDay())) {
    ctx.addIssue({
      path: ['date'],
      code: z.ZodIssueCode.custom,
      message: 'El salón no atiende este día',
    })
  }

  // Validate time range
  if (data.time < BUSINESS_HOURS.START || data.time > BUSINESS_HOURS.END) {
    ctx.addIssue({
      path: ['time'],
      code: z.ZodIssueCode.custom,
      message: `El horario de atención es de ${BUSINESS_HOURS.START} a ${BUSINESS_HOURS.END}`,
    })
  }

  // NOTA: La validación de turnos en el pasado se maneja en onSubmit
  // según el rol del usuario (admin puede agendar en pasado, cliente no).
})

function NewAppointmentModal({ isOpen, onClose, initialDate, initialTime, appointmentToEdit = null }) {
  const { role } = useAuth()
  const { data: clients, isLoading: loadingClients } = useClients()
  const { data: services, isLoading: loadingServices } = useServices()
  const { mutateAsync: createAppointment, isPending: isCreating } = useCreateAppointment()
  const { mutateAsync: updateAppointment, isPending: isUpdating } = useUpdateAppointmentDetails()
  
  const isEditing = !!appointmentToEdit
  const isPending = isCreating || isUpdating

  const getEditDateStr = () => {
    if (!appointmentToEdit || !appointmentToEdit.date) return format(initialDate, 'yyyy-MM-dd')
    const d = appointmentToEdit.date.toDate ? appointmentToEdit.date.toDate() : new Date(appointmentToEdit.date)
    return format(d, 'yyyy-MM-dd')
  }

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: appointmentToEdit?.clientId || '',
      serviceId: appointmentToEdit?.serviceId || '',
      date: getEditDateStr(),
      time: appointmentToEdit?.time || initialTime || '10:00',
    }
  })

  useEffect(() => {
    if (appointmentToEdit) {
      reset({
        clientId: appointmentToEdit.clientId,
        serviceId: appointmentToEdit.serviceId,
        date: getEditDateStr(),
        time: appointmentToEdit.time,
      })
    } else {
      reset({
        clientId: '',
        serviceId: '',
        date: format(initialDate, 'yyyy-MM-dd'),
        time: initialTime || '10:00',
      })
    }
  }, [appointmentToEdit, initialDate, reset])

  // We are in mono-professional mode, so no professional selection.
  const onSubmit = async (data) => {
    try {
      const client = clients?.find((c) => c.id === data.clientId)
      const service = services?.find((s) => s.id === data.serviceId)

      if (!client || !service) {
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

      // Convert date string to a Date object at noon to avoid timezone shift
      const [year, month, day] = data.date.split('-').map(Number)
      const appointmentDate = new Date(year, month - 1, day, 12, 0, 0)

      // Verify the slot is available before persisting
      const hasConflict = await checkAppointmentConflict(
        appointmentDate,
        data.time,
        service.duration,
        isEditing ? appointmentToEdit.id : null
      )
      if (hasConflict) {
        toast.error('Ya existe un turno en ese horario. Elegí otro horario.')
        return
      }

      if (isEditing) {
        await updateAppointment({
          id: appointmentToEdit.id,
          data: {
            serviceId: service.id,
            serviceName: service.name,
            price: service.price,
            duration: service.duration,
            date: appointmentDate,
            time: data.time,
          }
        })
        toast.success('Turno actualizado')
      } else {
        await createAppointment({
          clientId: client.id,
          clientName: client.name,
          clientPhone: client.phone || null,
          serviceId: service.id,
          serviceName: service.name,
          price: service.price,
          duration: service.duration,
          date: appointmentDate,
          time: data.time,
        })
        toast.success('Turno agendado')
      }
      onClose()
    } catch (error) {
      toast.error(isEditing ? 'No se pudo actualizar el turno' : 'No se pudo crear el turno')
    }
  }

  if (!isOpen) return null

  const today = new Date()
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

          <h2 className="text-xl font-bold text-white">{isEditing ? 'Editar Turno' : 'Agendar Turno'}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Client Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">Cliente</label>
            <select
              className={cn(
                'h-10 w-full rounded-lg border bg-slate-950 px-3 text-sm text-white',
                errors.clientId ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500',
                isEditing && 'opacity-70 cursor-not-allowed'
              )}
              disabled={loadingClients || isEditing}
              {...register('clientId')}
            >
              <option value="">Seleccionar cliente...</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
              ))}
            </select>
            {errors.clientId && <p className="text-xs text-red-400">{errors.clientId.message}</p>}
            {isEditing && <p className="text-xs text-slate-500">El cliente no se puede modificar.</p>}
          </div>

          {/* Service Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">Servicio</label>
            <select
              className={cn(
                'h-10 w-full rounded-lg border bg-slate-950 px-3 text-sm text-white',
                errors.serviceId ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
              )}
              disabled={loadingServices}
              {...register('serviceId')}
            >
              <option value="">Seleccionar servicio...</option>
              {services?.map((s) => (
                <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.price)}</option>
              ))}
            </select>
            {errors.serviceId && <p className="text-xs text-red-400">{errors.serviceId.message}</p>}
          </div>

          {/* Date Input */}
          <Input 
            label="Fecha del turno" 
            type="date" 
            min={minDate}
            error={errors.date?.message}
            {...register('date')}
          />

          {/* Time Input */}
          <Input 
            label="Hora del turno" 
            type="time" 
            step={900}
            error={errors.time?.message}
            {...register('time')}
          />

          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting || isPending}>Guardar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewAppointmentModal
