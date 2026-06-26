import { Gem, Gift, Bell, History, Calendar } from 'lucide-react'

const BENEFITS = [
  { icon: Gift, text: 'Programa de beneficios con recompensas cada 10 visitas.' },
  { icon: Bell, text: 'Recordatorios automáticos por WhatsApp (próximamente).' },
  { icon: History, text: 'Historial completo de servicios y visitas.' },
  { icon: Calendar, text: 'Reservas online 24/7 desde cualquier dispositivo.' },
]

function UserBenefitsCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 transition-all duration-300 hover:border-white/[0.1]">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-rose-500/10">
          <Gem className="h-5 w-5 text-amber-400" />
        </span>
        <div>
          <p className="text-sm font-medium text-white">Beneficios Marbenails</p>
          <p className="text-xs text-slate-500">Todo lo que ofrecemos para ti</p>
        </div>
      </div>

      <ul className="space-y-3">
        {BENEFITS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.04]">
              <Icon className="h-3.5 w-3.5 text-slate-400" />
            </span>
            <span className="text-sm text-slate-400 leading-relaxed">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default UserBenefitsCard
