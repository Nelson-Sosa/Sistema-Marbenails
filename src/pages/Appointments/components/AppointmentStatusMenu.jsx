import { useState, useRef } from 'react'
import { ChevronDown, Check, Clock, XCircle, UserX, Play } from 'lucide-react'
import { APPOINTMENT_STATUS, STATUS_CONFIG } from '@/constants/app'
import Badge from '@/components/ui/Badge'
import DropdownPortal from '@/components/ui/DropdownPortal'
import { cn } from '@/utils/cn'

const STATUS_ICONS = {
  [APPOINTMENT_STATUS.PENDING]: Clock,
  [APPOINTMENT_STATUS.CONFIRMED]: Check,
  [APPOINTMENT_STATUS.IN_PROGRESS]: Play,
  [APPOINTMENT_STATUS.DONE]: Check,
  [APPOINTMENT_STATUS.CANCELLED]: XCircle,
  [APPOINTMENT_STATUS.NO_SHOW]: UserX,
}

function AppointmentStatusMenu({ currentStatus, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef(null)

  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG[APPOINTMENT_STATUS.PENDING]
  const Icon = STATUS_ICONS[currentStatus] || STATUS_ICONS[APPOINTMENT_STATUS.PENDING]

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 focus:outline-none"
      >
        <Badge variant={config.variant} size="lg" className="cursor-pointer hover:opacity-80">
          {config.label}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Badge>
      </button>

      <DropdownPortal
        triggerRef={buttonRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        align="right"
        transition
        transitionDuration={150}
      >
        <div className="w-48 rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-slate-950/50 py-1">
          {Object.entries(STATUS_CONFIG).map(([status, { label, variant }]) => {
            const Icon = STATUS_ICONS[status] || Clock
            return (
              <button
                key={status}
                onClick={() => {
                  onChange(status)
                  setIsOpen(false)
                }}
                disabled={status === currentStatus}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-slate-800',
                  status === currentStatus ? 'text-rose-400 opacity-50' : 'text-slate-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            )
          })}
        </div>
      </DropdownPortal>
    </>
  )
}

export default AppointmentStatusMenu
