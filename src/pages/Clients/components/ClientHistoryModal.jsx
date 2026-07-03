import { useMemo, useState } from 'react'
import { X, CalendarDays, Clock, DollarSign, Scissors, Gift, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useClientHistory } from '@/hooks/useClients'
import { useBenefitsSettings, useRedeemFreeService } from '@/hooks/useBenefits'
import { useAuth } from '@/hooks/useAuth'
import { APPOINTMENT_STATUS } from '@/constants/app'
import { formatCurrency, formatPhoneDisplayPY } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

function getAptDate(apt) {
  if (apt.date?.toDate) return apt.date.toDate()
  if (apt.date?.seconds) return new Date(apt.date.seconds * 1000)
  return new Date(apt.date)
}

function ClientHistoryModal({ isOpen, onClose, client }) {
  const { data: appointments, isLoading } = useClientHistory(client?.id)
  const { data: benefitsSettings } = useBenefitsSettings()
  const redeemMutation = useRedeemFreeService()
  const { user } = useAuth()
  const [confirmRedeem, setConfirmRedeem] = useState(false)

  const metrics = useMemo(() => {
    if (!appointments) {
      return { totalVisits: 0, lastVisit: null, totalSpent: 0 }
    }

    const completed = appointments.filter(
      (apt) => apt.status === APPOINTMENT_STATUS.DONE
    )

    const totalVisits = completed.length
    const totalSpent = completed.reduce((sum, apt) => sum + (Number(apt.price) || 0), 0)
    const lastVisit = completed.length > 0 ? getAptDate(completed[0]) : null

    return { totalVisits, lastVisit, totalSpent }
  }, [appointments])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-2xl lg:max-w-4xl overflow-y-auto rounded-2xl border border-brand-pastel bg-brand-card p-4 sm:p-6 lg:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-brand-text-muted hover:bg-brand-pastel hover:text-brand-primary"
        >
          <X className="h-5 w-5" />
        </button>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* ── Client Header ──────────────────────────────────────────── */}
            <div>
              <h2 className="text-xl font-bold text-brand-text">{client.name}</h2>
              <p className="mt-0.5 text-sm text-brand-text-muted">
                {formatPhoneDisplayPY(client.phone || client.whatsapp) || 'Sin teléfono'}
              </p>
            </div>

            {/* ── Metrics Cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-brand-pastel bg-brand-pastel/10 px-4 py-5">
                <CalendarDays className="h-6 w-6 text-brand-primary" />
                <span className="text-3xl font-bold text-brand-text">{metrics.totalVisits}</span>
                <span className="text-xs text-brand-text-muted">Visitas</span>
              </div>

              <div className="flex flex-col items-center gap-2 rounded-xl border border-brand-pastel bg-brand-pastel/10 px-4 py-5">
                <Clock className="h-6 w-6 text-sky-600" />
                <span className="text-center text-base font-bold text-brand-text">
                  {metrics.lastVisit
                    ? format(metrics.lastVisit, 'dd/MM/yy', { locale: es })
                    : '—'}
                </span>
                <span className="text-xs text-brand-text-muted">Última visita</span>
              </div>

              <div className="flex flex-col items-center gap-2 rounded-xl border border-brand-pastel bg-brand-pastel/10 px-4 py-5">
                <DollarSign className="h-6 w-6 text-brand-success" />
                <span className="text-base font-bold text-brand-success">
                  {metrics.totalSpent > 0 ? formatCurrency(metrics.totalSpent) : '—'}
                </span>
                <span className="text-xs text-brand-text-muted">Total gastado</span>
              </div>
            </div>

            {/* ── Benefits Program ──────────────────────────────────────────── */}
            {benefitsSettings?.enabled && (
              <div className="rounded-xl border border-brand-pastel bg-brand-pastel/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Gift className="h-5 w-5 text-brand-primary" />
                  <h3 className="text-base font-semibold text-brand-text">Programa de Beneficios</h3>
                </div>

                {(client.freeServices ?? 0) > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-600 font-medium">Servicio gratuito disponible</span>
                    </div>
                    <p className="text-sm text-brand-text-muted">
                      {client.freeServices} servicio{(client.freeServices ?? 0) > 1 ? 's' : ''} gratuito{(client.freeServices ?? 0) > 1 ? 's' : ''} para canjear.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={redeemMutation.isPending}
                      onClick={() => setConfirmRedeem(true)}
                    >
                      <Gift className="h-3.5 w-3.5" />
                      Canjear Servicio Gratis
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-brand-text-muted">
                      <span>{client.totalVisits ?? 0} de {client.nextRewardAt ?? benefitsSettings.rewardEveryVisits ?? 10} visitas</span>
                      <span className="font-medium text-brand-primary">{Math.max((client.nextRewardAt ?? benefitsSettings.rewardEveryVisits ?? 10) - (client.totalVisits ?? 0), 0)} restantes</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-pastel/50">
                      <div
                        className="h-full rounded-full bg-brand-primary transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            ((client.totalVisits ?? 0) / (client.nextRewardAt ?? benefitsSettings.rewardEveryVisits ?? 10)) * 100,
                            100
                          )}%`
                        }}
                      />
                    </div>
                    <p className="text-sm text-brand-text-muted">
                      {client.totalVisits >= (client.nextRewardAt ?? benefitsSettings.rewardEveryVisits ?? 10)
                        ? '¡Listo para recompensa!'
                        : `Faltan ${Math.max((client.nextRewardAt ?? benefitsSettings.rewardEveryVisits ?? 10) - (client.totalVisits ?? 0), 0)} visita${Math.max((client.nextRewardAt ?? 10) - (client.totalVisits ?? 0), 0) !== 1 ? 's' : ''} para obtener un servicio gratuito.`
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Service History ────────────────────────────────────────── */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-text-muted">
                Historial de Servicios
              </h3>

              {appointments.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {appointments.map((apt) => {
                    const aptDate = getAptDate(apt)
                    const isActive = apt.status === 'done'
                    return (
                      <div
                        key={apt.id}
                        className={cn(
                          'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-brand-pastel px-4 py-3.5 transition-colors hover:bg-brand-pastel/30',
                          isActive ? 'border-l-brand-success' : 'border-l-brand-pastel'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                            isActive ? 'bg-brand-success/10' : 'bg-brand-pastel/30'
                          )}>
                            <Scissors className={cn(
                              'h-4 w-4',
                              isActive ? 'text-brand-success' : 'text-brand-text-muted'
                            )} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-brand-text truncate">
                              {apt.serviceName || 'Servicio'}
                            </p>
                            <p className="text-xs text-brand-text-muted">
                              {format(aptDate, "d 'de' MMM, yyyy", { locale: es })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {apt.price != null && (
                            <span className="text-sm font-semibold text-brand-success">
                              {formatCurrency(apt.price)}
                            </span>
                          )}
                          {isActive && (
                            <Badge variant="success" size="sm">Completado</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-brand-pastel bg-brand-pastel/10">
                  <Scissors className="mb-2 h-6 w-6 text-brand-text-muted" />
                  <p className="text-sm text-brand-text-muted">No tiene turnos registrados</p>
                </div>
              )}
            </div>

            {/* ── Redeem Confirmation ────────────────────────────────────── */}
            <ConfirmDialog
              isOpen={confirmRedeem}
              onClose={() => setConfirmRedeem(false)}
              onConfirm={async () => {
                await redeemMutation.mutateAsync({ clientId: client.id, adminUid: user?.uid })
                setConfirmRedeem(false)
              }}
              title="Canjear Servicio Gratis"
              message={`¿Estás seguro de que deseas canjear 1 servicio gratuito para ${client.name}?`}
              confirmLabel="Canjear"
              isLoading={redeemMutation.isPending}
            />

            {/* ── Close ──────────────────────────────────────────────────── */}
            <div className="flex justify-end">
              <Button variant="ghost" onClick={onClose}>Cerrar</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientHistoryModal
