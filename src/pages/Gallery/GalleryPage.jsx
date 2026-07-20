/**
 * GalleryPage — Public gallery displaying all published works.
 * Responsive grid (4 cols desktop, 3 tablet, 2 mobile).
 */

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { usePublishedWorks } from '@/hooks/useWorks'
import Spinner from '@/components/ui/Spinner'
import WorkCard from './components/WorkCard'
import GalleryDetailModal from './components/GalleryDetailModal'

export default function GalleryPage() {
  const { data: works, isLoading, error } = usePublishedWorks()
  const [selectedWork, setSelectedWork] = useState(null)
  
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-center">
        <p className="text-red-500 font-medium">Error al cargar la galería. Intentá de nuevo.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Premium */}
      <div className="mb-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-pastel/30 px-4 py-1.5 text-sm font-medium text-brand-primary animate-fade-in">
          <Sparkles className="h-4 w-4" />
          <span>Portfolio Profesional</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-text tracking-tight animate-slide-up">
          Nuestros <span className="text-gradient-brand">Trabajos</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-brand-text-muted animate-slide-up" style={{ animationDelay: '100ms' }}>
          Inspirate con algunos de nuestros mejores diseños y encontrá el estilo perfecto para tu próxima cita.
        </p>
      </div>

      {/* Grid */}
      {works?.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} onClick={setSelectedWork} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-pastel bg-brand-pastel/10 text-center">
          <Sparkles className="mb-4 h-8 w-8 text-brand-primary opacity-50" />
          <h3 className="text-lg font-semibold text-brand-text">Aún no hay trabajos publicados</h3>
          <p className="mt-2 text-brand-text-muted max-w-md">
            Estamos preparando nuestra galería. ¡Volvé pronto para ver nuestros mejores diseños!
          </p>
        </div>
      )}

      {/* Detail Modal */}
      <GalleryDetailModal
        isOpen={!!selectedWork}
        onClose={() => setSelectedWork(null)}
        work={selectedWork}
      />
    </div>
  )
}
