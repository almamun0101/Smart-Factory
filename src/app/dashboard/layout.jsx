'use client'
// ─── Dashboard Layout ─────────────────────────────────────────────────────────
// Uses CSS classes (not inline styles) for sidebar/content layout so the
// @media breakpoint in globals.css can actually override them.
// Inline styles always beat CSS classes — that was the responsive bug.

import { useAuth } from '@/context/AuthContext'
import { Sidebar, MobileNav } from '@/components/Sidebar'

export default function DashboardLayout({ children }) {
  const { user, loading, authError } = useAuth()

  if (authError) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FFF8F8', padding:24, fontFamily:'sans-serif' }}>
        <div style={{ maxWidth:500, width:'100%', padding:32, borderRadius:16, background:'white', border:'1px solid #FECACA' }}>
          <div style={{ fontSize:'2rem', marginBottom:12 }}>🔥</div>
          <h2 style={{ color:'#DC2626', fontWeight:800, marginBottom:8 }}>Firebase Connection Error</h2>
          <pre style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'12px 14px', fontSize:'0.78rem', color:'#7F1D1D', overflowX:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word', marginBottom:20, lineHeight:1.6 }}>
            {authError}
          </pre>
          <p style={{ fontSize:'0.82rem', color:'#6B7280', marginBottom:16 }}>
            <strong>Fix:</strong> Enable Anonymous Auth in Firebase Console → Authentication → Sign-in method
          </p>
          <button onClick={() => window.location.reload()}
            style={{ padding:'10px 20px', borderRadius:10, border:'none', cursor:'pointer', background:'#2563EB', color:'white', fontWeight:700 }}>
            🔄 Retry
          </button>
        </div>
      </div>
    )
  }

  if (loading || !user) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:16 }}>⚡</div>
          <div style={{ display:'inline-block', width:32, height:32, border:'3px solid var(--border)', borderTopColor:'var(--brand)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ marginTop:12, color:'var(--text-muted)', fontSize:'0.875rem', fontWeight:600 }}>Connecting...</div>
        </div>
      </div>
    )
  }

  return (
    // app-shell: flex row, full height
    // sidebar: fixed left column (CSS class handles show/hide)
    // main-content: fills remaining space (CSS class handles margin-left)
    // bottom-nav: fixed bottom bar (CSS class handles show/hide)
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
