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
import { NOTIFICATION_TYPES } from '@/constants/notifications'
import { createNotification } from '@/services/notifications/notificationsService'

const clientsRef = () => collection(db, COLLECTIONS.CLIENTS)
const usersRef = () => collection(db, COLLECTIONS.USERS)

/**
 * Get all clients, merging manual clients and registered users.
 * @returns {Promise<Array>}
 */
export async function getClients() {
  const [clientsSnap, usersSnap] = await Promise.all([
    getDocs(query(clientsRef())), // Firebase limitation: can't order and merge locally easily without fetching all
    getDocs(query(usersRef(), where('role', '==', 'user')))
  ])

  const manualClients = clientsSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      isRegisteredUser: false,
      name: data.name || '',
      phone: data.phone || '',
      whatsapp: data.whatsapp || '',
      notes: data.notes || '',
      totalVisits: data.totalVisits || 0,
      whatsappOptIn: data.whatsappOptIn ?? false,
      phoneVerified: data.phoneVerified ?? false,
      remindersEnabled: data.remindersEnabled ?? false,
      createdAt: data.createdAt,
    }
  })

  const registeredUsers = usersSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id, // Auth UID
      isRegisteredUser: true,
      name: data.displayName || data.email?.split('@')[0] || 'Usuario Registrado',
      phone: data.phone || '',
      whatsapp: data.phone || '', // fallback to phone
      notes: data.notes || '', 
      totalVisits: data.totalVisits || 0,
      whatsappOptIn: data.whatsappOptIn ?? false,
      phoneVerified: data.phoneVerified ?? false,
      remindersEnabled: data.remindersEnabled ?? false,
      email: data.email,
      createdAt: data.createdAt,
    }
  })

  // Merge and sort alphabetically
  const all = [...manualClients, ...registeredUsers].sort((a, b) => {
    const nameA = a.name?.toLowerCase() || ''
    const nameB = b.name?.toLowerCase() || ''
    return nameA.localeCompare(nameB)
  })

  return all
}

/**
 * Get a single client by ID (checks users first, then clients).
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getClientById(id) {
  // Check users collection first
  const userRef = doc(db, COLLECTIONS.USERS, id)
  const userSnap = await getDoc(userRef)
  
  if (userSnap.exists() && userSnap.data().role === 'user') {
    const data = userSnap.data()
    return {
      id: userSnap.id,
      isRegisteredUser: true,
      name: data.displayName || data.email?.split('@')[0] || 'Usuario Registrado',
      phone: data.phone || '',
      whatsapp: data.phone || '',
      notes: data.notes || '',
      totalVisits: data.totalVisits || 0,
      whatsappOptIn: data.whatsappOptIn ?? false,
      phoneVerified: data.phoneVerified ?? false,
      remindersEnabled: data.remindersEnabled ?? false,
      email: data.email,
      createdAt: data.createdAt,
    }
  }

  // Fallback to manual clients
  const clientRef = doc(db, COLLECTIONS.CLIENTS, id)
  const clientSnap = await getDoc(clientRef)
  
  if (clientSnap.exists()) {
    const data = clientSnap.data()
    return {
      id: clientSnap.id,
      isRegisteredUser: false,
      name: data.name || '',
      phone: data.phone || '',
      whatsapp: data.whatsapp || '',
      notes: data.notes || '',
      totalVisits: data.totalVisits || 0,
      whatsappOptIn: data.whatsappOptIn ?? false,
      phoneVerified: data.phoneVerified ?? false,
      remindersEnabled: data.remindersEnabled ?? false,
      createdAt: data.createdAt,
    }
  }

  return null
}

/**
 * Create a new manual client.
 * (Registered users are created automatically via Auth).
 * @param {Object} data
 * @returns {Promise<string>} new document ID
 */
export async function createClient(data) {
  const payload = {
    name: data.name,
    phone: data.phone ?? '',
    whatsapp: data.whatsapp ?? data.phone ?? '',
    notes: data.notes ?? '',
    totalVisits: 0,
    whatsappOptIn: !!data.whatsappOptIn,
    phoneVerified: !!data.phoneVerified,
    remindersEnabled: !!data.remindersEnabled,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = await addDoc(clientsRef(), payload)

  createNotification({
    title: 'Nuevo cliente',
    message: `Se registró ${payload.name}`,
    type: NOTIFICATION_TYPES.CLIENT_CREATED,
    entityId: ref.id,
    entityType: 'client',
  })

  return ref.id
}

/**
 * Update an existing client or user profile.
 * @param {string} id
 * @param {Object} data
 */
export async function updateClient(id, data) {
  const userRef = doc(db, COLLECTIONS.USERS, id)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    // Map UI fields back to User collection schema
    const payload = {
      displayName: data.name,
      phone: data.phone?.trim() || null,
      notes: data.notes || '',
      whatsappOptIn: !!data.whatsappOptIn,
      phoneVerified: !!data.phoneVerified,
      remindersEnabled: !!data.remindersEnabled,
      updatedAt: serverTimestamp()
    }
    await updateDoc(userRef, payload)
  } else {
    // Update manual client
    const clientRef = doc(db, COLLECTIONS.CLIENTS, id)
    await updateDoc(clientRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  }
}

/**
 * Increment totalVisits counter.
 * @param {string} id
 */
export async function incrementClientVisits(id) {
  if (!id) return
  
  const userRef = doc(db, COLLECTIONS.USERS, id)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    const current = userSnap.data().totalVisits ?? 0
    await updateDoc(userRef, { totalVisits: current + 1, updatedAt: serverTimestamp() })
  } else {
    const clientRef = doc(db, COLLECTIONS.CLIENTS, id)
    const clientSnap = await getDoc(clientRef)
    if (clientSnap.exists()) {
      const current = clientSnap.data().totalVisits ?? 0
      await updateDoc(clientRef, { totalVisits: current + 1, updatedAt: serverTimestamp() })
    }
  }
}

/**
 * Search clients by name prefix across both collections.
 * @param {string} searchQuery
 * @returns {Promise<Array>}
 */
export async function searchClients(searchQuery) {
  const all = await getClients()
  const lower = searchQuery.toLowerCase().trim()
  if (!lower) return all
  return all.filter(
    (c) =>
      c.name?.toLowerCase().includes(lower) ||
      c.phone?.includes(lower) ||
      c.whatsapp?.includes(lower) ||
      c.email?.toLowerCase().includes(lower)
  )
}
