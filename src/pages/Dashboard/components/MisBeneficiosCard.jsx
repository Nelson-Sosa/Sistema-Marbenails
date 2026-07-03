import { useState } from 'react'
import { Gift, Sparkles, ArrowRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/routes/routes'
import { cn } from '@/utils/cn'
import ProgressBar from '@/components/ui/ProgressBar'

const REWARD_EVERY = 10

function getMessage(progress, totalVisits) {
  if (totalVisits === 0) {
    return {
      title: 'Bienvenido a Marbenails',
      subtitle: 'Reserva tu primer turno y comienza a disfrutar de todos los beneficios.',
    }
  }

  const rewardReady = totalVisits > 0 && progress === 0
  if (rewardReady) {
    return {
      title: '¡Felicidades!',
      subtitle: 'Ya tienes un servicio gratuito disponible.',
      isReward: true,
    }
  }

  if (progress <= 3) {
    return {
      title: '¡Excelente comienzo!',
      subtitle: 'Cada visita te acerca a una recompensa.',
    }
  }

  if (progress <= 6) {
    return {
      title: 'Ya llevas varias visitas.',
      subtitle: 'Sigue así y pronto obtendrás un servicio gratuito.',
    }
  }

  const remaining = REWARD_EVERY - progress
  return {
    title: '¡Ya casi llegas!',
    subtitle: `Solo te faltan ${remaining} visita${remaining !== 1 ? 's' : ''} para desbloquear un servicio gratuito.`,
  }
}

function MisBeneficiosCard({ totalVisits }) {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  const progress = totalVisits % REWARD_EVERY
  const rewardReady = totalVisits > 0 && progress === 0
  const displayProgress = rewardReady ? REWARD_EVERY : progress
  const msg = getMessage(progress, totalVisits)

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 transition-all duration-300 hover:border-white/[0.1]">
        {rewardReady && (
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/8 blur-3xl" />
        )}

        <div className="relative space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                rewardReady
                  ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-400/10'
                  : 'bg-gradient-to-br from-rose-500/20 to-violet-500/20'
              )}
            >
              <Gift
                className={cn('h-5 w-5', rewardReady ? 'text-emerald-400' : 'text-rose-400')}
              />
            </span>
            <div>
              <p className="text-sm font-medium text-white">Mis Beneficios</p>
              <p className="text-xs text-slate-500">Cada visita te acerca a nuevas recompensas.</p>
            </div>
          </div>

          {/* Message */}
          <div className="flex items-start gap-2">
            {msg.isReward && <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />}
            <div>
              <p
                className={cn(
                  'text-sm font-medium',
                  msg.isReward ? 'text-emerald-400' : 'text-slate-200'
                )}
              >
                {msg.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{msg.subtitle}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2.5">
            <ProgressBar value={displayProgress} max={REWARD_EVERY} />
            <p className="text-xs text-slate-400">
              {displayProgress} de {REWARD_EVERY} visitas
            </p>
          </div>

          {/* Reward badge */}
          {rewardReady && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
              <Gift className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">
                SERVICIO GRATIS DISPONIBLE
              </span>
            </div>
          )}

          {/* CTA */}
          <div className="pt-1">
            {rewardReady ? (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 px-4 py-2 text-xs font-medium text-emerald-300 transition-all duration-200 hover:bg-emerald-500/10 active:scale-[0.97]"
              >
                Ver recompensa
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => navigate(ROUTES.APPOINTMENTS)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500/90 to-violet-500/90 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:from-rose-600 hover:to-violet-600 active:scale-[0.97]"
              >
                Reservar turno
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reward modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white z-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-400/10">
                <Gift className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Recompensa disponible</h2>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Ya puedes reclamar tu servicio gratuito en tu próxima visita.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false)
                  navigate(ROUTES.APPOINTMENTS)
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500/90 to-violet-500/90 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:from-rose-600 hover:to-violet-600 active:scale-[0.97]"
              >
                Reservar turno
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MisBeneficiosCard
