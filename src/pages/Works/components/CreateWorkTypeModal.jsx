/**
 * CreateWorkTypeModal — Prompts the admin to choose between a client work
 * or a portfolio work.
 */

import { User, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { ROUTES } from '@/routes/routes'

export default function CreateWorkTypeModal({ isOpen, onClose, onSelectPortfolio }) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleClientSelected = () => {
    onClose()
    // Redirects to appointments as instructed
    navigate(ROUTES.APPOINTMENTS)
  }

  const handlePortfolioSelected = () => {
    onClose()
    onSelectPortfolio()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="¿Qué tipo de trabajo deseás crear?"
      maxWidthClass="max-w-md"
    >
      <div className="flex flex-col gap-3">
        {/* Option: Client Work */}
        <button
          onClick={handleClientSelected}
          className="flex items-center gap-4 rounded-xl border border-brand-pastel bg-brand-pastel/10 p-4 text-left transition-colors hover:border-brand-primary/50 hover:bg-brand-pastel/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/10">
            <User className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <p className="font-semibold text-brand-text">Trabajo de una clienta</p>
            <p className="mt-0.5 text-xs text-brand-text-muted">
              Se asocia a un turno completado y aparece en el perfil de la clienta.
            </p>
          </div>
        </button>

        {/* Option: Portfolio Work */}
        <button
          onClick={handlePortfolioSelected}
          className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left transition-colors hover:border-amber-300 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200/50">
            <Sparkles className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-brand-text">Diseño libre</p>
            <p className="mt-0.5 text-xs text-brand-text-muted">
              Diseño independiente. No se asocia a ninguna clienta, solo se muestra públicamente.
            </p>
          </div>
        </button>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Modal>
  )
}
