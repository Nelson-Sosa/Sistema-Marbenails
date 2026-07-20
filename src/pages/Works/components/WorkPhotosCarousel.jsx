/**
 * WorkPhotosCarousel — Simple image carousel for browsing work photos.
 * Used in WorkDetailModal (admin) and GalleryDetailModal (public).
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { getFullUrl, getThumbnailUrl } from '@/services/cloudinary/cloudinaryService'

export default function WorkPhotosCarousel({ photos = [] }) {
  const [current, setCurrent] = useState(0)

  if (!photos.length) return null

  const prev = () => setCurrent((i) => (i === 0 ? photos.length - 1 : i - 1))
  const next = () => setCurrent((i) => (i === photos.length - 1 ? 0 : i + 1))

  const currentPhoto = photos[current]

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-pastel/10">
        <img
          key={currentPhoto.publicId}
          src={getFullUrl(currentPhoto.publicId) || currentPhoto.secureUrl}
          alt={`Foto ${current + 1}`}
          loading="lazy"
          className="h-full w-full object-cover animate-fade-in"
        />

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5">
              <span className="text-xs font-medium text-white">
                {current + 1} / {photos.length}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, index) => (
            <button
              key={photo.publicId}
              onClick={() => setCurrent(index)}
              className={cn(
                'relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                index === current
                  ? 'border-brand-primary'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <img
                src={getThumbnailUrl(photo.publicId) || photo.secureUrl}
                alt={`Miniatura ${index + 1}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
