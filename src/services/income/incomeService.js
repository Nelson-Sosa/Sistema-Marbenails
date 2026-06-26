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
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { COLLECTIONS } from '@/constants/app'
import { incrementClientVisits } from '@/services/clients/clientsService'

const incomeRef = () => collection(db, COLLECTIONS.INCOME)

/**
 * Create an income entry when an appointment is marked as 'done'.
 * This is automatically called by updateAppointmentStatus.
 * @param {Object} appointment - Full appointment object (including id)
 */
export async function createIncomeEntry(appointment) {
  await addDoc(incomeRef(), {
    appointmentId: appointment.id,
    amount: appointment.price ?? 0,
    date: appointment.date,
    serviceName: appointment.serviceName ?? '',
    serviceId: appointment.serviceId ?? '',
    clientName: appointment.clientName ?? '',
    clientId: appointment.clientId ?? '',
    createdAt: serverTimestamp(),
  })

  // Increment client visit count
  await incrementClientVisits(appointment.clientId)
}

/**
 * Get income entries within a date range.
 * @param {Date} start
 * @param {Date} end
 * @returns {Promise<Array>}
 */
export async function getIncomeByDateRange(start, end) {
  const { Timestamp } = await import('firebase/firestore')
  const q = query(
    incomeRef(),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    orderBy('date', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
