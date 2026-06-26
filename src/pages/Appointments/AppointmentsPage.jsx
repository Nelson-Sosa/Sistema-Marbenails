import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuth } from '@/context/AuthContext'
import AdminAgendaView from './components/AdminAgendaView'
import UserAppointmentsView from './components/UserAppointmentsView'
import { USER_ROLES } from '@/constants/app'

function AppointmentsPage() {
  usePageTitle('Turnos')
  const { role } = useAuth()

  if (role === USER_ROLES.ADMIN) {
    return <AdminAgendaView />
  }

  return <UserAppointmentsView />
}

export default AppointmentsPage
