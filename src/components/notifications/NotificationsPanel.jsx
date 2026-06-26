import { Bell, CheckCheck, Scissors, UserPlus, CalendarX, CalendarPlus, CalendarSync, Inbox } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications'
import { NOTIFICATION_TYPES } from '@/constants/notifications'
import { cn } from '@/utils/cn'

const TYPE_ICONS = {
  [NOTIFICATION_TYPES.APPOINTMENT_CREATED]: CalendarPlus,
  [NOTIFICATION_TYPES.APPOINTMENT_UPDATED]: CalendarSync,
  [NOTIFICATION_TYPES.APPOINTMENT_CANCELLED]: CalendarX,
  [NOTIFICATION_TYPES.CLIENT_CREATED]: UserPlus,
  [NOTIFICATION_TYPES.SERVICE_CREATED]: Scissors,
  [NOTIFICATION_TYPES.SYSTEM]: Bell,
}

function getTimeAgo(date) {
  if (!date) return ''
  const d = date?.toDate ? date.toDate() : new Date(date)
  return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

function NotificationsPanel({ isOpen, onClose }) {
  const { data: notifications, isLoading } = useNotifications()
  const { mutate: markRead } = useMarkAsRead()
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllAsRead()

  if (!isOpen) return null

  const unread = notifications?.filter((n) => !n.read) || []
  const hasUnread = unread.length > 0

  return (
    <div
      className={cn(
        'w-[calc(100vw-2rem)] sm:w-[360px] origin-top-right animate-slide-down',
        'rounded-2xl border border-white/[0.08] bg-slate-900/95',
        'shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl',
        'flex flex-col overflow-hidden'
      )}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-rose-400" />
          <span className="text-sm font-semibold text-white">Notificaciones</span>
          {hasUnread && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
              {unread.length}
            </span>
          )}
        </div>
        {hasUnread && (
          <button
            onClick={() => markAllRead()}
            disabled={isMarkingAll}
            className="flex items-center gap-1 text-xs text-rose-400/70 transition-colors hover:text-rose-300 disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Leer todas
          </button>
        )}
      </div>

      {/* ── List ────────────────────────────────────────────────────────── */}
      <div className="max-h-[70vh] sm:max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex h-20 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
          </div>
        ) : notifications?.length > 0 ? (
          <div className="py-1">
            {notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Bell
              const isUnread = !n.read
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    if (isUnread) markRead(n.id)
                  }}
                  className={cn(
                    'flex w-full gap-3 border-b border-white/[0.04] px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-white/[0.03]',
                    isUnread ? 'bg-white/[0.02]' : 'opacity-50'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                      isUnread ? 'bg-rose-500/15 text-rose-400' : 'bg-white/[0.05] text-slate-500'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'truncate text-sm font-medium',
                          isUnread ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        {n.title}
                      </span>
                      {isUnread && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {getTimeAgo(n.createdAt)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
              <Inbox className="h-5 w-5 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-400">No tienes notificaciones</p>
            <p className="text-center text-xs text-slate-600">
              Cuando ocurra alguna actividad, la verás aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPanel
