import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  Settings,
  UserCircle,
  Sparkles,
  Image as ImageIcon,
  GalleryHorizontal,
} from 'lucide-react'
import { ROUTES } from '@/routes/routes'

/**
 * Main navigation items for the Sidebar.
 * Each item can optionally have `children` for nested menus (future feature).
 *
 * @typedef {Object} NavItem
 * @property {string} id - Unique identifier
 * @property {string} label - Display label
 * @property {string} path - Route path
 * @property {import('lucide-react').LucideIcon} icon - Lucide icon component
 * @property {string} [description] - Short description (for tooltips in collapsed state)
 * @property {string[]} roles - Allowed roles for this item (e.g. ['admin', 'user'])
 */

/** @type {NavItem[]} */
export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    description: 'Resumen general',
    roles: ['admin'],
  },
  {
    id: 'user-dashboard',
    label: 'Inicio',
    path: ROUTES.USER_DASHBOARD,
    icon: Sparkles,
    description: 'Panel de fidelización',
    roles: ['user'],
  },
  {
    id: 'appointments',
    label: 'Turnos',
    path: ROUTES.APPOINTMENTS,
    icon: CalendarDays,
    description: 'Gestión de turnos',
    roles: ['admin', 'user'],
  },
  {
    id: 'clients',
    label: 'Clientes',
    path: ROUTES.CLIENTS,
    icon: Users,
    description: 'Base de clientes',
    roles: ['admin'],
  },
  {
    id: 'services',
    label: 'Servicios',
    path: ROUTES.SERVICES,
    icon: Scissors,
    description: 'Servicios y precios',
    roles: ['admin', 'user'],
  },
  {
    id: 'public-works',
    label: 'Trabajos',
    path: ROUTES.WORKS,
    icon: ImageIcon,
    description: 'Nuestros diseños',
    roles: ['user'],
  },
  {
    id: 'admin-works',
    label: 'Trabajos',
    path: ROUTES.ADMIN_WORKS,
    icon: ImageIcon,
    description: 'Gestión de trabajos',
    roles: ['admin'],
  },
  // {
  //   id: 'reports',
  //   label: 'Reportes',
  //   path: ROUTES.REPORTS,
  //   icon: ChartBar,
  //   description: 'Estadísticas e ingresos',
  //   roles: ['admin'],
  // },
  {
    id: 'settings',
    label: 'Configuración',
    path: ROUTES.SETTINGS,
    icon: Settings,
    description: 'Ajustes del sistema',
    roles: ['admin'],
  },
  {
    id: 'profile',
    label: 'Mi Perfil',
    path: ROUTES.PROFILE,
    icon: UserCircle,
    description: 'Datos y preferencias',
    roles: ['admin', 'user'],
  },
]
