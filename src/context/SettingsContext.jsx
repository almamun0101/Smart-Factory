'use client'
// ─── Settings Context ─────────────────────────────────────────────────────────
// Settings are loaded from Firebase and cached in localStorage.
//
// Strategy:
//  1. On mount: immediately load from localStorage (instant, no flicker)
//  2. Then subscribe to Firebase — when DB data arrives, update state + localStorage
//  3. If settings change in DB (e.g. user edits rates), all components re-render
//     with new values automatically via React context
//  4. localStorage is only a cache — DB is always the source of truth
//
// This means priceConfig in MachineCard is ALWAYS the latest from DB.

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useAuth } from './AuthContext'
import { subscribeSettings, saveSettings } from '@/lib/db'

const CACHE_KEY = 'fb_settings_cache'

const DEFAULT_SETTINGS = {
  priceConfig: {
    totalRate: 9.00,
    peakRate: 12.50,
    offPeakRate: 6.00,
  },
  deductionConfig: {
    vatPercent: 5,
    demandCharge: 500,
    meterCharge: 150,
    localSurchargePercent: 3,
  },
  machines: [
    { id: 'm1', name: 'Machine A', model: 'Model X-100', defaultUnit: 1000 },
    { id: 'm2', name: 'Machine B', model: 'Model Y-200', defaultUnit: 800 },
    { id: 'm3', name: 'Machine C', model: 'Model Z-300', defaultUnit: 600 },
  ],
}

// ── localStorage helpers ───────────────────────────────────────────────────────
function loadCache(uid) {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${uid}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveCache(uid, data) {
  try { localStorage.setItem(`${CACHE_KEY}_${uid}`, JSON.stringify(data)) } catch {}
}

function clearCache(uid) {
  try { localStorage.removeItem(`${CACHE_KEY}_${uid}`) } catch {}
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [settings, setSettings]       = useState(DEFAULT_SETTINGS)
  const [loading, setLoading]         = useState(true)
  const [settingsError, setSettingsError] = useState(null)
  // Track whether we've loaded from cache already (to avoid flicker)
  const cacheLoaded = useRef(false)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setSettings(DEFAULT_SETTINGS)
      setLoading(false)
      cacheLoaded.current = false
      return
    }

    // ── Step 1: Load from localStorage cache immediately ──────────────────────
    // This gives instant UI with last-known values while Firebase loads
    if (!cacheLoaded.current) {
      const cached = loadCache(user.uid)
      if (cached) {
        console.log('[Settings] Loaded from cache instantly')
        setSettings(cached)
        setLoading(false)  // show UI right away with cached data
      }
      cacheLoaded.current = true
    }

    // ── Step 2: Subscribe to Firebase for live/updated values ─────────────────
    // When Firebase responds, update both state AND localStorage cache
    setLoading(true)
    let unsub = () => {}

    try {
      unsub = subscribeSettings(user.uid, (data) => {
        const fresh = data ?? DEFAULT_SETTINGS
        console.log('[Settings] Received from Firebase:', fresh.priceConfig)
        setSettings(fresh)
        saveCache(user.uid, fresh)   // keep cache up to date
        setSettingsError(null)
        setLoading(false)
      })
    } catch (e) {
      console.error('[Settings] Subscribe error:', e)
      setSettingsError(e.message)
      // Fall back to cache or defaults — don't leave user stuck
      const cached = loadCache(user.uid)
      setSettings(cached ?? DEFAULT_SETTINGS)
      setLoading(false)
    }

    // Timeout: if Firebase never responds after 6s, use cache/defaults
    const t = setTimeout(() => {
      console.warn('[Settings] Firebase timeout — using cached/default settings')
      const cached = loadCache(user.uid)
      setSettings(cached ?? DEFAULT_SETTINGS)
      setLoading(false)
    }, 6000)

    return () => {
      clearTimeout(t)
      unsub()
    }
  }, [user, authLoading])

  // ── Save settings: update DB + cache + state atomically ───────────────────
  async function updateSettings(partial) {
    if (!user) return
    const merged = {
      ...settings,
      ...partial,
      // Deep merge priceConfig and deductionConfig
      priceConfig: { ...settings.priceConfig, ...(partial.priceConfig || {}) },
      deductionConfig: { ...settings.deductionConfig, ...(partial.deductionConfig || {}) },
    }
    // Optimistic: update local state and cache instantly
    setSettings(merged)
    saveCache(user.uid, merged)

    try {
      await saveSettings(user.uid, merged)
      console.log('[Settings] Saved to Firebase:', merged.priceConfig)
    } catch (e) {
      console.error('[Settings] Save error:', e)
      setSettingsError(e.message)
      throw e
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading, settingsError }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider')
  return ctx
}
