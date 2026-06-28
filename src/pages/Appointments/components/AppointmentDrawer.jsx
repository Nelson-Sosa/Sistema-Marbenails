import { useState } from 'react'
import { X, Clock, Calendar, Scissors } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { APPOINTMENT_STATUS, STATUS_CONFIG } from '@/constants/app'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'

function toMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

export default function AppointmentDrawer({ appointment, isOpen, onClose, onEdit, onStatusChange }) {
  if (!appointment) return null

  const aptDate = appointment.date?.toDate ? appointment.date.toDate() : new Date(appointment.date)
  const startMin = toMinutes(appointment.time)
  const safeDuration = Math.min(Number(appointment.duration) || 60, 720)
  const endMin = startMin + safeDuration
  const endH = Math.floor(endMin / 60)
  const endM = endMin % 60
  const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  const formattedDate = format(aptDate, "EEEE d 'de' MMMM 'del' yyyy", { locale: es })

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      )}
      <div className={cn(
        'fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 shrink-0">
          <h2 className="text-lg font-bold text-white truncate">{appointment.clientName}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Status selector */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Estado
            </label>
            <select
              value={appointment.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            >
              {Object.values(APPOINTMENT_STATUS).map((status) => (
                <option key={status} value={status}>
                  {STATUS_CONFIG[status]?.label || status}
                </option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div className="flex items-start gap-3">
            <Scissors className="h-4 w-4 mt-0.5 text-slate-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">{appointment.serviceName}</p>
              <p className="text-xs text-slate-500 mt-px">Duración: {formatDuration(safeDuration)}</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 mt-0.5 text-slate-500 shrink-0" />
            <p className="text-sm text-white capitalize">{formattedDate}</p>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 mt-0.5 text-slate-500 shrink-0" />
            <div>
              <p className="text-sm text-white">{appointment.time} → {endTimeStr}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-800 px-4 py-3 flex gap-2 shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
          <Button onClick={onEdit} className="flex-1">
            Editar
          </Button>
        </div>
      </div>
    </>
  )
}
