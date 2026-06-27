import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { COLLECTIONS, APPOINTMENT_STATUS, DEFAULT_PROFESSIONAL_ID } from '@/constants/app'
import { NOTIFICATION_TYPES } from '@/constants/notifications'
import { createIncomeEntry } from '@/services/income/incomeService'
import { createNotification } from '@/services/notifications/notificationsService'
import { processCompletedVisit } from '@/services/benefits/benefitsService'

const appointmentsRef = () => collection(db, COLLECTIONS.APPOINTMENTS)

/**
 * Get all appointments for a specific date.
 * @param {Date} date
 * @returns {Promise<Array>}
 */
export async function getAppointmentsByDate(date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const q = query(
    appointmentsRef(),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    orderBy('date', 'asc')
  )

  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Get appointments within a date range.
 * @param {Date} start
 * @param {Date} end
 * @returns {Promise<Array>}
 */
export async function getAppointmentsByDateRange(start, end) {
  const startTs = Timestamp.fromDate(start)
  const endTs = Timestamp.fromDate(end)

  const q = query(
    appointmentsRef(),
    where('date', '>=', startTs),
    where('date', '<=', endTs),
    orderBy('date', 'asc')
  )

  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Create a new appointment.
 * @param {Object} data
 * @returns {Promise<string>} new document ID
 */
export async function createAppointment(data) {
  const [hours, minutes] = data.time.split(':').map(Number)
  const preciseDate = data.date instanceof Date ? new Date(data.date) : new Date(data.date)
  preciseDate.setHours(hours, minutes, 0, 0)

  const payload = {
    clientId: data.clientId,
    serviceId: data.serviceId,
    professionalId: data.professionalId ?? DEFAULT_PROFESSIONAL_ID,
    date: Timestamp.fromDate(preciseDate),
    time: data.time,
    duration: data.duration,
    price: data.price,
    status: APPOINTMENT_STATUS.PENDING,
    clientName: data.clientName ?? '',
    serviceName: data.serviceName ?? '',
    notes: data.notes ?? '',
    clientPhone: data.clientPhone ?? null,
    reminderSent: false,
    reminderSentAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const ref = await addDoc(appointmentsRef(), payload)

  // If already done on creation (edge-case), register income
  if (payload.status === APPOINTMENT_STATUS.DONE) {
    await createIncomeEntry({ id: ref.id, ...payload })
  }

  createNotification({
    title: 'Nuevo turno',
    message: `${payload.clientName} reservó ${payload.serviceName}`,
    type: NOTIFICATION_TYPES.APPOINTMENT_CREATED,
    entityId: ref.id,
    entityType: 'appointment',
  })

  return ref.id
}

/**
 * Update the status of an appointment.
 * When status changes to 'done', creates an income entry automatically.
 * @param {string} id - Appointment ID
 * @param {string} newStatus
 * @param {Object} [extraData] - Optional extra fields to update
 */
export async function updateAppointmentStatus(id, newStatus, extraData = {}) {
  const ref = doc(db, COLLECTIONS.APPOINTMENTS, id)

  await updateDoc(ref, {
    status: newStatus,
    updatedAt: serverTimestamp(),
    ...extraData,
  })

  // Auto-register income when appointment is completed
  if (newStatus === APPOINTMENT_STATUS.DONE) {
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = { id: snap.id, ...snap.data() }
      await createIncomeEntry(data)
      // Benefits: process completed visit (atomic visit count + reward check)
      if (data.clientId) {
        await processCompletedVisit(data.clientId, snap.id)
      }
    }
  }

  // Create notification on cancellation
  if (newStatus === APPOINTMENT_STATUS.CANCELLED) {
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data()
      createNotification({
        title: 'Turno cancelado',
        message: `${data.clientName || 'Un cliente'} canceló su turno`,
        type: NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
        entityId: id,
        entityType: 'appointment',
      })
    }
  }
}

/**
 * Update appointment details (date, time, service).
 * @param {string} id - Appointment ID
 * @param {Object} data - Properties to update
 */
export async function updateAppointmentDetails(id, data) {
  const ref = doc(db, COLLECTIONS.APPOINTMENTS, id)

  // Fetch current data before update for notification context
  const beforeSnap = await getDoc(ref)
  const beforeData = beforeSnap.exists() ? beforeSnap.data() : null

  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  }

  // Ensure date is a Timestamp if provided as Date
  if (payload.date && payload.date instanceof Date) {
    payload.date = Timestamp.fromDate(payload.date)
  }

  await updateDoc(ref, payload)

  if (beforeData) {
    createNotification({
      title: 'Turno actualizado',
      message: `Se modificó un turno de ${beforeData.clientName || 'un cliente'}`,
      type: NOTIFICATION_TYPES.APPOINTMENT_UPDATED,
      entityId: id,
      entityType: 'appointment',
    })
  }
}

/**
 * Cancel an appointment.
 * @param {string} id
 */
export async function cancelAppointment(id) {
  return updateAppointmentStatus(id, APPOINTMENT_STATUS.CANCELLED)
}

/**
 * Get a single appointment by ID.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getAppointmentById(id) {
  const ref = doc(db, COLLECTIONS.APPOINTMENTS, id)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Get all appointments for a specific client.
 * @param {string} clientId
 * @returns {Promise<Array>}
 */
export async function getAppointmentsByClient(clientId) {
  // We use only 'where' and sort locally to avoid requiring a Firebase composite index
  const q = query(
    appointmentsRef(),
    where('clientId', '==', clientId)
  )
  const snap = await getDocs(q)
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

  return docs.sort((a, b) => {
    const timeA = a.date?.seconds || 0
    const timeB = b.date?.seconds || 0
    if (timeA === timeB) {
      // Secondary sort by time string descending
      return (b.time || '').localeCompare(a.time || '')
    }
    return timeB - timeA // Descending date
  })
}

/**
 * Check whether a new appointment would conflict with an existing one.
 *
 * A conflict exists when two appointments on the same day have overlapping
 * time windows (considering each appointment's duration).
 * Cancelled and no_show appointments are ignored.
 *
 * @param {Date}   date            - The appointment date (any time component is ignored)
 * @param {string} time            - Start time in "HH:mm" format
 * @param {number} durationMinutes - Duration of the new appointment in minutes
 * @param {string} [excludeId]     - Appointment ID to exclude (used when editing)
 * @returns {Promise<boolean>}     - true if a conflict is found
 */
export async function checkAppointmentConflict(date, time, durationMinutes, excludeId = null) {
  const existing = await getAppointmentsByDate(date)

  const NON_CONFLICTING_STATUSES = [
    APPOINTMENT_STATUS.CANCELLED,
    APPOINTMENT_STATUS.NO_SHOW,
  ]

  // Convert "HH:mm" to minutes since midnight
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const newStart = toMinutes(time)
  const newEnd   = newStart + (durationMinutes || 60)

  return existing.some((apt) => {
    // Skip the appointment being edited
    if (excludeId && apt.id === excludeId) return false
    // Skip cancelled / no-show — they no longer occupy the slot
    if (NON_CONFLICTING_STATUSES.includes(apt.status)) return false
    // Skip appointments without a parseable time
    if (!apt.time) return false

    const aptStart = toMinutes(apt.time)
    const aptEnd   = aptStart + (apt.duration || 60)

    // Standard interval overlap check: [newStart, newEnd) ∩ [aptStart, aptEnd) ≠ ∅
    return newStart < aptEnd && newEnd > aptStart
  })
}

