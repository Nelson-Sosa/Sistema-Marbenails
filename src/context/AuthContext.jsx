import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase/config'
import {
  loginWithEmail,
  loginWithGoogle,
  handleGoogleRedirect,
  registerWithEmail,
  resetPassword,
  logout as logoutService,
  loadUserProfile,
} from '@/services/auth/authService'

// ─── Context Definition ───────────────────────────────────────────────────────

/**
 * @typedef {Object} AuthContextValue
 * @property {import('firebase/auth').User|null} user
 * @property {Object|null} userProfile
 * @property {string|null} role - null while loading, 'user' or 'admin' when ready
 * @property {boolean} loadingRole
 * @property {boolean} loading
 * @property {boolean} isAuthenticated
 * @property {Function} login
 * @property {Function} loginWithGoogle
 * @property {Function} register
 * @property {Function} sendPasswordReset
 * @property {Function} logout
 * @property {Function} loadProfile - manually reload Firestore profile
 */

/** @type {import('react').Context<AuthContextValue>} */
const AuthContext = createContext(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * AuthProvider — manages Firebase auth state and Firestore user profile.
 *
 * Architecture:
 * - onAuthStateChanged: ONLY sets user state. Does NOT write to Firestore.
 * - loadProfile: reads the Firestore doc. Called after login actions complete,
 *   or on session resume (page refresh). If the doc doesn't exist on a page
 *   refresh, it logs a warning but does NOT crash the app.
 * - ensureUserDoc / write operations: ONLY called from login/register actions
 *   in authService, where the auth token is guaranteed to be ready.
 */
export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [loadingRole, setLoadingRole] = useState(true)

  // Track if the initial auth check is done to avoid double-loading on login
  const initialLoadDone = useRef(false)

  // ─── Load Firestore profile ─────────────────────────────────────────────────
  /**
   * Reads the Firestore profile for a Firebase user.
   * This is READ-ONLY — it never writes to Firestore.
   * Called both from onAuthStateChanged (session resume) and from login actions.
   */
  const loadProfile = useCallback(async (firebaseUser) => {
    console.log('[AUDIT TEMP AuthContext] loadProfile — INICIO. firebaseUser UID:', firebaseUser?.uid || null)
    if (!firebaseUser) {
      console.log('[AUDIT TEMP AuthContext] loadProfile — firebaseUser is null, limpiando perfil')
      setUserProfile(null)
      console.log('[AUDIT TEMP AuthContext] Estado: role=null, loadingRole=false')
      setLoadingRole(false)
      return
    }

    setLoadingRole(true)
    console.log('[AUDIT TEMP AuthContext] loadProfile — Estado: loadingRole=true')
    try {
      const profile = await loadUserProfile(firebaseUser.uid)
      console.log('[AUDIT TEMP AuthContext] loadProfile — Perfil obtenido de users/{uid}:', profile ? 'EXISTE' : 'NO EXISTE')
      if (profile) {
        console.log(`[AUDIT TEMP AuthContext] loadProfile — role cargado: ${profile.role}`)
      }
      setUserProfile(profile)
    } catch (err) {
      // Firestore permission error or network issue.
      // Fall back to null — the UI will treat this as role: 'user' (safe default).
      console.error('[AUDIT AuthContext] loadProfile — ERROR:', {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack,
      })
      setUserProfile(null)
    } finally {
      setLoadingRole(false)
      console.log('[AUDIT TEMP AuthContext] loadProfile — FINALIZADO. Estado: loadingRole=false')
    }
  }, [])

  // ─── Auth state listener ────────────────────────────────────────────────────
  useEffect(() => {
    console.log('[AUDIT TEMP AuthContext] Registrando onAuthStateChanged listener')
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AUDIT TEMP AuthContext] onAuthStateChanged — DISPARADO. Estado AuthContext: user UID:', firebaseUser?.uid || null)
      
      setUser(firebaseUser)

      if (!initialLoadDone.current) {
        // First mount: handle pending Google redirect result (if any)
        // and load the profile for a returning session.
        if (firebaseUser) {
          try {
            const redirectResult = await handleGoogleRedirect()
            if (redirectResult) {
              console.log('[AUDIT AuthContext] Redirect Google login completado, UID:', redirectResult.user?.uid)
            }
          } catch (err) {
            console.error('[AUDIT AuthContext] handleGoogleRedirect — ERROR:', {
              name: err.name,
              message: err.message,
              code: err.code,
              stack: err.stack,
            })
          }
        }
        console.log('[AUDIT TEMP AuthContext] onAuthStateChanged — Primera carga, llamando loadProfile')
        await loadProfile(firebaseUser)
        initialLoadDone.current = true
        console.log('[AUDIT TEMP AuthContext] onAuthStateChanged — initialLoadDone marcado como true')
      } else {
        // If not initial load, still need to load profile if user changed (e.g. login)
        // Actually login actions call loadProfile manually, so we skip it here to avoid race conditions.
      }

      setLoading(false)
      console.log('[AUDIT TEMP AuthContext] onAuthStateChanged — FINALIZADO. Estado de AuthContext: loading=false, isAuthenticated:', !!firebaseUser)
    })

    return () => {
      console.log('[AUDIT AuthContext] onAuthStateChanged — UNSUBSCRIBE')
      unsubscribe()
    }
  }, [loadProfile])

  // ─── Auth Actions ───────────────────────────────────────────────────────────

  /**
   * Email/password login.
   * Flow: signIn → ensureUserDoc (write if new) → loadProfile (read) → done
   */
  const login = useCallback(async (email, password) => {
    const credential = await loginWithEmail(email, password)
    // After login, reload the profile into context
    await loadProfile(credential.user)
    return credential
  }, [loadProfile])

  /**
   * Google login (redirect-based).
   * Flow: signInWithRedirect → page navigates to Google → redirect back →
   *       onAuthStateChanged fires → handleGoogleRedirect → ensureUserDoc → loadProfile
   *
   * Note: signInWithRedirect causes a full-page redirect to Google's OAuth page.
   * Code after the `await loginWithGoogle()` call will NOT execute in the same
   * session. The redirect result is handled in the onAuthStateChanged listener
   * on the redirected page.
   */
  const loginGoogle = useCallback(async () => {
    console.log('[AUDIT TEMP AuthContext] loginGoogle — INICIO')
    await loginWithGoogle()
  }, [])

  const register = useCallback(async (email, password, displayName) => {
    const credential = await registerWithEmail(email, password, displayName)
    await loadProfile(credential.user)
    return credential
  }, [loadProfile])

  const sendPasswordReset = useCallback(async (email) => {
    await resetPassword(email)
  }, [])

  const logout = useCallback(async () => {
    await logoutService()
    setUser(null)
    setUserProfile(null)
    initialLoadDone.current = false
  }, [])

  // ─── Context Value ──────────────────────────────────────────────────────────

  /** @type {AuthContextValue} */
  const value = {
    user,
    userProfile,
    // null while loading → components that check role must wait for loadingRole=false
    role: loadingRole ? null : (userProfile?.role ?? 'user'),
    loadingRole,
    loading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle: loginGoogle,
    register,
    sendPasswordReset,
    logout,
    // expose so hooks (e.g. useUpdateUserProfile) can trigger a profile refresh
    loadProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Custom hook to consume AuthContext.
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
