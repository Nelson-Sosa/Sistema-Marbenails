import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Edit2, Plus, Clock, ArrowRight } from 'lucide-react'
import {
  Hand, Footprints, Eye, EyeClosed, FaceMask, HairDryer,
  FlowerLotus, Handshake, SprayBottle, Palette, Sparkle,
} from '@phosphor-icons/react'
import { formatCurrency } from '@/utils/formatters'
import Badge from '@/components/ui/Badge'

const CATEGORY_ICONS = {
  manicura: Hand,
  uñas: Hand,
  manos: Hand,
  nail: Hand,
  pedicura: Footprints,
  pies: Footprints,
  cejas: Eye,
  brow: Eye,
  pestañas: EyeClosed,
  lash: EyeClosed,
  facial: FaceMask,
  face: FaceMask,
  rostro: FaceMask,
  cabello: HairDryer,
  pelo: HairDryer,
  hair: HairDryer,
  spa: FlowerLotus,
  masajes: Handshake,
  masaje: Handshake,
  massage: Handshake,
  maquillaje: Palette,
  makeup: Palette,
  tratamientos: Sparkle,
  tratamiento: Sparkle,
  depilación: SprayBottle,
  depilacion: SprayBottle,
  wax: SprayBottle,
}

function getCategoryIcon(name) {
  const key = (name || '').toLowerCase().trim()
  for (const [pattern, Icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(pattern)) return Icon
  }
  return Sparkle
}

function CategoryCard({ category, services, isAdmin, onEditCategory, onAddService, onEditService, onBook, defaultOpen }) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? true)
  const [hoveredService, setHoveredService] = useState(null)

  const activeServices = services.filter((s) => s.active !== false)
  const Icon = getCategoryIcon(category.name)

  const minPrice = activeServices.length ? Math.min(...activeServices.map((s) => s.price)) : 0
  const avgDuration = activeServices.length
    ? Math.round(activeServices.reduce((sum, s) => sum + s.duration, 0) / activeServices.length)
    : 0

  return (
    <div className="group rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] shadow-lg shadow-black/[0.08] transition-all duration-300 hover:border-white/[0.1] hover:shadow-xl hover:shadow-black/[0.12]">
      {/* ── Category Header ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(!isOpen) } }}
        className="flex w-full items-center gap-4 px-6 py-6 text-left cursor-pointer select-none"
      >
        {/* LEFT: Icon + Name */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-violet-500/10 ring-1 ring-white/[0.08] shadow-md shadow-rose-500/10">
            <Icon className="h-6 w-6 text-rose-400" />
          </span>
          <div className="min-w-0">
            <h3 className="text-xl font-semibold tracking-tight text-white">{category.name}</h3>
            {category.description && (
              <p className="mt-0.5 text-sm text-slate-500 line-clamp-1">{category.description}</p>
            )}
          </div>
        </div>

        {/* CENTER: Stats (desktop only) */}
        <div className="hidden xl:flex items-center gap-6 text-xs text-slate-500">
          {minPrice > 0 && (
            <span className="whitespace-nowrap">Desde {formatCurrency(minPrice)}</span>
          )}
          {avgDuration > 0 && (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Clock className="h-3.5 w-3.5" />
              {avgDuration} min prom.
            </span>
          )}
        </div>

        {/* RIGHT: Badge + Chevron */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/8 px-3 py-1 text-xs font-medium text-rose-300">
            {activeServices.length} servicio{activeServices.length !== 1 ? 's' : ''}
          </span>

          {isAdmin && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEditCategory(category) }}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
                title="Editar categoría"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAddService(category) }}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-rose-400 transition-all duration-200 hover:bg-rose-500/15"
                title="Agregar servicio"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          <motion.div
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </motion.div>
        </div>
      </div>

      {/* ── Collapsible Content ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="mx-6 border-t border-white/[0.04]" />

            {activeServices.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                No hay servicios en esta categoría.
              </div>
            ) : (
              <div className="flex flex-col gap-3 px-6 py-5">
                  {activeServices.map((svc, i) => {
                  return (
                      <motion.div
                        key={svc.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.04, ease: 'easeOut' }}
                        onMouseEnter={() => setHoveredService(svc.id)}
                        onMouseLeave={() => setHoveredService(null)}
                        onClick={() => !isAdmin && onBook(svc.id)}
                        className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-2xl border px-4 sm:px-5 py-4 transition-all duration-200 cursor-default ${
                          isAdmin ? '' : 'cursor-pointer'
                        } ${
                          hoveredService === svc.id
                            ? 'border-rose-500/25 bg-white/[0.04] shadow-md shadow-rose-500/5 -translate-y-0.5'
                            : 'border-white/[0.04] bg-white/[0.015]'
                        }`}
                      >
                        {/* Name + badges */}
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-white">{svc.name}</p>
                          {svc.description && (
                            <p className="mt-1 text-sm text-slate-500 line-clamp-1">{svc.description}</p>
                          )}
                          {/* Duration (Mobile) */}
                          <div className="flex sm:hidden items-center gap-1.5 mt-2 text-xs text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{svc.duration} min</span>
                          </div>
                        </div>

                        {/* Duration badge (Desktop) */}
                        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400 shrink-0">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{svc.duration} min</span>
                        </div>

                        {/* Price + Action Row */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-white/[0.04] sm:border-0">
                          {/* Price */}
                          <p className="text-sm sm:text-base font-bold text-emerald-400 whitespace-nowrap drop-shadow-sm">
                            {formatCurrency(svc.price)}
                          </p>

                          {/* Action */}
                          {isAdmin ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={svc.active ? 'success' : 'default'} size="sm" dot>
                                {svc.active ? 'Activo' : 'Inactivo'}
                              </Badge>
                              <button
                                onClick={(e) => { e.stopPropagation(); onEditService(svc) }}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => onBook(svc.id)}
                              className="relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 sm:px-5 py-2 text-sm font-medium text-white shadow-lg shadow-rose-500/25 transition-all duration-250 hover:shadow-xl hover:shadow-rose-500/35 shrink-0"
                            >
                              <span>Reservar</span>
                              <ArrowRight className="h-4 w-4" />
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CategoryCard
