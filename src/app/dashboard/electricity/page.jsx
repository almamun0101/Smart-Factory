'use client'
// ─── Electricity Recharges Page ───────────────────────────────────────────────
// Features:
//  - Add recharge modal: date (today default), amount, source (Local/Office)
//  - Month cards grouped by month — click to expand
//  - Deduction breakdown per month: VAT, local surcharge, demand/meter charge
//  - Net meter balance shown prominently

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useLang } from '@/context/LangContext'
import { subscribeRecharges, addRecharge, deleteRecharge } from '@/lib/db'
import { format, parseISO, isSameMonth, startOfMonth } from 'date-fns'
import { monthNames, monthShort } from '@/lib/i18n'

// ─── Add Recharge Modal ───────────────────────────────────────────────────────
function AddRechargeModal({ onClose, onAdd }) {
  const { t } = useLang()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('local')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd() {
    if (!amount || !date) return
    setSubmitting(true)
    await onAdd({ date, amount: parseFloat(amount), source })
    setSubmitting(false)
    onClose()
  }

  return (
    // Backdrop
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(26,32,53,0.35)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div className="card animate-scale" style={{ width: '100%', maxWidth: 380, padding: 28 }}>
        {/* Modal header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            ⚡ {t('addRechargeTitle')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
        </div>

        {/* Date field */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            📅 {t('date')}
          </label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-base" />
        </div>

        {/* Amount field */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            💰 {t('amount')} (৳)
          </label>
          <input
            type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00" className="input-base"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>

        {/* Source selector: Local or Office */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
            🏭 {t('source')}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { val: 'local',  icon: '📍', label: t('local'),  desc: 'Surcharge applies' },
              { val: 'office', icon: '🏢', label: t('office'), desc: t('free') },
            ].map(({ val, icon, label, desc }) => (
              <button key={val} onClick={() => setSource(val)} style={{
                padding: '12px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'var(--font-main)', textAlign: 'left',
                border: `2px solid ${source === val ? (val === 'local' ? 'var(--amber)' : 'var(--brand)') : 'var(--border)'}`,
                background: source === val ? (val === 'local' ? 'var(--amber-light)' : 'var(--brand-light)') : 'var(--bg-card)',
                transition: 'all 0.15s ease',
              }}>
                <div style={{ fontSize: '1.1rem', marginBottom: 3 }}>{icon}</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleAdd} disabled={submitting} style={{ width: '100%', padding: '13px' }}>
          {submitting ? '⏳ ...' : `⚡ ${t('addRecharge')}`}
        </button>
      </div>
    </div>
  )
}

// ─── Deduction row helper ─────────────────────────────────────────────────────
function DeductRow({ label, value, isNegative = false, isFinal = false }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: isFinal ? '10px 0 0' : '4px 0',
      borderTop: isFinal ? '1px solid var(--border)' : 'none',
      marginTop: isFinal ? 6 : 0,
    }}>
      <span style={{ fontSize: isFinal ? '0.88rem' : '0.8rem', fontWeight: isFinal ? 800 : 600, color: isFinal ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontWeight: isFinal ? 900 : 700,
        fontSize: isFinal ? '1rem' : '0.82rem',
        color: isFinal ? (value >= 0 ? 'var(--green)' : 'var(--red)') : (isNegative ? 'var(--red)' : 'var(--text-primary)'),
      }}>
        {isNegative ? '−' : ''}৳{Math.abs(value).toFixed(2)}
      </span>
    </div>
  )
}

