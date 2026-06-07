'use client'
// ─── Language Context ─────────────────────────────────────────────────────────
// FIX: Hydration mismatch — localStorage can't be read on the server.
// Solution: always start with 'en', then read localStorage in useEffect.
// This ensures server HTML and first client render match exactly.

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations } from '@/lib/i18n'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  // Always start with 'en' to avoid SSR/client mismatch
  const [lang, setLangState] = useState('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read saved preference only on client after hydration
    setMounted(true)
    try {
      const saved = localStorage.getItem('fb_lang')
      if (saved === 'bn' || saved === 'en') setLangState(saved)
    } catch (_) {}
  }, [])

  function setLang(l) {
    setLangState(l)
    try { localStorage.setItem('fb_lang', l) } catch (_) {}
  }

  // t() — translate a key, fall back to English, fall back to the key itself
  const t = useCallback((key) => {
    return translations[lang]?.[key] ?? translations['en']?.[key] ?? key
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t, mounted }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be inside LangProvider')
  return ctx
}
