/**
 * ClientWorksTab — Shows the works done for the authenticated client.
 * Displayed in the ProfilePage. Private works are also visible here.
 */

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useClientWorks } from '@/hooks/useWorks'
import Spinner from '@/components/ui/Spinner'
import WorkCard from '@/pages/Gallery/components/WorkCard'
import GalleryDetailModal from '@/pages/Gallery/components/GalleryDetailModal'

export default function ClientWorksTab({ clientId }) {
  const { data: works, isLoading, error } = useClientWorks(clientId)
  const [selectedWork, setSelectedWork] = useState(null)

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        Error al cargar tus diseños. Intentá nuevamente.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-brand-text">Mis Diseños</h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          Una galería privada con los trabajos que hemos realizado para vos.
        </p>
      </div>

      {works?.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} onClick={setSelectedWork} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-pastel bg-brand-pastel/10 text-center">
          <Sparkles className="mb-4 h-8 w-8 text-brand-primary opacity-50" />
          <h3 className="text-sm font-semibold text-brand-text">Aún no hay diseños registrados</h3>
          <p className="mt-1 max-w-sm text-sm text-brand-text-muted">
            Cuando te realices un servicio, las fotos de tu diseño aparecerán acá.
          </p>
        </div>
      )}

      {/* Reusing the gallery modal since it looks premium */}
      <GalleryDetailModal
        isOpen={!!selectedWork}
        onClose={() => setSelectedWork(null)}
        work={selectedWork}
      />
    </div>
  )
}
