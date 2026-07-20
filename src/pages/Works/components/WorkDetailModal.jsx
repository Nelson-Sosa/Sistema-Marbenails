/**
 * WorkDetailModal — Admin modal for viewing and editing a work.
 * Includes a carousel for photos and a form for editing the title/description.
 */

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { useUpdateWork, useToggleWorkPublished } from '@/hooks/useWorks'
import WorkPhotosCarousel from './WorkPhotosCarousel'

export default function WorkDetailModal({ isOpen, onClose, work }) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const { mutateAsync: updateWork, isPending: isUpdating } = useUpdateWork()
  const { mutateAsync: togglePublish, isPending: isToggling } = useToggleWorkPublished()

  // Sync state when work changes or editing starts
  useEffect(() => {
    if (work) {
      setTitle(work.title || '')
      setDescription(work.description || '')
    }
  }, [work, isEditing])

  if (!work) return null

  const handleClose = () => {
    setIsEditing(false)
    onClose()
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('El título no puede estar vacío.')
      return
    }

    try {
      await updateWork({
        id: work.id,
        data: {
          title: title.trim(),
          description: description.trim(),
        },
      })
      toast.success('Trabajo actualizado correctamente.')
      setIsEditing(false)
    } catch (err) {
      toast.error('Error al actualizar el trabajo.')
    }
  }

  const handleTogglePublish = async () => {
    try {
      await togglePublish({ id: work.id, published: !work.published })
      toast.success(work.published ? 'Trabajo ocultado' : 'Trabajo mostrado públicamente')
    } catch (err) {
      toast.error('Error al cambiar el estado.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Detalle del trabajo"
      maxWidthClass="max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Photos Carousel */}
        <div>
          <WorkPhotosCarousel photos={work.photos} />
        </div>

        {/* Right: Info & Edit Form */}
        <div className="flex flex-col space-y-5">
          <div className="flex items-start justify-between gap-2 border-b border-brand-pastel pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                {work.serviceName}
              </p>
              {!isEditing && (
                <h3 className="mt-1 text-xl font-bold text-brand-text">{work.title}</h3>
              )}
            </div>
            <Badge variant={work.published ? 'success' : 'default'} size="sm">
              {work.published ? 'Publicado' : 'Oculto'}
            </Badge>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="flex-1 space-y-4">
              <Input
                label="Título"
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUpdating}
                required
              />
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="edit-description"
                  className="text-sm font-medium text-brand-text-muted"
                >
                  Descripción
                </label>
                <textarea
                  id="edit-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUpdating}
                  className="w-full resize-none rounded-lg border border-brand-pastel bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={isUpdating} className="flex-1">
                  Guardar
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex-1 space-y-4">
              {work.description ? (
                <div>
                  <p className="text-sm font-medium text-brand-text-muted">Descripción</p>
                  <p className="mt-1 text-sm text-brand-text whitespace-pre-wrap">
                    {work.description}
                  </p>
                </div>
              ) : (
                <p className="text-sm italic text-brand-text-muted">Sin descripción.</p>
              )}

              <div className="pt-4 border-t border-brand-pastel flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="w-full"
                >
                  Editar información
                </Button>
                
                <Button
                  variant={work.published ? 'ghost' : 'secondary'}
                  onClick={handleTogglePublish}
                  loading={isToggling}
                  className="w-full"
                >
                  {work.published ? (
                    <>
                      <XCircle className="mr-2 h-4 w-4 text-amber-500" />
                      Ocultar públicamente
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 text-brand-success" />
                      Mostrar públicamente
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
