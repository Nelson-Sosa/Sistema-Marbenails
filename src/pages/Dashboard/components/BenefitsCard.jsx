import { Gift, Users, Sparkles, ChevronRight } from 'lucide-react'
import { useBenefitsSettings } from '@/hooks/useBenefits'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/routes/routes'

function BenefitsCard() {
  const { data: settings } = useBenefitsSettings()
  const navigate = useNavigate()

  if (!settings?.enabled) return null

  const rewardEvery = settings.rewardEveryVisits ?? 10

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-pastel bg-brand-card p-5 shadow-sm shadow-brand-text/5 transition-all duration-300 hover:border-brand-primary/50 hover:shadow-brand-text/10">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-primary/5 blur-2xl" />

      <div className="relative space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <Gift className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-brand-text">Programa de Beneficios</p>
            <p className="text-[11px] text-brand-text-muted">
              {rewardEvery} visitas = 1 servicio gratuito
            </p>
          </div>
        </div>

        <p className="text-xs text-brand-text-muted leading-relaxed">
          Tus clientes acumulan una visita cada vez que completan un turno.
          Al llegar a {rewardEvery} visitas reciben automáticamente un servicio gratuito.
        </p>

        <button
          onClick={() => navigate(ROUTES.CLIENTS)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-primary hover:text-brand-primary-hover transition-colors"
        >
          <Users className="h-3.5 w-3.5" />
          Ver clientes con beneficios
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export default BenefitsCard
