/**
 * GalleryDetailModal — Public modal showing a work in detail, with a carousel
 * and a clear Call to Action (CTA) to book the specific service.
 */

import { useNavigate } from 'react-router-dom'
import { Scissors, CalendarHeart, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { ROUTES } from '@/routes/routes'
import WorkPhotosCarousel from '@/pages/Works/components/WorkPhotosCarousel'

export default function GalleryDetailModal({ isOpen, onClose, work }) {
  const navigate = useNavigate()

  if (!work) return null

  const handleBookNow = () => {
    // Navigate to appointments page and pass the selected service ID
    // so the booking flow can auto-select it.
    navigate(ROUTES.APPOINTMENTS, {
      state: { preselectedServiceId: work.serviceId },
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      // Remove default title since we have a custom header
      hideHeader
    >
      {/* Custom Close Button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-1.5 text-white backdrop-blur hover:bg-black/60"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex flex-col">
        {/* Main Photos Area */}
        <div className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6">
          {/* We reuse the carousel but without padding it up to the edges */}
          <div className="bg-black">
             <WorkPhotosCarousel photos={work.photos} />
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-6 space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-brand-pastel/30 px-2.5 py-1 text-xs font-medium text-brand-text">
                <Scissors className="h-3.5 w-3.5 text-brand-primary" />
                {work.serviceName}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-brand-text">{work.title}</h2>
          </div>

          {work.description && (
            <p className="text-sm text-brand-text-muted leading-relaxed">
              {work.description}
            </p>
          )}

          {/* CTA */}
          <div className="pt-4 mt-2 border-t border-brand-pastel">
            <Button
              onClick={handleBookNow}
              fullWidth
              size="lg"
              leftIcon={<CalendarHeart className="h-5 w-5" />}
              className="text-base font-semibold shadow-lg shadow-brand-primary/30"
            >
              Reservar este servicio
            </Button>
            <p className="mt-2 text-center text-xs text-brand-text-muted">
              Serás redirigida al calendario para elegir fecha y hora.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
