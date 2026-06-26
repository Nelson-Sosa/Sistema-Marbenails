import { LogOut, User, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/routes/routes'
import { cn } from '@/utils/cn'

function UserMenuDropdown({ isOpen, onClose, displayName, email, initials, isAdmin, onLogout }) {
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'w-56 origin-top-right animate-slide-down',
        'rounded-2xl border border-white/[0.08] bg-slate-900/95',
        'shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl',
        'overflow-hidden'
      )}
    >
      <div className="border-b border-white/[0.06] px-4 py-3">
        <p className="text-sm font-medium text-white">{displayName}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{email}</p>
      </div>

      <div className="p-1">
        <button
          role="menuitem"
          onClick={() => {
            onClose()
            navigate(ROUTES.PROFILE)
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2',
            'text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white'
          )}
        >
          <User className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Mi perfil
        </button>

        {isAdmin && (
          <button
            role="menuitem"
            onClick={() => {
              onClose()
              navigate(ROUTES.SETTINGS)
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2',
              'text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white'
            )}
          >
            <Settings className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Configuración
          </button>
        )}

        <div className="my-1 border-t border-white/[0.06]" />

        <button
          role="menuitem"
          onClick={onLogout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2',
            'text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300'
          )}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default UserMenuDropdown
