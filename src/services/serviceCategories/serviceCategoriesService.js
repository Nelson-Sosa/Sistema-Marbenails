import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { COLLECTIONS } from '@/constants/app'

const categoriesRef = () => collection(db, COLLECTIONS.SERVICE_CATEGORIES)

export async function getCategories() {
  const q = query(categoriesRef(), orderBy('order', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getActiveCategories() {
  const all = await getCategories()
  return all.filter((c) => c.active !== false)
}

export async function getCategoryById(id) {
  const ref = doc(db, COLLECTIONS.SERVICE_CATEGORIES, id)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createCategory(data) {
  const payload = {
    name: data.name,
    description: data.description ?? '',
    active: true,
    order: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = await addDoc(categoriesRef(), payload)
  return ref.id
}

export async function updateCategory(id, data) {
  const ref = doc(db, COLLECTIONS.SERVICE_CATEGORIES, id)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function toggleCategoryActive(id, active) {
  return updateCategory(id, { active })
}
