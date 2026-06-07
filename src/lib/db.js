// ─── Firebase Realtime Database Helpers ───────────────────────────────────────
// All data is scoped under users/{uid}/ so each user has their own isolated data.
// Data structure:
//   users/{uid}/settings      → { priceConfig, deductionConfig, machines[] }
//   users/{uid}/readings/{monthKey} → MonthData
//   users/{uid}/recharges/{id}      → ElectricityRecharge
//   users/{uid}/profile             → { displayName, factoryName }

import { db } from './firebase'
import { ref, set, get, push, remove, onValue, off } from 'firebase/database'

// ── Settings ──────────────────────────────────────────────────────────────────

/** Save full settings object to DB */
export async function saveSettings(uid, settings) {
  await set(ref(db, `users/${uid}/settings`), settings)
}

/** Subscribe to settings changes in real-time */
export function subscribeSettings(uid, callback) {
  const r = ref(db, `users/${uid}/settings`)
  onValue(r, snap => callback(snap.exists() ? snap.val() : null))
  return () => off(r) // Returns unsubscribe function
}

// ── Machine Readings ──────────────────────────────────────────────────────────

/** Save all machine readings for a given month */
export async function saveMonthReadings(uid, monthData) {
  await set(ref(db, `users/${uid}/readings/${monthData.monthKey}`), monthData)
}

/** Subscribe to readings for a single month in real-time */
export function subscribeMonthReadings(uid, monthKey, callback) {
  const r = ref(db, `users/${uid}/readings/${monthKey}`)
  onValue(r, snap => callback(snap.exists() ? snap.val() : null))
  return () => off(r)
}

/** One-time fetch of all readings across all months */
export async function getAllReadings(uid) {
  const snap = await get(ref(db, `users/${uid}/readings`))
  return snap.exists() ? snap.val() : {}
}

// ── Electricity Recharges ─────────────────────────────────────────────────────

/** Add a new recharge entry (Firebase auto-generates the ID) */
export async function addRecharge(uid, recharge) {
  await push(ref(db, `users/${uid}/recharges`), recharge)
}

/** Delete a specific recharge by its Firebase-generated ID */
export async function deleteRecharge(uid, id) {
  await remove(ref(db, `users/${uid}/recharges/${id}`))
}

/** Subscribe to all recharges, sorted by date */
export function subscribeRecharges(uid, callback) {
  const r = ref(db, `users/${uid}/recharges`)
  onValue(r, snap => {
    if (!snap.exists()) { callback([]); return }
    const val = snap.val()
    // Convert Firebase object keys to array with id field
    const list = Object.entries(val).map(([id, v]) => ({ id, ...v }))
    // Sort chronologically
    callback(list.sort((a, b) => a.date.localeCompare(b.date)))
  })
  return () => off(r)
}

// ── User Profile ──────────────────────────────────────────────────────────────

export async function saveProfile(uid, data) {
  await set(ref(db, `users/${uid}/profile`), data)
}

export async function getProfile(uid) {
  const snap = await get(ref(db, `users/${uid}/profile`))
  return snap.exists() ? snap.val() : null
}
