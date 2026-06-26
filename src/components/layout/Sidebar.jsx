import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/utils/cn'
import { NAV_ITEMS } from '@/constants/navigation'
import { APP_NAME } from '@/constants/app'
import { useAuth } from '@/hooks/useAuth'

/**
 * Sidebar component — responsive navigation panel.
 *
 * Desktop: collapsible between full (240px) and icon-only (64px) mode
 * Mobile: full overlay drawer controlled by parent (isOpen/onClose props)
 *
 * @param {Object} props
 * @param {boolean} props.isCollapsed - Desktop collapsed state
 * @param {() => void} props.onToggleCollapse - Toggle desktop collapse
 * @param {boolean} props.isMobileOpen - Mobile drawer open state
 * @param {() => void} props.onMobileClose - Close mobile drawer
 */
function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose }) {
  const { role, loadingRole } = useAuth()

  const filteredItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <>
      {/* ── Mobile Overlay Backdrop ─────────────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar Panel ───────────────────────────────────────────────── */}
      <aside
        id="main-sidebar"
        aria-label="Navegación principal"
        className={cn(
          'fixed top-0 left-0 z-30 flex h-[100dvh] flex-col',
          'border-r border-slate-800/50 bg-slate-950',
          'transition-all duration-300 ease-in-out',
          'hidden lg:flex',
          isCollapsed ? 'lg:w-16' : 'lg:w-56',
          'lg:!flex',
          isMobileOpen
            ? 'flex !w-64 translate-x-0'
            : 'translate-x-[-100%] lg:translate-x-0'
        )}
      >
        {/* ── Logo / Brand ───────────────────────────────────────────── */}
        <div
          className={cn(
            'flex h-16 items-center border-b border-slate-800/50',
            isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
          )}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500/70 to-violet-500/70 shadow-md shadow-rose-500/15">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-base font-semibold tracking-tight text-white">
              {APP_NAME}
            </span>
          )}
        </div>

        {/* ── Navigation Items ───────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4">
          {loadingRole ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-rose-500" />
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5 px-2" role="list">
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => {
                      if (isMobileOpen) onMobileClose()
                    }}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px]',
                        'text-sm font-medium transition-all duration-200',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50',
                        isActive
                          ? 'bg-white/[0.03] text-white border-l-2 border-rose-500/25 rounded-l-none pl-[calc(0.75rem-2px)]'
                          : 'text-slate-400 hover:bg-white/[0.02] hover:text-slate-200',
                        isCollapsed && 'justify-center px-2 border-l-0 rounded-l-lg'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'h-5 w-5 flex-shrink-0 transition-colors duration-200',
                            isActive
                              ? 'text-rose-400'
                              : 'text-slate-500 group-hover:text-slate-300'
                          )}
                          aria-hidden="true"
                        />
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {/* ── Collapse Toggle (desktop only) ─────────────────────────── */}
        <div className="hidden border-t border-slate-800/50 p-2 lg:block">
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-expanded={!isCollapsed}
            aria-controls="main-sidebar"
            className={cn(
              'flex w-full items-center rounded-lg px-3 py-2 min-h-[44px]',
              'text-sm text-slate-500 transition-colors duration-200',
              'hover:bg-white/[0.03] hover:text-slate-300',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50',
              isCollapsed ? 'justify-center' : 'gap-3'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Colapsar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
