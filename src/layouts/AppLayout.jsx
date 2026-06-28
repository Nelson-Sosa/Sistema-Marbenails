import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import WhatsAppFloatingButton from '@/components/common/WhatsAppFloatingButton'
import { cn } from '@/utils/cn'

/**
 * AppLayout — the main authenticated layout shell.
 *
 * Structure:
 * ┌──────────────────────────────────────────┐
 * │  Sidebar (fixed, left)  │  Header (top)  │
 * │                         ├────────────────│
 * │                         │  <Outlet />    │
 * │                         │  (page)        │
 * └──────────────────────────────────────────┘
 *
 * Sidebar states:
 * - Desktop: collapsible (isCollapsed state)
 * - Mobile: slide-in drawer overlay (isMobileOpen state)
 *
 * The layout shifts the main content area based on sidebar width.
 */
function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-950">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((v) => !v)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* ── Main content area ────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden',
          'transition-all duration-300 ease-in-out',
          // On desktop, offset left by sidebar width
          isCollapsed ? 'lg:ml-16' : 'lg:ml-56'
        )}
      >
        {/* Header */}
        <Header onMenuClick={() => setIsMobileOpen(true)} />

        {/* Page content */}
        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-y-auto"
        >
          <div className="min-h-full p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      <WhatsAppFloatingButton />
    </div>
  )
}

export default AppLayout
