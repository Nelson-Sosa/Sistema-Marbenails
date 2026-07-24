import { Settings as SettingsIcon } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import ScheduleSettingsForm from './components/ScheduleSettingsForm'

function SettingsPage() {
  usePageTitle('Configuración')
  
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
          <SettingsIcon className="h-5 w-5 text-brand-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Configuración</h1>
          <p className="text-sm text-brand-text-muted">Administrá los ajustes del sistema del salón.</p>
        </div>
      </div>

      <div className="flex flex-col gap-8 mt-4">
        <ScheduleSettingsForm />
        
        {/* Placeholder for future settings */}
        <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm opacity-60">
          <h3 className="text-lg font-bold text-brand-text">Otras configuraciones</h3>
          <p className="mt-1 text-sm text-brand-text-muted">Próximamente disponible.</p>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
