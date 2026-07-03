import { TrendingUp, Users, CalendarDays, Landmark, Clock, ChevronRight } from 'lucide-react'
import BenefitsCard from './components/BenefitsCard'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { formatCurrency } from '@/utils/formatters'
import { APPOINTMENT_STATUS, STATUS_CONFIG } from '@/constants/app'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/routes/routes'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Mi\u00e9rcoles', 'Jueves', 'Viernes', 'S\u00e1bado']
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function DashboardPage() {
  usePageTitle('Dashboard')

  const { user, userProfile } = useAuth()
  const { data: stats, isLoading } = useDashboardStats()

  const displayName = userProfile?.displayName || user?.displayName || 'Bienvenida'
  const firstName = displayName.split(' ')[0]

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos d\u00edas' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const dateStr = `${DAYS[now.getDay()]} ${now.getDate()} de ${MONTHS[now.getMonth()]}`

  const totalDone = stats?.topServices?.reduce((sum, s) => sum + s.count, 0) || 1

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* ── Premium Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-text">
            {greeting}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Resumen operativo del sal&oacute;n
          </p>
          <p className="mt-0.5 text-xs text-brand-text-muted">
            {dateStr}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-brand-pastel bg-brand-pastel/30 px-4 py-2 text-xs text-brand-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-success" />
          En vivo
        </div>
      </div>

      {/* ── Metric Cards ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: CalendarDays, value: stats?.todayAppointmentsCount ?? 0, label: 'Turnos hoy', color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { icon: Users, value: stats?.totalClients ?? 0, label: 'Clientes totales', color: 'text-sky-400', bg: 'bg-sky-500/10' },
          { icon: TrendingUp, value: formatCurrency(stats?.todayIncome ?? 0), label: 'Ingresos hoy', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: Landmark, value: formatCurrency(stats?.monthIncome ?? 0), label: 'Ingresos del mes', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(({ icon: Icon, value, label, color, bg }) => (
          <div
            key={label}
            className="group rounded-2xl border border-brand-pastel bg-brand-card p-5 shadow-sm shadow-brand-text/5 transition-all duration-200 hover:border-brand-primary/50 hover:shadow-brand-text/10 hover:-translate-y-0.5"
          >
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight text-brand-text truncate">{value}</p>
            <p className="mt-1 text-xs text-brand-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Main Content (3-column grid at lg) ──────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* ── Agenda de Hoy (spans 2 cols) ─────────────────────────────────── */}
        <div className="xl:col-span-2">
          <Card>
            <Card.Header
              title="Agenda de Hoy"
              action={
                <Link to={ROUTES.APPOINTMENTS} className="text-sm text-brand-primary hover:text-brand-primary-hover transition-colors">
                  Ver todos &rarr;
                </Link>
              }
            />
            <Card.Body className="space-y-3">
              {stats?.todayAppointmentsList?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CalendarDays className="mb-3 h-8 w-8 text-brand-text-muted" />
                  <p className="text-sm text-brand-text-muted">No hay turnos agendados para hoy.</p>
                </div>
              ) : (
                stats?.todayAppointmentsList?.slice(0, 5).map((app) => {
                  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG[APPOINTMENT_STATUS.PENDING]
                  const initial = (app.clientName || '?')[0].toUpperCase()
                  return (
                    <div
                      key={app.id}
                      className="group flex items-center gap-4 rounded-xl border border-transparent bg-transparent p-4 transition-all duration-200 hover:bg-brand-pastel/30 hover:-translate-y-0.5"
                    >
                      {/* Time accent */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-semibold text-brand-text">{app.time}</span>
                        <div className="h-6 w-0.5 rounded-full bg-brand-pastel" />
                      </div>

                      {/* Avatar with initial */}
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-semibold text-brand-primary">
                        {initial}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-brand-text">{app.clientName}</p>
                        <p className="mt-0.5 truncate text-xs text-brand-text-muted">{app.serviceName}</p>
                      </div>

                      {/* Price (hidden on small screens) */}
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-medium text-brand-text-muted">{formatCurrency(app.price)}</p>
                      </div>

                      {/* Status badge */}
                      <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>
                    </div>
                  )
                })
              )}
            </Card.Body>
          </Card>
        </div>

        {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* ── Programa de Beneficios ──────────────────────────────────────── */}
          <BenefitsCard />

          {/* ── Próximo Turno ─────────────────────────────────────────────── */}
          <Card>
            <Card.Header title="Pr&oacute;ximo Turno" />
            <Card.Body>
              {stats?.nextAppointment ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                      <Clock className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tracking-tight text-brand-text">
                        {stats.nextAppointment.time}
                      </p>
                      <p className="text-sm text-brand-text-muted">{stats.nextAppointment.clientName}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-brand-pastel bg-brand-pastel/10 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-brand-text-muted">Servicio</span>
                      <span className="font-medium text-brand-text">{stats.nextAppointment.serviceName}</span>
                    </div>
                  </div>
                  <Link
                    to={ROUTES.APPOINTMENTS}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-pastel py-2.5 text-sm text-brand-text-muted transition-all duration-200 hover:border-brand-primary/50 hover:text-brand-primary"
                  >
                    Ver turno
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="mb-3 h-8 w-8 text-brand-text-muted" />
                  <p className="text-sm text-brand-text-muted">No hay pr&oacute;ximos turnos.</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* ── Servicios más vendidos ────────────────────────────────────── */}
          <Card>
            <Card.Header title="Servicios m&aacute;s vendidos" />
            <Card.Body className="space-y-4">
              {stats?.topServices?.length > 0 ? (
                stats.topServices.map((svc) => {
                  const pct = Math.round((svc.count / totalDone) * 100)
                  return (
                    <div key={svc.name}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-brand-text">{svc.name}</span>
                        <span className="text-xs text-brand-text-muted">{pct}% &middot; {svc.count} turnos</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-brand-pastel/30">
                        <div
                          className="h-full rounded-full bg-brand-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-6 text-center text-sm text-brand-text-muted">
                  Sin servicios este mes.
                </div>
              )}
            </Card.Body>
          </Card>

        </div>
      </div>
    </div>
  )
}

export default DashboardPage
