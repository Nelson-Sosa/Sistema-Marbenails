import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { COLLECTIONS } from '@/constants/app'

/**
 * Update a user's editable profile fields in Firestore.
 * The user can only edit their own doc (enforced by Firestore rules).
 * Fields NOT allowed to be changed here: role, phoneVerified, createdAt, uid, email.
 *
 * @param {string} uid
 * @param {{ displayName: string, phone: string|null, whatsappOptIn: boolean }} data
 * @returns {Promise<void>}
 */
export async function updateUserProfile(uid, data) {
  const ref = doc(db, COLLECTIONS.USERS, uid)

  const phone = data.phone?.trim() || null

  const payload = {
    displayName: data.displayName?.trim() || '',
    phone,
    whatsappOptIn: !!data.whatsappOptIn,
    // If phone is set, honor the opt-in. Otherwise reminders can't be sent.
    remindersEnabled: phone ? !!data.whatsappOptIn : false,
    updatedAt: serverTimestamp(),
  }

  if (data.systemNotifications !== undefined) {
    payload.systemNotifications = !!data.systemNotifications
  }
  if (data.importantAlerts !== undefined) {
    payload.importantAlerts = !!data.importantAlerts
  }

  await updateDoc(ref, payload)
}

/**
 * Update a user's profile by an admin.
 * Admin can additionally set phoneVerified and remindersEnabled directly.
 *
 * @param {string} uid
 * @param {{ phone: string|null, whatsappOptIn: boolean, phoneVerified: boolean, remindersEnabled: boolean }} data
 * @returns {Promise<void>}
 */
export async function adminUpdateUserProfile(uid, data) {
  const ref = doc(db, COLLECTIONS.USERS, uid)

  const phone = data.phone?.trim() || null

  await updateDoc(ref, {
    phone,
    whatsappOptIn: !!data.whatsappOptIn,
    phoneVerified: !!data.phoneVerified,
    remindersEnabled: phone ? !!data.remindersEnabled : false,
    updatedAt: serverTimestamp(),
  })
}
