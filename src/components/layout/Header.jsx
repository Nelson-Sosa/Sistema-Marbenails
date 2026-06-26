import { Menu, Bell } from 'lucide-react'
import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadCount } from '@/hooks/useNotifications'
import { cn } from '@/utils/cn'
import { getInitials } from '@/utils/formatters'
import { APP_NAME } from '@/constants/app'
import { Z_INDEX } from '@/constants/zIndex'
import DropdownPortal from '@/components/ui/DropdownPortal'
import NotificationsPanel from '@/components/notifications/NotificationsPanel'
import UserMenuDropdown from './UserMenuDropdown'

function Header({ onMenuClick }) {
  const { user, userProfile, logout } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const { data: unreadCount = 0 } = useUnreadCount()

  const bellRef = useRef(null)
  const avatarRef = useRef(null)

  const displayName = userProfile?.displayName || user?.displayName || 'Usuario'
  const email = user?.email || ''
  const initials = getInitials(displayName)
  const isAdmin = userProfile?.role === 'admin'

  const handleLogout = async () => {
    setIsUserMenuOpen(false)
    await logout()
  }

  const toggleNotifications = useCallback(() => {
    setIsNotificationsOpen((v) => {
      if (!v) setIsUserMenuOpen(false)
      return !v
    })
  }, [])

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen((v) => {
      if (!v) setIsNotificationsOpen(false)
      return !v
    })
  }, [])

  return (
    <header
      className="flex h-16 items-center justify-between border-b border-white/[0.04] bg-slate-950/70 px-4 backdrop-blur-xl lg:px-6"
      style={{ zIndex: Z_INDEX.HEADER }}
    >
      {/* ── Left: Hamburger (mobile) + Brand ──────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            'text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50',
            'lg:hidden'
          )}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <span className="text-sm font-medium text-slate-400 lg:hidden">
          {APP_NAME}
        </span>
      </div>

      {/* ── Spacer ────────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Right: Actions ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 rounded-2xl border border-transparent bg-transparent p-1 transition-colors md:border-white/[0.04] md:bg-white/[0.02]">
        {/* Notification Bell */}
        <div>
          <button
            ref={bellRef}
            onClick={toggleNotifications}
            aria-label="Notificaciones"
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-xl',
              'text-slate-400 transition-all duration-150',
              'hover:bg-white/[0.08] hover:text-white',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50',
              isNotificationsOpen && 'bg-white/[0.08] text-white'
            )}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white animate-badge-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <DropdownPortal
            triggerRef={bellRef}
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            align="right"
          >
            <NotificationsPanel
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
            />
          </DropdownPortal>
        </div>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-white/[0.06]" />

        {/* User Menu */}
        <div>
          <button
            ref={avatarRef}
            id="user-menu-button"
            onClick={toggleUserMenu}
            aria-haspopup="true"
            aria-expanded={isUserMenuOpen}
            aria-controls="user-menu"
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-2 py-2 min-h-[44px]',
              'text-sm transition-all duration-150',
              'hover:bg-white/[0.06]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50',
              isUserMenuOpen && 'bg-white/[0.06]'
            )}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/80 to-violet-500/80 text-[11px] font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium leading-tight text-slate-200">{displayName}</p>
              <p className="text-[11px] leading-tight text-slate-500">
                {isAdmin ? 'Administrador' : 'Usuario'}
              </p>
            </div>
          </button>

          <DropdownPortal
            triggerRef={avatarRef}
            isOpen={isUserMenuOpen}
            onClose={() => setIsUserMenuOpen(false)}
            align="right"
          >
            <UserMenuDropdown
              isOpen={isUserMenuOpen}
              onClose={() => setIsUserMenuOpen(false)}
              displayName={displayName}
              email={email}
              initials={initials}
              isAdmin={isAdmin}
              onLogout={handleLogout}
            />
          </DropdownPortal>
        </div>
      </div>
    </header>
  )
}

export default Header
