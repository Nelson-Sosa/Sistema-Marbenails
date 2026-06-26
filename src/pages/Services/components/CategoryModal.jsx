import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useCreateCategory, useUpdateCategory } from '@/hooks/useServiceCategories'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  description: z.string().optional(),
})

function CategoryModal({ isOpen, onClose, category }) {
  const { mutateAsync: createCategory, isPending: isCreating } = useCreateCategory()
  const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdateCategory()

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
    }
  })

  const onSubmit = async (data) => {
    try {
      if (category) {
        await updateCategory({ id: category.id, data })
        toast.success('Categoría actualizada')
      } else {
        await createCategory(data)
        toast.success('Categoría creada')
      }
      onClose()
      reset()
    } catch (error) {
      console.error('[CategoryModal] Error creating category:', error)
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
          {category ? 'Editar Categoría' : 'Nueva Categoría'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Input
            label="Nombre de la categoría"
            placeholder="Ej. Manicura"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-200">Descripción (opcional)</label>
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              placeholder="Descripción de la categoría..."
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

export default CategoryModal
