/**
 * WorksPage — Admin dashboard for managing all works.
 */

import { useState, useMemo } from 'react'
import { Plus, Search, Image as ImageIcon } from 'lucide-react'
import { useWorks } from '@/hooks/useWorks'
import { useAllServices } from '@/hooks/useServices'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import WorksTable from './components/WorksTable'
import WorkDetailModal from './components/WorkDetailModal'

export default function WorksPage() {
  const { data: works, isLoading, error } = useWorks()
  const { data: services } = useAllServices()

  const [search, setSearch] = useState('')
  const [filterService, setFilterService] = useState('')
  const [selectedWork, setSelectedWork] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Filter works based on search & selected service
  const filteredWorks = useMemo(() => {
    if (!works) return []
    return works.filter((w) => {
      const matchSearch = w.title.toLowerCase().includes(search.toLowerCase())
      const matchService = filterService ? w.serviceId === filterService : true
      return matchSearch && matchService
    })
  }, [works, search, filterService])

  const handleEdit = (work) => {
    setSelectedWork(work)
    setIsDetailOpen(true)
  }

  const handleView = (work) => {
    setSelectedWork(work)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setSelectedWork(null)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        Error al cargar los trabajos. Intentá nuevamente.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Trabajos (Portfolio)</h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Gestioná los diseños realizados. Los trabajos publicados aparecerán en la galería pública.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-brand-pastel bg-brand-card pl-9 pr-4 text-sm text-brand-text placeholder:text-brand-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="h-10 w-full rounded-lg border border-brand-pastel bg-brand-card px-3 text-sm text-brand-text focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary sm:w-48"
        >
          <option value="">Todos los servicios</option>
          {services?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table / Empty State */}
      {filteredWorks.length > 0 ? (
        <WorksTable works={filteredWorks} onEdit={handleEdit} onView={handleView} />
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-brand-pastel bg-brand-pastel/10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-pastel/40">
            <ImageIcon className="h-6 w-6 text-brand-primary" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-brand-text">
            No se encontraron trabajos
          </h3>
          <p className="mt-1 max-w-sm text-sm text-brand-text-muted">
            {search || filterService
              ? 'Intentá cambiar los filtros de búsqueda.'
              : 'Los trabajos se agregan desde el detalle de un turno completado.'}
          </p>
        </div>
      )}

      {/* Detail/Edit Modal */}
      <WorkDetailModal
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        work={selectedWork}
      />
    </div>
  )
}
