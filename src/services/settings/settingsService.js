import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { COLLECTIONS, BENEFITS } from '@/constants/app'

const SETTINGS_DOC_ID = 'salon'

function settingsRef() {
  return doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOC_ID)
}

export async function getSettings() {
  const snap = await getDoc(settingsRef())
  if (!snap.exists()) return {}
  return snap.data()
}

export async function getBenefitsSettings() {
  const snap = await getDoc(settingsRef())
  if (!snap.exists()) {
    return {
      enabled: true,
      rewardEveryVisits: BENEFITS.DEFAULT_REWARD_EVERY_VISITS,
      rewardType: BENEFITS.REWARD_TYPE,
      rewardDescription: BENEFITS.REWARD_DESCRIPTION,
      showProgress: true,
    }
  }

  const data = snap.data()
  const benefitsProgram = data.loyaltyProgram || {}
  return {
    enabled: benefitsProgram.enabled ?? true,
    rewardEveryVisits: benefitsProgram.rewardEveryVisits ?? BENEFITS.DEFAULT_REWARD_EVERY_VISITS,
    rewardIncrement: benefitsProgram.rewardIncrement ?? BENEFITS.DEFAULT_REWARD_INCREMENT,
    rewardType: benefitsProgram.rewardType ?? BENEFITS.REWARD_TYPE,
    rewardDescription: benefitsProgram.rewardDescription ?? BENEFITS.REWARD_DESCRIPTION,
    showProgress: benefitsProgram.showProgress ?? true,
  }
}

export async function updateSettings(data) {
  const ref = settingsRef()
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  } else {
    await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  }
}

export async function updateBenefitsSettings(config) {
  const ref = settingsRef()
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, {
      loyaltyProgram: config,
      updatedAt: serverTimestamp(),
    })
  } else {
    await setDoc(ref, {
      loyaltyProgram: config,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}
