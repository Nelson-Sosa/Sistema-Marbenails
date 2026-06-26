import { Construction } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Reusable placeholder for pages under development.
 * Shows the page title and a "coming soon" indicator.
 *
 * @param {Object} props
 * @param {string} props.title - Page name
 * @param {string} [props.description] - Optional description
 * @param {import('lucide-react').LucideIcon} [props.icon] - Page icon
 */
function PagePlaceholder({ title, description, icon: Icon }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 ring-1 ring-slate-800">
        {Icon ? (
          <Icon className="h-9 w-9 text-rose-400" />
        ) : (
          <Construction className="h-9 w-9 text-slate-500" />
        )}
      </div>
      <h1 className="mt-6 text-2xl font-bold text-white">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        {description || 'Esta sección está en desarrollo. Volvé pronto.'}
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-400">
        <Construction className="h-3.5 w-3.5" />
        Próximamente
      </div>
    </div>
  )
}

export default PagePlaceholder
