import { Settings } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import PagePlaceholder from '@/components/common/PagePlaceholder'

function SettingsPage() {
  usePageTitle('Configuración')
  return (
    <PagePlaceholder
      title="Configuración"
      description="Ajustes del sistema, gestión de usuarios, horarios y notificaciones. Próximamente disponible."
      icon={Settings}
    />
  )
}

export default SettingsPage
