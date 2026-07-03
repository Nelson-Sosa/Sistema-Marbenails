import { Phone, Edit2, CalendarDays, MessageCircle, History, Gift } from 'lucide-react'
import { getInitials, formatPhoneDisplayPY } from '@/utils/formatters'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

/**
 * Returns the phone/WhatsApp status badge for a client or user document.
 * Handles missing fields gracefully (backward-compatible with old records).
 */
function WhatsAppBadge({ phone, phoneVerified }) {
  if (!phone) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-pastel px-2 py-0.5 text-xs font-medium text-brand-text-muted">
        ❌ Sin teléfono
      </span>
    )
  }
  if (phoneVerified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-success/10 px-2 py-0.5 text-xs font-medium text-brand-success">
        ✅ Verificado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
      ⏳ Pendiente
    </span>
  )
}

function ClientCard({ client, onEdit, onViewHistory }) {
  return (
    <Card>
      <Card.Body>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-pastel/50 text-lg font-bold text-brand-text-muted">
                {getInitials(client.name)}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-brand-text truncate">{client.name}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-brand-text-muted">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{formatPhoneDisplayPY(client.phone || client.whatsapp) || 'Sin teléfono'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={onViewHistory} className="h-9 w-9 p-0" title="Ver historial">
                <History className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onEdit} className="h-9 w-9 p-0" title="Editar cliente">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

        {/* WhatsApp status row */}
        <div className="mt-3 flex items-center gap-2">
          <MessageCircle className="h-3.5 w-3.5 text-brand-text-muted" />
          <WhatsAppBadge phone={client.phone ?? client.whatsapp} phoneVerified={client.phoneVerified} />
          {client.whatsappOptIn && client.phone && (
            <span className="text-xs text-brand-text-muted">· Notif. activas</span>
          )}
        </div>
      </Card.Body>
      <Card.Footer>
        <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
          <div className="flex items-center gap-2 text-brand-text-muted">
            <CalendarDays className="h-4 w-4" />
            <span><strong className="text-brand-text">{client.totalVisits || 0}</strong> visita{(client.totalVisits ?? 0) !== 1 ? 's' : ''}</span>
          </div>
          {(client.freeServices ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[11px] font-medium text-brand-primary">
              <Gift className="h-3 w-3" />
              {client.freeServices} gratis
            </span>
          )}
        </div>
      </Card.Footer>
    </Card>
  )
}

export default ClientCard
