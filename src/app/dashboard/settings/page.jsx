'use client'
// ─── Settings Page ────────────────────────────────────────────────────────────
// Three sections:
//  1. Machines — add/remove/edit machine name, model, default unit
//  2. Electricity Rates — set total, peak, off-peak rates per kWh
//  3. Deductions — VAT%, local surcharge%, demand charge, meter charge
// All saved to Firebase Realtime DB on clicking "Save All Settings".

import { useState, useEffect } from 'react'
import { useSettings } from '@/context/SettingsContext'
import { useLang } from '@/context/LangContext'

// ─── Section wrapper card ─────────────────────────────────────────────────────
function Section({ icon, title, children }) {
  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
      {/* Section header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

// ─── Text input helper ────────────────────────────────────────────────────────
function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input-base" />
    </div>
  )
}

// ─── Number input with optional prefix/suffix ─────────────────────────────────
function NumInput({ label, value, onChange, prefix, suffix }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', pointerEvents: 'none' }}>{prefix}</span>
        )}
        <input
          type="number" value={value || ''} onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="input-base"
          style={{ paddingLeft: prefix ? 28 : 14, paddingRight: suffix ? 40 : 14, fontFamily: 'var(--font-mono)' }}
        />
        {suffix && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', pointerEvents: 'none' }}>{suffix}</span>
        )}
      </div>
    </div>
  )
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const { settings, updateSettings, loading } = useSettings()
  const { t } = useLang()
  const [saved, setSaved] = useState(false)

  // Local copies of each config section — edited locally, saved on button click
  const [priceConfig, setPriceConfig] = useState(settings.priceConfig)
  const [deductConfig, setDeductConfig] = useState(settings.deductionConfig)
  const [machines, setMachines] = useState(settings.machines)

  // Keep local state in sync if settings load from Firebase after render
  useEffect(() => {
    setPriceConfig(settings.priceConfig)
    setDeductConfig(settings.deductionConfig)
    setMachines(settings.machines)
  }, [settings])

  // ── Machine CRUD ────────────────────────────────────────────────────────────

  function addMachine() {
    setMachines(prev => [...prev, {
      id: `m_${Date.now()}`,
      name: '',
      model: '',
      defaultUnit: 500,
    }])
  }

  function updateMachine(id, patch) {
    setMachines(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m))
  }

  function removeMachine(id) {
    setMachines(prev => prev.filter(m => m.id !== id))
  }

  // ── Save all to Firebase ────────────────────────────────────────────────────
  async function handleSave() {
    await updateSettings({ priceConfig, deductionConfig: deductConfig, machines })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <div style={{ padding: 32, color: 'var(--text-muted)', fontWeight: 600 }}>⏳ {t('loading')}</div>
  )

  return (
    <div style={{ padding: '28px 24px', maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-title">⚙️ {t('settingsTitle')}</h1>
        <p className="section-sub">{t('settingsDesc')}</p>
      </div>

      {/* ── Section 1: Machines ── */}
      <Section icon="🔧" title={t('machinesSection')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {machines.map(m => (
            <div key={m.id} style={{
              padding: 14, borderRadius: 12, background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <TextInput label={t('machineName')} value={m.name} onChange={v => updateMachine(m.id, { name: v })} placeholder="e.g. Machine A" />
                <TextInput label={t('model')} value={m.model} onChange={v => updateMachine(m.id, { model: v })} placeholder="e.g. X-100" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
                <NumInput label={t('defaultUnit')} value={m.defaultUnit} onChange={v => updateMachine(m.id, { defaultUnit: v })} suffix="kWh" />
                <button className="btn btn-danger" onClick={() => removeMachine(m.id)} style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                  🗑️ {t('removeMachine')}
                </button>
              </div>
            </div>
          ))}

          {/* Add machine button */}
          <button
            onClick={addMachine}
            style={{
              padding: '13px', borderRadius: 10, border: '2px dashed var(--border)',
              background: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)',
              fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-light)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
          >
            {t('addMachine')}
          </button>
        </div>
      </Section>

      {/* ── Section 2: Electricity Rates ── */}
      <Section icon="⚡" title={t('electricityRates')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          <NumInput label={`${t('totalUnitRate')} (৳/kWh)`} value={priceConfig.totalRate}
            onChange={v => setPriceConfig(p => ({ ...p, totalRate: v }))} prefix="৳" />
          <NumInput label={`${t('peakHourRate')} (৳/kWh)`} value={priceConfig.peakRate}
            onChange={v => setPriceConfig(p => ({ ...p, peakRate: v }))} prefix="৳" />
          <NumInput label={`${t('offPeakRate')} (৳/kWh)`} value={priceConfig.offPeakRate}
            onChange={v => setPriceConfig(p => ({ ...p, offPeakRate: v }))} prefix="৳" />
        </div>
      </Section>

      {/* ── Section 3: Deductions ── */}
      <Section icon="📋" title={t('deductionsCharges')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          <NumInput label={t('vatPercent')} value={deductConfig.vatPercent}
            onChange={v => setDeductConfig(d => ({ ...d, vatPercent: v }))} suffix="%" />
          <NumInput label={t('localSurchargePercent')} value={deductConfig.localSurchargePercent}
            onChange={v => setDeductConfig(d => ({ ...d, localSurchargePercent: v }))} suffix="%" />
          <NumInput label={`${t('demandCharge')} (৳)`} value={deductConfig.demandCharge}
            onChange={v => setDeductConfig(d => ({ ...d, demandCharge: v }))} prefix="৳" />
          <NumInput label={`${t('meterCharge')} (৳)`} value={deductConfig.meterCharge}
            onChange={v => setDeductConfig(d => ({ ...d, meterCharge: v }))} prefix="৳" />
        </div>
      </Section>

      {/* Save button */}
      <button
        className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
        onClick={handleSave}
        style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
      >
        {saved ? `✅ ${t('settingsSaved')}` : `💾 ${t('saveSettings')}`}
      </button>
    </div>
  )
}
