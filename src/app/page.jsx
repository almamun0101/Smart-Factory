'use client'
// ─── Root Page ────────────────────────────────────────────────────────────────
// Always redirects to /dashboard/machines.
// No login check needed — AuthContext auto-signs in as guest.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  useEffect(() => { router.replace('/login') }, [router])

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--brand)' }}>
        <span style={{ fontSize:'1.5rem' }}>⚡</span>
        <span style={{ fontWeight:700, fontFamily:'var(--font-main)' }}>Loading...</span>
      </div>
    </div>
  )
}
