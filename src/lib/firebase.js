// ─── Firebase Initialization ──────────────────────────────────────────────────
// getApps() prevents re-initialization on Next.js hot reload.
// 
// COMMON LOADING BUG: If databaseURL is wrong, all DB calls hang silently.
// Check Firebase Console → Realtime Database → copy the exact URL shown there.

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyCVr1Zymln06QskvAudQWi3SG8pPblF0o8',
  authDomain: 'factory-db-e6bcf.firebaseapp.com',
  projectId: 'factory-db-e6bcf',
  storageBucket: 'factory-db-e6bcf.firebasestorage.app',
  messagingSenderId: '451635285016',
  appId: '1:451635285016:web:241bae5a15f002994ac76d',
  // ⚠️ Must match your Firebase Console → Realtime Database URL exactly
  // Common URLs:
  //   https://YOUR-PROJECT-default-rtdb.firebaseio.com          (US)
  //   https://YOUR-PROJECT-default-rtdb.europe-west1.firebaseio.com (EU)
  //   https://YOUR-PROJECT-default-rtdb.asia-southeast1.firebaseio.com (SG)
  databaseURL: 'https://factory-db-e6bcf-default-rtdb.firebaseio.com',
}

let app
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
} catch (e) {
  console.error('[Firebase] Init error:', e)
  app = getApps()[0]
}

export const auth = getAuth(app)
export const db = getDatabase(app)
export default app
