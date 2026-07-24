import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { COLLECTIONS, APPOINTMENT_STATUS } from '@/constants/app'

export const DEFAULT_SCHEDULE_SETTINGS = {
  openingTime: '07:00',
  closingTime: '19:00',
  slotInterval: 30,
  minimumAppointmentDuration: 30,
  timezone: 'America/Asuncion'
}

/**
 * Fetches the global schedule settings from Firestore.
 */
export async function getScheduleSettings() {
  try {
    const ref = doc(db, COLLECTIONS.SETTINGS, 'business')
    const snap = await getDoc(ref)
    if (snap.exists()) {
      return { ...DEFAULT_SCHEDULE_SETTINGS, ...snap.data() }
    }
  } catch (error) {
    console.error('Error fetching schedule settings:', error)
  }
  return DEFAULT_SCHEDULE_SETTINGS
}

/**
 * Updates the global schedule settings in Firestore.
 */
export async function updateScheduleSettings(settingsData) {
  const ref = doc(db, COLLECTIONS.SETTINGS, 'business')
  await setDoc(ref, {
    ...settingsData,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

/**
 * Converts "HH:mm" time string to minutes since midnight.
 */
export function toMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

/**
 * Generates an array of time slots based on configuration.
 */
export function generateTimeSlots(openingTime, closingTime, interval) {
  const slots = []
  const startMin = toMinutes(openingTime)
  const endMin = toMinutes(closingTime)
  
  for (let m = startMin; m < endMin; m += interval) {
    const h = Math.floor(m / 60)
    const min = m % 60
    const label = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    slots.push({ start: label, startMin: m })
  }
  return slots
}

/**
 * Checks if a specific time slot is occupied by an appointment.
 */
export function calculateOccupiedSlots(appointment, slotStartMin, slotEndMin) {
  if (!appointment.time || appointment.duration == null) return false
  const NON_BLOCKING_STATUSES = [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.NO_SHOW]
  if (NON_BLOCKING_STATUSES.includes(appointment.status)) return false
  
  const aptStart = toMinutes(appointment.time)
  // Use minimum duration or actual duration
  const safeDuration = Math.max(1, Math.min(Number(appointment.duration) || 60, 720))
  const aptEnd = aptStart + safeDuration
  
  return aptStart < slotEndMin && aptEnd > slotStartMin
}

/**
 * Checks if a service can be booked at a specific time.
 */
export function checkAvailability(time, durationMinutes, existingAppointments, settings, excludeId = null) {
  const newStart = toMinutes(time)
  const safeNewDuration = Math.max(settings.minimumAppointmentDuration, Number(durationMinutes) || 60)
  const newEnd = newStart + safeNewDuration
  const closingMin = toMinutes(settings.closingTime)
  const openingMin = toMinutes(settings.openingTime)

  // Validate business hours
  if (newStart < openingMin || newEnd > closingMin) {
    return false
  }

  const NON_BLOCKING_STATUSES = [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.NO_SHOW]

  const hasConflict = existingAppointments.some((apt) => {
    if (excludeId && apt.id === excludeId) return false
    if (NON_BLOCKING_STATUSES.includes(apt.status)) return false
    if (!apt.time) return false

    const aptStart = toMinutes(apt.time)
    const safeAptDuration = Math.max(1, Number(apt.duration) || 60) // Don't enforce minimum duration strictly for existing appointments just in case
    const aptEnd = aptStart + safeAptDuration

    // Standard interval overlap check
    return newStart < aptEnd && newEnd > aptStart
  })

  return !hasConflict
}

/**
 * Returns an array of available time slots for a given service duration.
 */
export function getAvailableAppointments(durationMinutes, existingAppointments, settings) {
  const slots = generateTimeSlots(settings.openingTime, settings.closingTime, settings.slotInterval)
  
  return slots.filter(slot => {
    return checkAvailability(slot.start, durationMinutes, existingAppointments, settings)
  })
}
