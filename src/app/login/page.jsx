'use client'
// ─── Account Page (optional login / register / upgrade) ───────────────────────
// Since no login is required, this page is purely optional.
// Guest users see an "Upgrade Account" option to keep their data permanently.
// Already-registered users see sign-in form.
// Accessible from sidebar profile area.

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LangContext'
import { useRouter } from 'next/navigation'

function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div style={{ display:'flex', gap:4, padding:4, background:'var(--bg-subtle)', borderRadius:10, border:'1px solid var(--border)' }}>
      {['en','bn'].map(l => (
        <button key={l} onClick={() => setLang(l)} style={{
          padding:'4px 12px', borderRadius:7, border:'none', cursor:'pointer',
          fontSize:'0.8rem', fontWeight:700, fontFamily:'var(--font-main)',
          background: lang===l ? 'var(--bg-card)' : 'transparent',
          color: lang===l ? 'var(--brand)' : 'var(--text-muted)',
          boxShadow: lang===l ? 'var(--shadow-sm)' : 'none',
          transition:'all 0.15s ease',
        }}>
          {l==='en' ? 'EN' : 'বাং'}
        </button>
      ))}
    </div>
  )
}

function Field({ label, value, onChange, type='text', placeholder, icon }) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div>
      <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:6 }}>
        {icon && <span style={{ marginRight:5 }}>{icon}</span>}{label}
      </label>
      <div style={{ position:'relative' }}>
        <input
          type={isPass ? (show ? 'text' : 'password') : type}
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className="input-base"
          style={{ paddingRight: isPass ? 44 : 14 }}
          onKeyDown={e => e.key === 'Enter' && e.currentTarget.form?.requestSubmit?.()}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(!show)} style={{
            position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
            background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'1rem',
          }}>
            {show ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { user, isGuest, login, register, upgradeGuest, logout } = useAuth()
  const { t } = useLang()
  const router = useRouter()

  // Determine which mode to show by default
  // If guest → show upgrade form. If logged in → show account info.
  const [mode, setMode] = useState(isGuest ? 'upgrade' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [factory, setFactory] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  function clean(msg) {
    return (msg || 'Something went wrong')
      .replace('Firebase: ', '')
      .replace(/\(auth\/.*?\)\.?/, '')
      .trim()
  }

  async function handleSubmit() {
    setError(''); setSuccess('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setBusy(true)
    try {
      if (mode === 'upgrade') {
        // Upgrade anonymous account → keeps all existing data
        if (!name) { setError('Please enter your name.'); setBusy(false); return }
        await upgradeGuest(email, password, name, factory)
        setSuccess('Account created! Your data has been saved permanently. ✅')
        setTimeout(() => router.push('/dashboard/machines'), 1500)
      } else if (mode === 'register') {
        await register(email, password, name, factory)
        setSuccess('Account created! ✅')
        setTimeout(() => router.push('/dashboard/machines'), 1500)
      } else {
        await login(email, password)
        router.push('/dashboard/machines')
      }
    } catch (e) {
      setError(clean(e.message))
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    setBusy(true)
    await logout()
    setBusy(false)
    router.push('/dashboard/machines')
  }

  // ── Already logged-in registered user ──────────────────────────────────────
  if (user && !isGuest) {
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#EEF3FF,#F7F8FC)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ position:'absolute', top:20, right:20 }}><LangToggle /></div>
        <div className="card animate-up" style={{ width:'100%', maxWidth:400, padding:'36px 32px', textAlign:'center' }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>✅</div>
          <h2 style={{ fontWeight:900, marginBottom:6, fontSize:'1.2rem' }}>Signed In</h2>
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:24 }}>
            {user.email}
          </p>
          <button className="btn btn-ghost" onClick={handleLogout} disabled={busy} style={{ width:'100%', marginBottom:10 }}>
            🚪 {t('signOut')}
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard/machines')} style={{ width:'100%' }}>
            ← Back to App
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#EEF3FF 0%,#F7F8FC 40%,#F0F8FF 100%)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'20px', position:'relative',
    }}>
      <div style={{ position:'absolute', top:20, right:20 }}><LangToggle /></div>
      <div style={{ position:'absolute', top:20, left:20 }}>
        <button className="btn btn-ghost" onClick={() => router.push('/dashboard/machines')} style={{ padding:'8px 14px', fontSize:'0.82rem' }}>
          ← Back to App
        </button>
      </div>

      <div className="card animate-up" style={{ width:'100%', maxWidth:420, padding:'36px 32px', marginTop:32 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:60, height:60, borderRadius:18, marginBottom:14,
            background:'linear-gradient(135deg,#2563EB,#60A5FA)',
            boxShadow:'0 4px 20px rgba(37,99,235,0.3)', fontSize:'1.6rem',
          }}>⚡</div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:900, letterSpacing:'-0.03em', color:'var(--text-primary)' }}>
            {t('appName')}
          </h1>
          {isGuest && (
            <div style={{ marginTop:8 }}>
              <span className="badge badge-amber">🙂 Guest Session</span>
              <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:6, lineHeight:1.5 }}>
                Register to save your data permanently across devices
              </p>
            </div>
          )}
        </div>

        {/* Mode tabs */}
        <div style={{ display:'flex', background:'var(--bg-subtle)', borderRadius:12, padding:4, marginBottom:24, border:'1px solid var(--border)' }}>
          {(isGuest
            ? [{ val:'upgrade', label:'🔐 Save Account' }, { val:'login', label:t('signIn') }]
            : [{ val:'login', label:t('signIn') }, { val:'register', label:t('register') }]
          ).map(({ val, label }) => (
            <button key={val} onClick={() => { setMode(val); setError(''); setSuccess('') }} style={{
              flex:1, padding:'9px 4px', borderRadius:9, border:'none', cursor:'pointer',
              fontFamily:'var(--font-main)', fontWeight:700, fontSize:'0.82rem',
              background: mode===val ? 'var(--bg-card)' : 'transparent',
              color: mode===val ? 'var(--brand)' : 'var(--text-muted)',
              boxShadow: mode===val ? 'var(--shadow-sm)' : 'none',
              transition:'all 0.15s ease',
            }}>{label}</button>
          ))}
        </div>

        {/* Upgrade info box */}
        {mode === 'upgrade' && (
          <div style={{
            padding:'12px 14px', borderRadius:10, marginBottom:16,
            background:'var(--brand-light)', border:'1px solid var(--brand-mid)',
            fontSize:'0.8rem', color:'var(--brand)', fontWeight:600, lineHeight:1.5,
          }}>
            💡 All your existing data will be kept when you create an account.
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {(mode === 'register' || mode === 'upgrade') && (
            <>
              <Field label={t('yourName')} value={name} onChange={setName} placeholder={t('fullName')} icon="👤" />
              <Field label={t('factoryName')} value={factory} onChange={setFactory} placeholder="e.g. ABC Garments Ltd." icon="🏭" />
            </>
          )}
          <Field label={t('email')} value={email} onChange={setEmail} type="email" placeholder="you@example.com" icon="✉️" />
          <Field label={t('password')} value={password} onChange={setPassword} type="password" placeholder="••••••••" />

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'var(--red-light)', color:'var(--red)', fontSize:'0.82rem', fontWeight:600, border:'1px solid #FECACA' }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'var(--green-light)', color:'var(--green)', fontSize:'0.82rem', fontWeight:600, border:'1px solid #86EFAC' }}>
              {success}
            </div>
          )}

          <button className="btn btn-primary" onClick={handleSubmit} disabled={busy} style={{ width:'100%', padding:'13px', fontSize:'0.95rem', marginTop:4 }}>
            {busy ? '⏳ Please wait...' :
              mode === 'upgrade' ? '🔐 Create Account & Save Data' :
              mode === 'register' ? t('createAccount') :
              t('signIn')}
          </button>
        </div>
      </div>
    </div>
  )
}
