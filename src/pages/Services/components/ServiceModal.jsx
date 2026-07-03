import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useCreateService, useUpdateService } from '@/hooks/useServices'
import { useCategories } from '@/hooks/useServiceCategories'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  categoryId: z.string().min(1, 'Seleccioná una categoría'),
  price: z.preprocess(
    (val) => Number(String(val).replace(/\./g, '')),
    z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'No puede ser negativo')
  ),
  duration: z.number({ invalid_type_error: 'Debe ser un número' }).min(5, 'Mínimo 5 minutos'),
  description: z.string().optional(),
})

function ServiceModal({ isOpen, onClose, service, defaultCategoryId }) {
  const { mutateAsync: createService, isPending: isCreating } = useCreateService()
  const { mutateAsync: updateService, isPending: isUpdating } = useUpdateService()
  const { data: categories } = useCategories()

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service?.name || '',
      categoryId: service?.categoryId || defaultCategoryId || '',
      price: service?.price || 0,
      duration: service?.duration || 60,
      description: service?.description || '',
    }
  })

  const onSubmit = async (data) => {
    try {
      const selectedCategory = categories?.find((c) => c.id === data.categoryId)
      const payload = {
        ...data,
        categoryName: selectedCategory?.name || '',
      }
      if (service) {
        await updateService({ id: service.id, data: payload })
        toast.success('Servicio actualizado')
      } else {
        await createService(payload)
        toast.success('Servicio creado')
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
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md rounded-2xl border border-brand-pastel bg-brand-card p-4 sm:p-6 shadow-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-brand-text-muted hover:bg-brand-pastel hover:text-brand-primary z-50"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-brand-text">
          {service ? 'Editar Servicio' : 'Nuevo Servicio'}
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Input 
            label="Nombre del servicio" 
            placeholder="Ej. Manicura Tradicional"
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Category selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-text-muted">Categoría</label>
            <select
              className={cn(
                'h-10 w-full rounded-lg border bg-brand-bg px-3 text-sm text-brand-text',
                errors.categoryId ? 'border-red-500/50' : 'border-brand-pastel focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
              )}
              {...register('categoryId')}
            >
              <option value="">Seleccionar categoría...</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-red-400">{errors.categoryId.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input 
              label="Precio (Gs.)" 
              type="text"
              placeholder="Ej. 60000"
              error={errors.price?.message}
              {...register('price')}
            />
            <Input 
              label="Duración (minutos)" 
              type="number"
              step="5"
              error={errors.duration?.message}
              {...register('duration', { valueAsNumber: true })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-text-muted">Descripción (opcional)</label>
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-brand-pastel bg-brand-bg p-3 text-sm text-brand-text placeholder-brand-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              placeholder="Detalles del tratamiento..."
              {...register('description')}
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

export default ServiceModal
