import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { COLLECTIONS } from '@/constants/app'

const servicesRef = () => collection(db, COLLECTIONS.SERVICES)

/**
 * Get all active services. Public read (no auth required).
 * @returns {Promise<Array>}
 */
export async function getServices() {
  // We use only 'where' and sort locally to avoid requiring a Firebase composite index
  const q = query(servicesRef(), where('active', '==', true))
  const snap = await getDocs(q)
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  
  return docs.sort((a, b) => {
    // Sort by category first, then by name
    const catA = a.categoryName || ''
    const catB = b.categoryName || ''
    if (catA !== catB) return catA.localeCompare(catB)
    const nameA = a.name?.toLowerCase() || ''
    const nameB = b.name?.toLowerCase() || ''
    return nameA.localeCompare(nameB)
  })
}

/**
 * Get active services for a specific category.
 * @param {string} categoryId
 * @returns {Promise<Array>}
 */
export async function getServicesByCategory(categoryId) {
  const all = await getServices()
  return all.filter((s) => s.categoryId === categoryId)
}

/**
 * Get ALL services (active + inactive). Admin use.
 * @returns {Promise<Array>}
 */
export async function getAllServices() {
  const q = query(servicesRef(), orderBy('name', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Get a single service by ID.
 * @param {string} id
 */
export async function getServiceById(id) {
  const ref = doc(db, COLLECTIONS.SERVICES, id)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Create a new service. Admin only (enforced by Firestore rules).
 * @param {Object} data
 * @returns {Promise<string>} new document ID
 */
export async function createService(data) {
  const payload = {
    name: data.name,
    description: data.description ?? '',
    price: Number(data.price),
    duration: Number(data.duration), // minutes
    categoryId: data.categoryId ?? '',
    categoryName: data.categoryName ?? '',
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = await addDoc(servicesRef(), payload)
  return ref.id
}

/**
 * Update an existing service. Admin only.
 * @param {string} id
 * @param {Object} data
 */
export async function updateService(id, data) {
  const ref = doc(db, COLLECTIONS.SERVICES, id)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

/**
 * Toggle the active state of a service.
 * @param {string} id
 * @param {boolean} active
 */
export async function toggleServiceActive(id, active) {
  return updateService(id, { active })
}

/**
 * Delete a service. Admin only.
 * @param {string} id
 */
export async function deleteService(id) {
  const ref = doc(db, COLLECTIONS.SERVICES, id)
  await deleteDoc(ref)
}
