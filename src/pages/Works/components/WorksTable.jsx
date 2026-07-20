/**
 * WorksTable — Data grid for works in the admin panel.
 * Displays a list of works with their thumbnail, title, service, date, and status.
 */

import { useState } from 'react'
import { MoreVertical, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getThumbnailUrl } from '@/services/cloudinary/cloudinaryService'
import { useDeleteWork, useToggleWorkPublished } from '@/hooks/useWorks'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import DropdownPortal from '@/components/ui/DropdownPortal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import toast from 'react-hot-toast'

export default function WorksTable({ works, onEdit, onView }) {
  const [deletingId, setDeletingId] = useState(null)
  
  const { mutateAsync: togglePublish } = useToggleWorkPublished()
  const { mutateAsync: deleteWork, isPending: isDeleting } = useDeleteWork()

  const handleTogglePublish = async (work) => {
    try {
      await togglePublish({ id: work.id, published: !work.published })
      toast.success(work.published ? 'Trabajo ocultado' : 'Trabajo publicado')
    } catch (err) {
      toast.error('No se pudo actualizar el estado.')
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
              <th className="px-4 py-3 hidden md:table-cell">Fecha</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-pastel">
            {works.map((work) => {
              const mainPhoto = work.photos?.[0]
              const dateObj = work.createdAt?.toDate ? work.createdAt.toDate() : new Date(work.createdAt || Date.now())
              
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
                    <span className="truncate text-brand-text-muted">
                      {work.serviceName}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 hidden md:table-cell text-brand-text-muted">
                    {format(dateObj, 'dd/MM/yyyy', { locale: es })}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={work.published ? 'success' : 'default'}
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {work.published ? 'Publicado' : 'Oculto'}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <DropdownPortal
                      trigger={
                        <Button variant="ghost" size="xs" className="px-1.5 h-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                      menuClasses="w-48"
                      align="end"
                    >
                      <DropdownPortal.Item onClick={() => onView(work)}>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Ver fotos
                      </DropdownPortal.Item>
                      <DropdownPortal.Item onClick={() => handleTogglePublish(work)}>
                        {work.published ? (
                          <>
                            <XCircle className="mr-2 h-4 w-4 text-amber-500" />
                            Ocultar de galería
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4 text-brand-success" />
                            Publicar en galería
                          </>
                        )}
                      </DropdownPortal.Item>
                      <DropdownPortal.Item onClick={() => onEdit(work)}>
                        Editar información
                      </DropdownPortal.Item>
                      <DropdownPortal.Divider />
                      <DropdownPortal.Item
                        variant="danger"
                        onClick={() => setDeletingId(work.id)}
                      >
                        Eliminar trabajo
                      </DropdownPortal.Item>
                    </DropdownPortal>
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
        message="¿Estás seguro de que deseas eliminar este trabajo? Esta acción no se puede deshacer. Las imágenes asociadas deberán ser eliminadas manualmente de Cloudinary."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}
