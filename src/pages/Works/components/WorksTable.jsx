/**
 * WorksTable — Data grid for works in the admin panel.
 * Displays a list of works with their thumbnail, title, service, date, status and actions.
 */

import { useState } from 'react'
import { Eye, Pencil, Trash2, Globe, EyeOff, Image as ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getThumbnailUrl } from '@/services/cloudinary/cloudinaryService'
import { useDeleteWork, useToggleWorkPublished } from '@/hooks/useWorks'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

export default function WorksTable({ works, onEdit, onView }) {
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const { mutateAsync: togglePublish } = useToggleWorkPublished()
  const { mutateAsync: deleteWork, isPending: isDeleting } = useDeleteWork()

  const handleTogglePublish = async (work) => {
    setTogglingId(work.id)
    try {
      await togglePublish({ id: work.id, published: !work.published })
      toast.success(work.published ? 'Trabajo ocultado' : 'Trabajo publicado')
    } catch (err) {
      toast.error('No se pudo actualizar el estado.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteWork(deletingId)
      toast.success('Trabajo eliminado correctamente.')
    } catch (err) {
      toast.error('No se pudo eliminar el trabajo.')
    } finally {
      setDeletingId(null)
    }
  }

  if (!works?.length) return null

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-brand-pastel bg-brand-card">
        <table className="w-full text-left text-sm text-brand-text">
          <thead className="border-b border-brand-pastel bg-brand-pastel/10 text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
            <tr>
              <th className="px-4 py-3">Trabajo</th>
              <th className="px-4 py-3 hidden sm:table-cell">Servicio</th>
              <th className="px-4 py-3 hidden md:table-cell">Tipo</th>
              <th className="px-4 py-3 hidden lg:table-cell">Fecha</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-pastel">
            {works.map((work) => {
              const mainPhoto = work.photos?.[0]
              const dateObj = work.createdAt?.toDate ? work.createdAt.toDate() : new Date(work.createdAt || Date.now())
              const isToggling = togglingId === work.id

              return (
                <tr key={work.id} className="transition-colors hover:bg-brand-pastel/5">
                  {/* Photo & Title */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-brand-pastel/20 border border-brand-border">
                        {mainPhoto ? (
                          <img
                            src={getThumbnailUrl(mainPhoto.publicId) || mainPhoto.secureUrl}
                            alt={work.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-brand-text-muted" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-brand-text" title={work.title}>
                          {work.title}
                        </p>
                        <p className="truncate text-xs text-brand-text-muted sm:hidden">
                          {work.serviceName}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Service */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-brand-text-muted">{work.serviceName}</span>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {(!work.type || work.type === 'client') ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        👤 Clienta
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-700/10">
                        ⭐ Diseño Libre
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 hidden lg:table-cell text-brand-text-muted text-xs">
                    {format(dateObj, 'dd/MM/yyyy', { locale: es })}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <Badge variant={work.published ? 'success' : 'default'} size="sm" className="whitespace-nowrap">
                      {work.published ? 'Publicado' : 'Oculto'}
                    </Badge>
                  </td>

                  {/* Actions — always-visible icon buttons */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* View */}
                      <button
                        onClick={() => onView(work)}
                        title="Ver fotos"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-text-muted transition-colors hover:bg-brand-pastel hover:text-brand-primary"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(work)}
                        title="Editar"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-text-muted transition-colors hover:bg-brand-pastel hover:text-brand-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* Toggle publish */}
                      <button
                        onClick={() => handleTogglePublish(work)}
                        title={work.published ? 'Ocultar' : 'Publicar'}
                        disabled={isToggling}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                          work.published
                            ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-600'
                            : 'text-brand-text-muted hover:bg-green-50 hover:text-green-600'
                        )}
                      >
                        {work.published
                          ? <EyeOff className="h-4 w-4" />
                          : <Globe className="h-4 w-4" />
                        }
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeletingId(work.id)}
                        title="Eliminar"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Eliminar Trabajo"
        message="¿Estás segura de que deseas eliminar este trabajo? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}
