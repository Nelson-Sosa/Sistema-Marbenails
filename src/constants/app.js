/**
 * Global application constants.
 * Centralize app-wide configuration values here.
 */

export const APP_NAME = 'Marbenails'
export const APP_TAGLINE = 'Gestión de Salón de Belleza'
export const APP_VERSION = '1.0.0'

/** Default pagination page size */
export const PAGE_SIZE = 10

/** Appointment status values — 'done' is the official final state and income trigger */
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  /** @deprecated Use DONE instead */
  COMPLETED: 'done',
}

/** Status display config (label + Badge variant) — used by StatusMenu, Dashboard, etc. */
export const STATUS_CONFIG = {
  [APPOINTMENT_STATUS.PENDING]: { label: 'Pendiente', variant: 'default' },
  [APPOINTMENT_STATUS.CONFIRMED]: { label: 'Confirmado', variant: 'info' },
  [APPOINTMENT_STATUS.IN_PROGRESS]: { label: 'En proceso', variant: 'primary' },
  [APPOINTMENT_STATUS.DONE]: { label: 'Completado', variant: 'success' },
  [APPOINTMENT_STATUS.CANCELLED]: { label: 'Cancelado', variant: 'danger' },
  [APPOINTMENT_STATUS.NO_SHOW]: { label: 'No asistió', variant: 'warning' },
}

/** User roles — ready for multi-tenant / SaaS expansion */
export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  VIEWER: 'viewer',
}

/** Supported payment methods */
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
  MP: 'mercado_pago',
}

/** Date/time formats used across the app */
export const DATE_FORMAT = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_LONG: 'EEEE d \'de\' MMMM',
  TIME: 'HH:mm',
  FULL: 'dd/MM/yyyy HH:mm',
}

/** WhatsApp integration — placeholders for future integration */
export const WHATSAPP = {
  ENABLED: false,
  API_URL: 'https://api.whatsapp.com/send',
}

/** Firebase collection names — single source of truth */
export const COLLECTIONS = {
  USERS: 'users',
  APPOINTMENTS: 'appointments',
  CLIENTS: 'clients',
  SERVICES: 'services',
  SERVICE_CATEGORIES: 'serviceCategories',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  INCOME: 'income',
  LOYALTY_HISTORY: 'loyaltyHistory',
  WORKS: 'works',
}

/** Default professional ID for MVP mono-professional mode */
export const DEFAULT_PROFESSIONAL_ID = 'default'

/** Benefits Program — visit-based rewards */
export const BENEFITS = {
  DEFAULT_REWARD_EVERY_VISITS: 10,
  DEFAULT_REWARD_INCREMENT: 10,
  REWARD_TYPE: 'free_service',
  REWARD_DESCRIPTION: 'Servicio gratuito',
}

/** Phase 2 — WhatsApp trigger types (not implemented) */
export const WHATSAPP_TRIGGERS = {
  REMINDER_24H: 'reminder_24h',
  CONFIRMATION: 'confirmation',
  CANCELLATION: 'cancellation',
  BIRTHDAY: 'birthday',
}

/** Business hours constraints */
export const BUSINESS_HOURS = {
  START: '07:00',
  END: '20:00',
  DAYS: [0, 1, 2, 3, 4, 5, 6], // 0 = Sunday, 1 = Monday, etc.
}
