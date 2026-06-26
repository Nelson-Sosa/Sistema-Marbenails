import {
  doc, getDoc, updateDoc, addDoc, collection, query, where,
  getDocs, orderBy, limit, runTransaction, Timestamp, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { COLLECTIONS, BENEFITS } from '@/constants/app'
import { getBenefitsSettings } from '@/services/settings/settingsService'

/**
 * Process a completed visit for the benefits program.
 * Called when an appointment transitions to status "done".
 * - Marks the appointment as processed (prevents double-processing)
 * - Reads the client's current totalVisits (already incremented by incomeService)
 * - If totalVisits >= nextRewardAt, grants a free service
 * - Records everything atomically in a transaction
 *
 * @param {string} clientId
 * @param {string} appointmentId
 * @returns {Promise<{rewardGranted: boolean, currentVisits: number, nextRewardAt: number, freeServices: number}|null>}
 */
export async function processCompletedVisit(clientId, appointmentId) {
  if (!clientId || !appointmentId) return null

  const benefitsSettings = await getBenefitsSettings()
  if (!benefitsSettings.enabled) return null

  const rewardEvery = benefitsSettings.rewardEveryVisits
  const rewardIncrement = benefitsSettings.rewardIncrement || rewardEvery

  const appointmentRef = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId)

  try {
    return await runTransaction(db, async (transaction) => {
      const apptSnap = await transaction.get(appointmentRef)
      if (!apptSnap.exists()) return null
      if (apptSnap.data().visitProcessed) return null

      const userRef = doc(db, COLLECTIONS.USERS, clientId)
      const userSnap = await transaction.get(userRef)
      let clientRef, clientData
      if (userSnap.exists()) {
        clientRef = userRef
        clientData = userSnap.data()
      } else {
        clientRef = doc(db, COLLECTIONS.CLIENTS, clientId)
        const clientSnap = await transaction.get(clientRef)
        if (!clientSnap.exists()) return null
        clientData = clientSnap.data()
      }

      const currentVisits = clientData.totalVisits ?? 0
      let freeServices = clientData.freeServices ?? 0
      let nextRewardAt = clientData.nextRewardAt ?? rewardEvery
      let lastRewardAt = clientData.lastRewardAt ?? null
      let rewardGranted = false

      if (currentVisits >= nextRewardAt) {
        freeServices += 1
        lastRewardAt = Timestamp.now()
        nextRewardAt = nextRewardAt + rewardIncrement
        rewardGranted = true
      }

      transaction.update(clientRef, {
        freeServices,
        nextRewardAt,
        lastRewardAt,
        updatedAt: serverTimestamp(),
      })

      transaction.update(appointmentRef, { visitProcessed: true })

      const historyRef = doc(collection(db, COLLECTIONS.LOYALTY_HISTORY))
      transaction.set(historyRef, {
        clientId,
        appointmentId,
        type: 'visit',
        visitNumber: currentVisits,
        rewardType: rewardGranted ? 'free_service' : null,
        rewardGranted,
        earnedAt: Timestamp.now(),
        redeemed: false,
        redeemedAt: null,
        redeemedBy: null,
      })

      return { rewardGranted, currentVisits, nextRewardAt, freeServices }
    })
  } catch (err) {
    console.error('[benefits] processCompletedVisit error:', err)
    return null
  }
}

/**
 * Redeem a free service for a client.
 * Deducts one free service and records the redemption in history.
 *
 * @param {string} clientId
 * @param {string} adminUid
 * @returns {Promise<{success: boolean}>}
 */
export async function redeemFreeService(clientId, adminUid) {
  if (!clientId) return { success: false }

  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, COLLECTIONS.USERS, clientId)
      const userSnap = await transaction.get(userRef)
      let clientRef, clientData
      if (userSnap.exists()) {
        clientRef = userRef
        clientData = userSnap.data()
      } else {
        clientRef = doc(db, COLLECTIONS.CLIENTS, clientId)
        const clientSnap = await transaction.get(clientRef)
        if (!clientSnap.exists()) return { success: false }
        clientData = clientSnap.data()
      }

      if ((clientData.freeServices ?? 0) < 1) return { success: false }

      const newFreeServices = clientData.freeServices - 1

      transaction.update(clientRef, {
        freeServices: newFreeServices,
        updatedAt: serverTimestamp(),
      })

      const historyRef = doc(collection(db, COLLECTIONS.LOYALTY_HISTORY))
      transaction.set(historyRef, {
        clientId,
        appointmentId: null,
        type: 'redemption',
        visitNumber: clientData.totalVisits ?? 0,
        rewardType: 'free_service',
        rewardGranted: true,
        earnedAt: Timestamp.now(),
        redeemed: true,
        redeemedAt: Timestamp.now(),
        redeemedBy: adminUid || null,
      })

      return { success: true, freeServices: newFreeServices }
    })
  } catch (err) {
    console.error('[benefits] redeemFreeService error:', err)
    return { success: false }
  }
}

/**
 * Get benefits history for a client.
 * @param {string} clientId
 * @returns {Promise<Array>}
 */
export async function getBenefitsHistory(clientId) {
  if (!clientId) return []
  const ref = collection(db, COLLECTIONS.LOYALTY_HISTORY)
  const q = query(ref, where('clientId', '==', clientId), orderBy('earnedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Get the most recent benefits event for a client.
 * @param {string} clientId
 * @returns {Promise<Object|null>}
 */
export async function getLastBenefitsEvent(clientId) {
  if (!clientId) return null
  const ref = collection(db, COLLECTIONS.LOYALTY_HISTORY)
  const q = query(ref, where('clientId', '==', clientId), orderBy('earnedAt', 'desc'), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}
