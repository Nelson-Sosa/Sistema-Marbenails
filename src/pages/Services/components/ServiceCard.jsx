import { useState } from 'react'
import { Clock, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/utils/formatters'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToggleServiceActive, useDeleteService } from '@/hooks/useServices'

function ServiceCard({ service, isAdmin, onBook, onEdit }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { mutate: toggleActive } = useToggleServiceActive()
  const { mutateAsync: deleteService, isPending: isDeleting } = useDeleteService()

  const handleToggleActive = () => {
    toggleActive({ id: service.id, active: !service.active })
  }

  const handleDelete = async () => {
    try {
      await deleteService(service.id)
      toast.success('Servicio eliminado correctamente')
      setShowDeleteConfirm(false)
    } catch {
      toast.error('No se pudo eliminar el servicio')
    }
  }

  return (
    <>
      <div className="flex flex-col justify-between rounded-xl border border-brand-pastel bg-brand-card p-5 shadow-sm shadow-brand-text/5">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-brand-text">{service.name}</h3>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Badge variant={service.active ? 'success' : 'default'} dot>
                  {service.active ? 'Activo' : 'Inactivo'}
                </Badge>
                <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {service.description && (
            <p className="mt-2 text-sm text-brand-text-muted line-clamp-2">{service.description}</p>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-brand-pastel pt-4">
            <div className="flex items-center gap-1.5 text-sm text-brand-text-muted">
              <Clock className="h-4 w-4" />
              <span>{service.duration} min</span>
            </div>
            <span className="text-lg font-bold text-brand-success">
              {formatCurrency(service.price)}
            </span>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button
            className="flex-1"
            onClick={onBook}
            disabled={!service.active}
          >
            Reservar Turno
          </Button>
          {isAdmin && (
            <Button
              variant={service.active ? 'secondary' : 'outline'}
              onClick={handleToggleActive}
            >
              {service.active ? 'Desactivar' : 'Activar'}
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar Servicio"
        message={`¿Estás segura de que querés eliminar "${service.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        isLoading={isDeleting}
      />
    </>
  )
}

export default ServiceCard
