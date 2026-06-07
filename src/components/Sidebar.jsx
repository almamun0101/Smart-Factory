'use client'
// ─── Sidebar + Mobile Bottom Navigation ──────────────────────────────────────
// KEY FIX: No inline display styles on .sidebar or .bottom-nav elements.
// The CSS classes in globals.css handle show/hide at the breakpoint.
// Inline styles always override CSS — that was causing both to show on mobile.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LangContext'

const NAV = [
  { href: '/dashboard/machines',    icon: '🔧', key: 'machines'    },
  { href: '/dashboard/electricity', icon: '⚡', key: 'electricity' },
  { href: '/dashboard/calculation', icon: '📊', key: 'calculation' },
  { href: '/dashboard/settings',    icon: '⚙️', key: 'settings'   },
]

export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div style={{ display:'flex', gap:3, padding:3, background:'var(--bg-subtle)', borderRadius:8, border:'1px solid var(--border)' }}>
      {['en','bn'].map(l => (
        <button key={l} onClick={() => setLang(l)} style={{
          padding:'4px 10px', borderRadius:6, border:'none', cursor:'pointer',
          fontSize:'0.78rem', fontWeight:700, fontFamily:'var(--font-main)',
          background: lang===l ? 'var(--bg-card)' : 'transparent',
          color: lang===l ? 'var(--brand)' : 'var(--text-muted)',
          boxShadow: lang===l ? 'var(--shadow-sm)' : 'none',
          transition:'all 0.15s',
        }}>{l==='en' ? 'EN' : 'বাং'}</button>
      ))}
    </div>
  )
}

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
// Uses className="sidebar" — CSS handles display:flex on desktop, display:none on mobile
export function Sidebar() {
  const pathname = usePathname()
  const { user, profile, isGuest, logout } = useAuth()
  const { t } = useLang()

  return (
    // NOTE: no inline display style here — CSS class controls visibility
    <aside className="sidebar">

      {/* Logo */}
      <div style={{ padding:'20px 16px 14px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{
            width:38, height:38, borderRadius:12, flexShrink:0,
            background:'linear-gradient(135deg,#2563EB,#60A5FA)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.1rem', boxShadow:'0 2px 8px rgba(37,99,235,0.25)',
          }}>⚡</div>
          <div style={{ overflow:'hidden' }}>
            <div style={{ fontWeight:900, fontSize:'0.95rem', color:'var(--text-primary)', letterSpacing:'-0.02em' }}>
              {t('appName')}
            </div>
            <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontWeight:600, marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {profile?.factoryName || t('appTagline')}
            </div>
          </div>
        </div>
        <LangToggle />
      </div>

      {/* Nav links */}
      <nav style={{ flex:1, padding:'10px 10px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        {NAV.map(({ href, icon, key }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 12px', borderRadius:10, textDecoration:'none',
              background: active ? 'var(--brand-light)' : 'transparent',
              color: active ? 'var(--brand)' : 'var(--text-secondary)',
              fontWeight: active ? 700 : 600, fontSize:'0.875rem',
              border: `1px solid ${active ? 'var(--brand-mid)' : 'transparent'}`,
              transition:'all 0.15s',
            }}>
              <span style={{ fontSize:'1.05rem', flexShrink:0 }}>{icon}</span>
              {t(key)}
              {active && <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'var(--brand)' }} />}
            </Link>
          )
        })}
      </nav>

      {/* User area */}
      <div style={{ padding:'10px 10px', borderTop:'1px solid var(--border)' }}>
        {isGuest ? (
          <Link href="/login" style={{
            display:'block', padding:'10px 12px', borderRadius:10, textDecoration:'none',
            background:'var(--brand-light)', border:'1px solid var(--brand-mid)', marginBottom:6,
          }}>
            <div style={{ fontWeight:800, fontSize:'0.82rem', color:'var(--brand)' }}>🔐 Save Your Account</div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:1 }}>Register to keep your data</div>
          </Link>
        ) : (
          <Link href="/dashboard/profile" style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'10px 12px', borderRadius:10, textDecoration:'none', marginBottom:4,
          }}>
            <div style={{
              width:34, height:34, borderRadius:10, flexShrink:0,
              background:'linear-gradient(135deg,#2563EB,#93C5FD)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:800, color:'white', fontSize:'0.9rem',
              border:'1.5px solid var(--border)',
            }}>
              {(profile?.displayName?.[0] || '?').toUpperCase()}
            </div>
            <div style={{ overflow:'hidden', flex:1 }}>
              <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {profile?.displayName || 'User'}
              </div>
              <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {user?.email || ''}
              </div>
            </div>
          </Link>
        )}
        {!isGuest && (
          <button onClick={logout} style={{
            width:'100%', display:'flex', alignItems:'center', gap:8,
            padding:'9px 12px', borderRadius:10, border:'none',
            background:'transparent', cursor:'pointer',
            fontFamily:'var(--font-main)', fontSize:'0.82rem', fontWeight:700,
            color:'var(--red)', transition:'background 0.15s',
          }}>
            🚪 {t('signOut')}
          </button>
        )}
      </div>
    </aside>
  )
}

// ── Mobile Bottom Nav ─────────────────────────────────────────────────────────
// Uses className="bottom-nav" — CSS handles display:none on desktop, display:flex on mobile
export function MobileNav() {
  const pathname = usePathname()
  const { t } = useLang()
  const { isGuest } = useAuth()

  const items = [
    ...NAV,
    { href: '/login', icon: isGuest ? '🔐' : '👤', key: 'profile' },
  ]

  return (
    // NOTE: no inline display style — CSS class controls visibility
    <nav className="bottom-nav">
      {items.map(({ href, icon, key }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link key={href} href={href} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center',
            gap:2, padding:'5px 4px', borderRadius:8, textDecoration:'none',
            color: active ? 'var(--brand)' : 'var(--text-muted)',
            transition:'color 0.15s',
          }}>
            <span style={{ fontSize:'1.25rem', lineHeight:1 }}>{icon}</span>
            <span style={{ fontSize:'0.6rem', fontWeight: active ? 800 : 600, lineHeight:1, textAlign:'center' }}>
              {t(key)}
            </span>
            {active && (
              <div style={{ width:18, height:2.5, borderRadius:2, background:'var(--brand)', marginTop:1 }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
