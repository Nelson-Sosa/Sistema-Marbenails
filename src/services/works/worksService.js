/**
 * Works Service — Firestore CRUD for the `works` collection.
 *
 * Each work document represents a completed nail design, linked to
 * an appointment via `appointmentId`. Images are stored in Cloudinary;
 * only `publicId` and `secureUrl` references are saved in Firestore.
 *
 * Collection structure:
 * works/{workId} → {
 *   appointmentId, clientId, serviceId, serviceName,
 *   categoryId, categoryName, title, description,
 *   photos: [{ publicId, secureUrl }],
 *   published, createdAt, updatedAt
 * }
 */

import {
  collection,
  doc,
  getDocs,
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

const worksRef = () => collection(db, COLLECTIONS.WORKS)

/**
 * Create a new work document.
 * @param {Object} data
 * @param {string} data.appointmentId
 * @param {string} data.clientId
 * @param {string} data.serviceId
 * @param {string} data.serviceName
 * @param {string} [data.categoryId]
 * @param {string} [data.categoryName]
 * @param {string} data.title
 * @param {string} [data.description]
 * @param {Array<{publicId: string, secureUrl: string}>} data.photos
 * @param {boolean} [data.published]
 * @returns {Promise<string>} New document ID
 */
export async function createWork(data) {
  const payload = {
    type: data.type || 'client', // 'client' | 'portfolio'
    appointmentId: data.appointmentId || null,
    clientId: data.clientId || null,
    serviceId: data.serviceId,
    serviceName: data.serviceName ?? '',
    categoryId: data.categoryId ?? '',
    categoryName: data.categoryName ?? '',
    title: data.title.trim(),
    description: data.description?.trim() ?? '',
    photos: data.photos ?? [],
    published: data.published ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const ref = await addDoc(worksRef(), payload)
  return ref.id
}

/**
 * Get ALL works (admin view). Ordered by creation date descending.
 * @returns {Promise<Array>}
 */
export async function getAllWorks() {
  // Sort locally to avoid requiring a composite Firestore index
  const snap = await getDocs(worksRef())
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => {
    const tA = a.createdAt?.seconds ?? 0
    const tB = b.createdAt?.seconds ?? 0
    return tB - tA
  })
}

/**
 * Get only published works for the public gallery.
 * @returns {Promise<Array>}
 */
export async function getPublishedWorks() {
  const q = query(worksRef(), where('published', '==', true))
  const snap = await getDocs(q)
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => {
    const tA = a.createdAt?.seconds ?? 0
    const tB = b.createdAt?.seconds ?? 0
    return tB - tA
  })
}

/**
 * Get all works for a specific client (including private ones for that client).
 * @param {string} clientId
 * @returns {Promise<Array>}
 */
export async function getWorksByClient(clientId) {
  const q = query(worksRef(), where('clientId', '==', clientId))
  const snap = await getDocs(q)
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => {
    const tA = a.createdAt?.seconds ?? 0
    const tB = b.createdAt?.seconds ?? 0
    return tB - tA
  })
}

/**
 * Update a work document (edit title, description, published state).
 * @param {string} id - Work document ID
 * @param {Object} data - Fields to update
 */
export async function updateWork(id, data) {
  const ref = doc(db, COLLECTIONS.WORKS, id)
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Toggle the published state of a work.
 * @param {string} id
 * @param {boolean} published
 */
export async function toggleWorkPublished(id, published) {
  return updateWork(id, { published })
}

/**
 * Delete a work document from Firestore.
 * NOTE: This does NOT delete images from Cloudinary.
 * Cloudinary cleanup requires API Secret — to be handled via Cloud Functions.
 * @param {string} id
 */
export async function deleteWork(id) {
  const ref = doc(db, COLLECTIONS.WORKS, id)
  await deleteDoc(ref)
}