// ─── Month recharge card ──────────────────────────────────────────────────────
function MonthRechargeCard({ monthDate, recharges, onDelete, deductionConfig, index }) {
  const [expanded, setExpanded] = useState(index === 0)
  const { t, lang } = useLang()

  // Filter recharges for this specific month
  const monthRecharges = recharges.filter(r => isSameMonth(parseISO(r.date), monthDate))
  if (monthRecharges.length === 0) return null

  const monthNum = monthDate.getMonth()
  const year = monthDate.getFullYear()
  const monthLabel = `${monthNames[lang]?.[monthNum]} ${year}`
  const shortLabel = monthShort[lang]?.[monthNum]

  // Totals
  const totalRecharge = monthRecharges.reduce((s, r) => s + r.amount, 0)
  const localAmount = monthRecharges.filter(r => r.source === 'local').reduce((s, r) => s + r.amount, 0)

  // Deductions
  const localSurcharge = localAmount * (deductionConfig.localSurchargePercent / 100)
  const gross = totalRecharge + localSurcharge
  const vat = gross * (deductionConfig.vatPercent / 100)
  const netBalance = gross - vat - deductionConfig.demandCharge - deductionConfig.meterCharge

  return (
    <div className="card" style={{ overflow: 'hidden', borderColor: expanded ? '#FCD34D' : 'var(--border)', transition: 'border-color 0.2s ease' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-main)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: expanded ? 'linear-gradient(135deg, #D97706, #FBBF24)' : 'var(--bg-subtle)',
            color: expanded ? 'white' : 'var(--text-muted)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.65rem', lineHeight: 1.2,
            boxShadow: expanded ? '0 2px 8px rgba(217,119,6,0.3)' : 'none',
            transition: 'all 0.2s ease',
          }}>
            <span style={{ fontSize: '0.9rem' }}>{shortLabel}</span>
            <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>{year}</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: expanded ? 'var(--amber)' : 'var(--text-primary)' }}>
              {monthLabel}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {monthRecharges.length} {t('rechargeCount')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('netMeterBalance')}</div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>৳{netBalance.toFixed(0)}</div>
          </div>
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)', transition: 'transform 0.2s ease', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="animate-up" style={{ padding: '0 16px 16px' }}>
          {/* Recharge list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {monthRecharges.map(r => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                background: r.source === 'local' ? 'var(--amber-light)' : 'var(--brand-light)',
                border: `1px solid ${r.source === 'local' ? '#FCD34D' : 'var(--brand-mid)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.1rem' }}>{r.source === 'local' ? '📍' : '🏢'}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      ৳{r.amount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {format(parseISO(r.date), 'dd MMM yyyy')} · {r.source === 'local' ? t('local') : t('office')}
                    </div>
                  </div>
                </div>
                <button onClick={() => onDelete(r.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '1rem', color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >🗑️</button>
              </div>
            ))}
          </div>

          {/* Deduction breakdown */}
          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              📋 {t('deductionBreakdown')}
            </div>
            <DeductRow label={t('totalRecharge')} value={totalRecharge} />
            <DeductRow label={`${t('localSurcharge')} (${deductionConfig.localSurchargePercent}%)`} value={localSurcharge} isNegative />
            <DeductRow label={`${t('vat')} (${deductionConfig.vatPercent}%)`} value={vat} isNegative />
            <DeductRow label={t('demandCharge')} value={deductionConfig.demandCharge} isNegative />
            <DeductRow label={t('meterCharge')} value={deductionConfig.meterCharge} isNegative />
            <DeductRow label={t('netMeterBalance')} value={netBalance} isFinal />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Electricity Page ────────────────────────────────────────────────────
export default function ElectricityPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { t } = useLang()

  const [recharges, setRecharges] = useState([])
  const [showModal, setShowModal] = useState(false)

  // Subscribe to recharges in real-time
  useEffect(() => {
    if (!user) return
    return subscribeRecharges(user.uid, setRecharges)
  }, [user])

  async function handleAdd(data) {
    if (!user) return
    await addRecharge(user.uid, data)
  }

  async function handleDelete(id) {
    if (!user) return
    await deleteRecharge(user.uid, id)
  }

  // Get unique months from recharges (newest first)
  const monthDates = Array.from(
    new Set(recharges.map(r => format(startOfMonth(parseISO(r.date)), 'yyyy-MM')))
  ).sort((a, b) => b.localeCompare(a)).map(k => new Date(k + '-01'))

  return (
    <div style={{ padding: '28px 24px', maxWidth: 860, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="section-title">⚡ {t('electricityRecharges')}</h1>
          <p className="section-sub">{t('electricityDesc')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + {t('addRecharge')}
        </button>
      </div>

      {/* Empty state */}
      {recharges.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚡</div>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t('noRecharges')}</p>
        </div>
      )}

      {/* Month cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {monthDates.map((m, i) => (
          <MonthRechargeCard
            key={format(m, 'yyyy-MM')}
            monthDate={m}
            recharges={recharges}
            onDelete={handleDelete}
            deductionConfig={settings.deductionConfig}
            index={i}
          />
        ))}
      </div>

      {/* Add modal */}
      {showModal && <AddRechargeModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  )
}
