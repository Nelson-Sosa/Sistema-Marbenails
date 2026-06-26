import { Clock, User, Scissors, Edit2 } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import AppointmentStatusMenu from './AppointmentStatusMenu'

function AppointmentCard({ appointment, onStatusChange, currentPrice, onEdit }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      {/* Time & Basics */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center rounded-lg bg-slate-800/50 px-4 py-2">
          <Clock className="mb-1 h-4 w-4 text-rose-400" />
          <span className="font-bold text-white">{appointment.time}</span>
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-white">{appointment.clientName}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
            <Scissors className="h-3.5 w-3.5" />
            <span>{appointment.serviceName}</span>
          </div>
        </div>
      </div>

      {/* Details & Actions */}
      <div className="flex items-center justify-between sm:gap-6">
        <div className="text-right">
          <p className="font-medium text-emerald-400">{formatCurrency(currentPrice ?? appointment.price)}</p>
          <p className="text-xs text-slate-500">{appointment.duration} min</p>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(appointment)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Editar turno"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          <AppointmentStatusMenu 
            currentStatus={appointment.status} 
            onChange={onStatusChange} 
          />
        </div>
      </div>
    </div>
  )
}

export default AppointmentCard
