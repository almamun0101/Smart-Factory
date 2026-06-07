'use client'
// ─── Auth Context ─────────────────────────────────────────────────────────────
// NO LOGIN REQUIRED — auto signs in anonymously on first visit.
// Users can optionally register/login to persist data across devices.
//
// Flow:
//   App loads → onAuthStateChanged fires
//     → if user exists (any kind): proceed
//     → if NO user: auto sign in anonymously (guest)
//   Result: user is ALWAYS logged in within 2-3 seconds of app load.

import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { saveProfile, getProfile } from '@/lib/db'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    let resolved = false

    // ── Hard timeout: 10s max ─────────────────────────────────────────────────
    // If Firebase never calls back (wrong config / no internet), stop spinning.
    const timeout = setTimeout(() => {
      if (!resolved) {
        const msg = 'Firebase did not respond after 10s. Check:\n• databaseURL in firebase.js\n• Internet connection\n• Firebase project is active'
        console.error('[Auth]', msg)
        setAuthError(msg)
        setLoading(false)
      }
    }, 10000)

    const unsub = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        resolved = true
        clearTimeout(timeout)
        setAuthError(null)

        if (firebaseUser) {
          // ── User exists (registered or guest) ────────────────────────────────
          setUser(firebaseUser)

          if (!firebaseUser.isAnonymous) {
            // Registered: load DB profile
            try {
              const p = await getProfile(firebaseUser.uid)
              setProfile(p || { displayName: firebaseUser.displayName || 'User', factoryName: '' })
            } catch (e) {
              console.warn('[Auth] Profile load failed (check DB rules):', e.code, e.message)
              setProfile({ displayName: firebaseUser.displayName || 'User', factoryName: '' })
            }
          } else {
            // Guest anonymous user
            setProfile({ displayName: 'Guest', factoryName: 'Guest Factory' })
          }
          setLoading(false)

        } else {
          // ── No user → auto sign in as guest ──────────────────────────────────
          // This means NO login screen is ever required.
          console.log('[Auth] No user found — auto signing in as guest')
          try {
            await signInAnonymously(auth)
            // onAuthStateChanged will fire again with the new user
          } catch (e) {
            console.error('[Auth] Auto guest sign-in failed:', e.code, e.message)
            setAuthError(`Auto guest login failed: ${e.message}\n\nCheck that Anonymous Auth is enabled in Firebase Console → Authentication → Sign-in method.`)
            setLoading(false)
          }
        }
      },
      (error) => {
        resolved = true
        clearTimeout(timeout)
        console.error('[Auth] onAuthStateChanged error:', error.code, error.message)
        setAuthError(`Auth error: ${error.message}`)
        setLoading(false)
      }
    )

    return () => { clearTimeout(timeout); unsub() }
  }, [])

  // ── Login with email/password ─────────────────────────────────────────────
  async function login(email, password) {
    setAuthError(null)
    // If currently guest, sign out first
    if (user?.isAnonymous) {
      await signOut(auth)
    }
    await signInWithEmailAndPassword(auth, email, password)
  }

  // ── Register new account ──────────────────────────────────────────────────
  async function register(email, password, name, factory) {
    setAuthError(null)
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    try {
      await saveProfile(cred.user.uid, { displayName: name, factoryName: factory })
    } catch (e) {
      console.warn('[Auth] Could not save profile:', e.message)
    }
    setProfile({ displayName: name, factoryName: factory })
  }

  // ── Upgrade guest to real account (keeps data!) ───────────────────────────
  // Links the anonymous account to an email/password credential.
  // All existing data under the guest UID is preserved.
  async function upgradeGuest(email, password, name, factory) {
    setAuthError(null)
    const credential = EmailAuthProvider.credential(email, password)
    const result = await linkWithCredential(auth.currentUser, credential)
    await updateProfile(result.user, { displayName: name })
    try {
      await saveProfile(result.user.uid, { displayName: name, factoryName: factory })
    } catch (e) {
      console.warn('[Auth] Could not save profile after upgrade:', e.message)
    }
    setUser(result.user)
    setProfile({ displayName: name, factoryName: factory })
  }

  // ── Sign out → will auto-sign back in as new guest ────────────────────────
  async function logout() {
    setUser(null)
    setProfile(null)
    await signOut(auth)
    // onAuthStateChanged will fire with null, then auto-sign-in as guest again
  }

  async function updateUserProfile(data) {
    if (!user || user.isAnonymous) return
    try {
      await saveProfile(user.uid, data)
      setProfile(data)
    } catch (e) {
      console.error('[Auth] updateUserProfile error:', e)
      throw e
    }
  }

  const isGuest = !!user?.isAnonymous

  return (
    <AuthContext.Provider value={{
      user, profile, isGuest, loading, authError,
      login, register, upgradeGuest, logout, updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
