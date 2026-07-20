/**
 * WorkCard — A premium, visually appealing card for the public gallery.
 * Shows the main photo, title, and service. Handles hover micro-animations.
 */

import { getThumbnailUrl } from '@/services/cloudinary/cloudinaryService'
import { Scissors } from 'lucide-react'

export default function WorkCard({ work, onClick }) {
  const mainPhoto = work.photos?.[0]
  if (!mainPhoto) return null

  return (
    <div
      onClick={() => onClick(work)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-brand-pastel/10 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-brand-primary/10 animate-fade-in"
    >
      {/* Image with zoom effect on hover */}
      <div className="aspect-[4/5] w-full overflow-hidden">
        <img
          src={getThumbnailUrl(mainPhoto.publicId) || mainPhoto.secureUrl}
          alt={work.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col justify-end p-5">
        <div className="translate-y-2 transition-transform duration-300 ease-out group-hover:translate-y-0">
          <h3 className="text-lg font-bold text-white drop-shadow-sm line-clamp-1">
            {work.title}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Scissors className="h-3.5 w-3.5 text-brand-pastel" />
            <span className="text-sm font-medium text-brand-pastel line-clamp-1">
              {work.serviceName}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
