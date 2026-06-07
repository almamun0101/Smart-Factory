'use client'
// ─── Profile Page ─────────────────────────────────────────────────────────────
// Guests see upgrade CTA. Registered users can edit name + factory name.

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LangContext'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, profile, isGuest, updateUserProfile } = useAuth()
  const { t } = useLang()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [factoryName, setFactoryName] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Populate fields once profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '')
      setFactoryName(profile.factoryName || '')
    }
  }, [profile])

  async function handleSave() {
    setError('')
    try {
      await updateUserProfile({ displayName, factoryName })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e.message || 'Could not save profile')
    }
  }

  return (
    <div style={{ padding:'28px 24px', maxWidth:520, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h1 className="section-title">👤 {t('profileTitle')}</h1>
        <p className="section-sub">{t('profileDesc')}</p>
      </div>

      {/* Avatar card */}
      <div className="card" style={{ padding:20, marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{
          width:56, height:56, borderRadius:16, flexShrink:0,
          background: isGuest ? 'var(--bg-subtle)' : 'linear-gradient(135deg,#2563EB,#60A5FA)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: isGuest ? '1.6rem' : '1.4rem', fontWeight:900,
          color: isGuest ? 'var(--text-muted)' : 'white',
          border:'2px solid var(--border)',
        }}>
          {isGuest ? '🙂' : (profile?.displayName?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight:800, fontSize:'1rem', color:'var(--text-primary)' }}>
            {profile?.displayName || t('guestUser')}
          </div>
          <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600 }}>
            {profile?.factoryName || t('guestFactory')}
          </div>
          <div style={{ marginTop:5 }}>
            <span className={`badge ${isGuest ? 'badge-amber' : 'badge-green'}`}>
              {isGuest ? `🙂 ${t('guestAccount')}` : `✅ ${t('authenticated')}`}
            </span>
          </div>
        </div>
      </div>

      {isGuest ? (
        /* Guest: show upgrade CTA */
        <div className="card" style={{ padding:24, textAlign:'center' }}>
          <div style={{ fontSize:'2rem', marginBottom:12 }}>🔐</div>
          <p style={{ fontWeight:700, color:'var(--text-secondary)', marginBottom:16, lineHeight:1.6 }}>
            {t('guestProfileNote')}
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/login')} style={{ width:'100%', padding:13 }}>
            Create Account — Save Your Data
          </button>
        </div>
      ) : (
        /* Registered user: edit profile */
        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:6 }}>
                👤 {t('displayName')}
              </label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="input-base" placeholder="Your name" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:6 }}>
                🏭 {t('factoryName')}
              </label>
              <input value={factoryName} onChange={e => setFactoryName(e.target.value)}
                className="input-base" placeholder="Factory name" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:6 }}>
                ✉️ {t('emailLabel')}
              </label>
              <input value={user?.email || ''} disabled className="input-base"
                style={{ background:'var(--bg-subtle)', color:'var(--text-muted)', cursor:'not-allowed' }} />
            </div>
            {error && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'var(--red-light)', color:'var(--red)', fontSize:'0.82rem', fontWeight:600, border:'1px solid #FECACA' }}>
                ⚠️ {error}
              </div>
            )}
            <button className={`btn ${saved ? 'btn-success' : 'btn-primary'}`} onClick={handleSave}
              style={{ width:'100%', padding:13, marginTop:4 }}>
              {saved ? `✅ ${t('profileSaved')}` : `💾 ${t('saveProfile')}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
