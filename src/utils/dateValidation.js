import { USER_ROLES } from '@/constants/app'

/**
 * Valida si un usuario puede agendar un turno en la fecha/hora especificada.
 *
 * Regla de negocio:
 * - Los Administradores pueden crear turnos en cualquier momento
 *   (pasado, presente o futuro) sin restricciones.
 * - Los usuarios normales NO pueden crear turnos en el pasado
 *   (día anterior u hora ya vencida del día actual).
 *
 * @param {string|Date|{toDate?: Function}} dateInput - Fecha del turno
 *   (string "yyyy-MM-dd", Date, o Timestamp de Firestore con .toDate())
 * @param {string} [timeInput] - Hora del turno en formato "HH:mm" (opcional)
 * @param {string} userRole - Rol del usuario: 'admin' | 'user'
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateAppointmentDateTime(dateInput, timeInput, userRole) {
  // Los administradores no tienen restricciones de fecha/hora
  if (userRole === USER_ROLES.ADMIN) {
    return { valid: true }
  }

  // Convertir la entrada a un objeto Date
  let appointmentDate

  if (typeof dateInput === 'string') {
    const [year, month, day] = dateInput.split('-').map(Number)
    appointmentDate = new Date(year, month - 1, day)
  } else if (dateInput instanceof Date) {
    appointmentDate = new Date(dateInput)
  } else if (dateInput?.toDate) {
    appointmentDate = dateInput.toDate()
  } else {
    return { valid: false, message: 'Fecha inválida' }
  }

  // Aplicar la hora si se proporciona
  if (timeInput) {
    const [hours, minutes] = timeInput.split(':').map(Number)
    if (!isNaN(hours) && !isNaN(minutes)) {
      appointmentDate.setHours(hours, minutes, 0, 0)
    }
  }

  const now = new Date()

  if (appointmentDate < now) {
    return {
      valid: false,
      message: 'No se pueden agendar turnos en el pasado',
    }
  }

  return { valid: true }
}
