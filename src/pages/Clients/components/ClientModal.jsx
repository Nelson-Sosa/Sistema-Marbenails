import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useCreateClient, useUpdateClient } from '@/hooks/useClients'
import { formatPhoneDisplayPY, formatPhoneStoragePY } from '@/utils/formatters'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  notes: z.string().optional(),
  // WhatsApp fields (admin editable)
  whatsappOptIn: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  remindersEnabled: z.boolean().optional(),
})

function ClientModal({ isOpen, onClose, client }) {
  const { mutateAsync: createClient, isPending: isCreating } = useCreateClient()
  const { mutateAsync: updateClient, isPending: isUpdating } = useUpdateClient()

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client?.name || '',
      phone: formatPhoneDisplayPY(client?.phone),
      whatsapp: formatPhoneDisplayPY(client?.whatsapp),
      notes: client?.notes || '',
      whatsappOptIn: client?.whatsappOptIn ?? false,
      phoneVerified: client?.phoneVerified ?? false,
      remindersEnabled: client?.remindersEnabled ?? false,
    }
  })

  const phoneValue = watch('phone') || watch('whatsapp')

  const onSubmit = async (data) => {
    try {
      const formattedPhone = formatPhoneStoragePY(data.phone)
      const formattedWhatsapp = formatPhoneStoragePY(data.whatsapp)
      
      const phone = formattedPhone || formattedWhatsapp || null
      const payload = {
        ...data,
        phone: formattedPhone,
        whatsapp: formattedWhatsapp,
        // If no phone, cannot send reminders
        remindersEnabled: phone ? data.remindersEnabled : false,
      }

      if (client) {
        await updateClient({ id: client.id, data: payload })
        toast.success('Cliente actualizado')
      } else {
        await createClient(payload)
        toast.success('Cliente creado')
      }
      onClose()
      reset()
    } catch (error) {
      toast.error('Ocurrió un error al guardar')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-white">
          {client ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Input 
            label="Nombre Completo" 
            placeholder="Ej. Ana Pérez"
            error={errors.name?.message}
            {...register('name')}
          />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Input 
              label="Teléfono / WhatsApp" 
              placeholder="Ej. 0986321987"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input 
              label="Número alternativo" 
              placeholder="Ej. 0986321987"
              error={errors.whatsapp?.message}
              {...register('whatsapp')}
            />
          </div>

          {/* ── WhatsApp/Contact admin controls ─────────────────────────────── */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estado WhatsApp</p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-rose-500 focus:ring-rose-500"
                {...register('whatsappOptIn')}
                disabled={!phoneValue?.trim()}
              />
              <span className="text-sm text-slate-300">Desea recibir recordatorios por WhatsApp</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                {...register('phoneVerified')}
                disabled={!phoneValue?.trim()}
              />
              <span className="text-sm text-slate-300">☑ Número verificado</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500"
                {...register('remindersEnabled')}
                disabled={!phoneValue?.trim()}
              />
              <span className="text-sm text-slate-300">Recordatorios activos</span>
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">Notas (opcional)</label>
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              placeholder="Preferencias, alergias..."
              {...register('notes')}
            />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isCreating || isUpdating}>Cancelar</Button>
            <Button type="submit" loading={isCreating || isUpdating}>Guardar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientModal
