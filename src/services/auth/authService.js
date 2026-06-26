import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import { COLLECTIONS } from '@/constants/app'

// ─── Internal Helper: Firestore Sync ─────────────────────────────────────────

/**
 * Ensure a Firestore user document exists for the given Firebase user.
 *
 * Rules:
 * - If the doc already exists → return its data AS-IS (never overwrite role)
 * - If the doc does NOT exist → create it with role: 'user'
 *
 * This function is ONLY called after a successful sign-in, when the auth
 * token is guaranteed to be valid and available to Firestore.
 *
 * @param {import('firebase/auth').User} user
 * @returns {Promise<Object>} The Firestore user document data
 */
async function ensureUserDoc(user) {
  console.log(`[AUDIT TEMP] ensureUserDoc — INICIO. UID recibido: ${user.uid}`)
  const ref = doc(db, COLLECTIONS.USERS, user.uid)
  
  try {
    console.log('[AUDIT TEMP] ensureUserDoc — Intentando leer documento (getDoc)...')
    const snap = await getDoc(ref)
    console.log(`[AUDIT TEMP] ensureUserDoc — Resultado lectura: snap.exists() = ${snap.exists()}`)

    if (!snap.exists()) {
      console.log('[AUDIT TEMP] ensureUserDoc — Creando documento nuevo (setDoc)...')
    const profile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
      photoURL: user.photoURL || null,
      role: 'user',
      provider: user.providerData?.[0]?.providerId || 'password',
      // WhatsApp / contact fields (Phase 2 prep)
      phone: null,
      phoneVerified: false,
      whatsappOptIn: false,
      remindersEnabled: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await setDoc(ref, profile)
    console.log('[AUDIT] ensureUserDoc — setDoc completado')
  } else {
    console.log('[AUDIT] ensureUserDoc — Actualizando documento existente (updateDoc)')
    const updateData = {
      updatedAt: serverTimestamp(),
      // Optionally sync the latest provider info
      provider: user.providerData?.[0]?.providerId || snap.data().provider,
    }
    
    if (user.photoURL) updateData.photoURL = user.photoURL
    if (user.displayName) updateData.displayName = user.displayName

    console.log('[AUDIT TEMP] ensureUserDoc — Intentando actualizar documento (updateDoc)...')
    await updateDoc(ref, updateData)
    console.log('[AUDIT TEMP] ensureUserDoc — updateDoc completado con éxito')
  }
  } catch (error) {
    console.error('[AUDIT TEMP] ensureUserDoc — ERROR CAPTURADO (create/read users/{uid}):', {
      name: error.name,
      code: error.code,
      message: error.message,
      stack: error.stack
    })
    throw error // Re-throw to be caught by loginWithGoogle / LoginPage
  }
}

// ─── Public: Profile Read ─────────────────────────────────────────────────────

/**
 * Load the Firestore profile for a given UID.
 * READ-ONLY — never writes to Firestore.
 * Called by AuthContext after login or on session resume.
 *
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export async function loadUserProfile(uid) {
  const ref = doc(db, COLLECTIONS.USERS, uid)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

// ─── Email & Password Auth ────────────────────────────────────────────────────

/**
 * Sign in with email and password.
 * After sign-in, ensures the Firestore profile exists.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  await ensureUserDoc(credential.user)
  return credential
}

/**
 * Register a new user with email, password and display name.
 * Creates the Firestore profile document.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function registerWithEmail(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const { user } = credential

  await updateProfile(user, { displayName })

  await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: null,
    role: 'user',
    provider: 'password',
    // WhatsApp / contact fields (Phase 2 prep)
    phone: null,
    phoneVerified: false,
    whatsappOptIn: false,
    remindersEnabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return credential
}

// ─── Google Auth ──────────────────────────────────────────────────────────────

/**
 * Sign in with Google redirect.
 *
 * Redirect-based sign-in avoids Chromium's Cross-Origin-Opener-Policy (COOP)
 * issue that caused signInWithPopup to reject despite successful auth.
 *
 * Flow:
 * 1. This function calls signInWithRedirect, which navigates to Google's OAuth page
 * 2. After user authenticates, Google redirects back to the app
 * 3. On the redirected page, onAuthStateChanged fires with the authenticated user
 * 4. handleGoogleRedirect() must be called (from AuthContext) to consume the
 *    redirect result and ensure the Firestore user document exists
 *
 * @returns {Promise<void>} Resolves only if the redirect fails to start
 */
export async function loginWithGoogle() {
  console.log('[AUDIT TEMP] loginWithGoogle — Inicio login Google')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  
  try {
    console.log('[AUDIT TEMP] loginWithGoogle — Llamando a signInWithPopup...')
    const credential = await signInWithPopup(auth, provider)
    console.log('[AUDIT TEMP] loginWithGoogle — Resultado de signInWithPopup() OK, UID:', credential.user?.uid)
    
    console.log('[AUDIT TEMP] loginWithGoogle — Llamando a ensureUserDoc...')
    await ensureUserDoc(credential.user)
    console.log('[AUDIT TEMP] loginWithGoogle — ensureUserDoc finalizado OK')
    return credential
  } catch (error) {
    console.error('[AUDIT TEMP] loginWithGoogle — ERROR en signInWithPopup o ensureUserDoc:', {
      name: error.name,
      code: error.code,
      message: error.message,
      stack: error.stack
    })
    throw error
  }
}

/**
 * Consume the pending redirect result from a Google sign-in.
 *
 * Must be called on every app mount (from AuthContext) after onAuthStateChanged
 * fires. If there is a pending redirect result, it creates/updates the Firestore
 * user document via ensureUserDoc.
 *
 * Safe to call even when there is no pending redirect result (returns null).
 *
 * @returns {Promise<import('firebase/auth').UserCredential|null>}
 */
export async function handleGoogleRedirect() {
  console.log('[AUDIT] handleGoogleRedirect — INICIO')
  const credential = await getRedirectResult(auth)
  if (!credential) {
    console.log('[AUDIT] handleGoogleRedirect — sin resultado de redirect')
    return null
  }
  console.log('[AUDIT] handleGoogleRedirect — resultado obtenido, UID:', credential.user?.uid)
  await ensureUserDoc(credential.user)
  console.log('[AUDIT] handleGoogleRedirect — ensureUserDoc OK')
  return credential
}

// ─── Password Reset ───────────────────────────────────────────────────────────

/**
 * Send a password reset email.
 * @param {string} email
 */
export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email)
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

/**
 * Sign the current user out.
 */
export async function logout() {
  return signOut(auth)
}
