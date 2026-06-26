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
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-5 transition-all duration-300 hover:border-white/[0.1]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rose-500/5 blur-2xl" />

      <div className="relative space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-violet-500/20 text-rose-400">
            <Gift className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-white">Programa de Beneficios</p>
            <p className="text-[11px] text-slate-500">
              {rewardEvery} visitas = 1 servicio gratuito
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Tus clientes acumulan una visita cada vez que completan un turno.
          Al llegar a {rewardEvery} visitas reciben automáticamente un servicio gratuito.
        </p>

        <button
          onClick={() => navigate(ROUTES.CLIENTS)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors"
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
