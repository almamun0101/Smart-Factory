'use client'
// ─── Machines Page ────────────────────────────────────────────────────────────
// DATA STORED IN DB per machine reading:
//   { machineId, mode, inputUnit, peakUnit, offPeakUnit, totalUnit, totalCost }
//
// MODE is restored from DB — card auto-selects peak/total toggle from saved data.
// ALL fields (peak, offpeak, total) are saved and loaded, not just totalCost.
// Previous month values are fetched from DB and shown as hints.
// Rates always come live from settings context (never stale).

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useLang } from '@/context/LangContext'
import { subscribeMonthReadings, saveMonthReadings, getAllReadings } from '@/lib/db'
import { format, subMonths, startOfMonth } from 'date-fns'
import { monthNames, monthShort } from '@/lib/i18n'

// ─── Utils ────────────────────────────────────────────────────────────────────
const key  = d => format(d, 'yyyy-MM')
const prev = d => format(subMonths(d, 1), 'yyyy-MM')
const f2   = n => (parseFloat(n) || 0).toFixed(2)
const fp   = n => parseFloat(n) || 0

function cost(units, rate) {
  return Math.round(fp(units) * fp(rate) * 100) / 100
}

// ─── Minimal text input ───────────────────────────────────────────────────────
function NumField({ label, value, onChange, sub, accent }) {
  const colors = {
    default: { b: '#E4E8F0', bg: '#FAFBFF' },
    amber:   { b: '#FCD34D', bg: '#FFFDF5' },
    violet:  { b: '#C4B5FD', bg: '#FDFAFF' },
  }
  const c = colors[accent] || colors.default
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <label style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.01em' }}>
          {label}
        </label>
        {sub !== undefined && (
          <span style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
            prev {f2(sub)}
          </span>
        )}
      </div>
      <div style={{ position:'relative' }}>
        <input
          type="number" min="0" step="0.01"
          value={value || ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          style={{
            width:'100%', padding:'10px 42px 10px 12px',
            border:`1.5px solid ${c.b}`, borderRadius:9,
            background:c.bg, color:'var(--text-primary)',
            fontFamily:'var(--font-mono)', fontSize:'0.95rem',
            outline:'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--brand)'}
          onBlur={e  => e.target.style.borderColor = c.b}
        />
        <span style={{
          position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
          fontSize:'0.68rem', fontWeight:700, color:'var(--text-muted)',
        }}>kWh</span>
      </div>
    </div>
  )
}

// ─── Machine Card ─────────────────────────────────────────────────────────────
// Key fix: initialize all state from `saved` (DB data), not hardcoded defaults.
// This restores mode, inputUnit, peakUnit, offPeakUnit from what was saved.
function MachineCard({ machineId, machineName, machineModel, saved, prevReading, onChange }) {
  const { settings } = useSettings()
  const pc = settings.priceConfig

  // ── Init from DB-saved data (fixes toggle not restoring from DB) ──────────
  const [mode,        setMode]        = useState(saved?.mode       || 'total')
  const [inputUnit,   setInputUnit]   = useState(fp(saved?.inputUnit))
  const [peakUnit,    setPeakUnit]    = useState(fp(saved?.peakUnit))
  const [offPeakUnit, setOffPeakUnit] = useState(fp(saved?.offPeakUnit))

  // Previous month's cumulative readings from DB
  const prevInput   = fp(prevReading?.inputUnit)
  const prevPeak    = fp(prevReading?.peakUnit)
  const prevOffPeak = fp(prevReading?.offPeakUnit)

  // Net consumed this month = this reading − last month's reading
  const netTotal   = Math.max(0, inputUnit   - prevInput)
  const netPeak    = Math.max(0, peakUnit    - prevPeak)
  const netOffPeak = Math.max(0, offPeakUnit - prevOffPeak)

  // Cost using live float rate from DB
  const peakCost   = cost(netPeak,    pc.peakRate)
  const offPkCost  = cost(netOffPeak, pc.offPeakRate)
  const totalCost  = mode === 'total'
    ? cost(netTotal, pc.totalRate)
    : peakCost + offPkCost
  const netUnit    = mode === 'total' ? netTotal : netPeak + netOffPeak

  // Re-sync if parent passes updated saved data (e.g. after DB load)
  const prevSavedRef = useRef(null)
  useEffect(() => {
    const sig = JSON.stringify(saved)
    if (sig === prevSavedRef.current) return
    prevSavedRef.current = sig
    if (saved) {
      setMode(saved.mode || 'total')
      setInputUnit(fp(saved.inputUnit))
      setPeakUnit(fp(saved.peakUnit))
      setOffPeakUnit(fp(saved.offPeakUnit))
    }
  }, [saved])

  // Notify parent on any change (skip first render)
  const isFirst = useRef(true)
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    onChange({
      machineId, mode,
      inputUnit, peakUnit, offPeakUnit,
      totalUnit: netUnit,
      totalCost,
      // Store all derived values too so dashboard can show them
      netTotal, netPeak, netOffPeak,
      peakCost, offPkCost,
      rateUsed: mode === 'total' ? pc.totalRate : null,
      peakRate: pc.peakRate,
      offPeakRate: pc.offPeakRate,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, inputUnit, peakUnit, offPeakUnit, pc.totalRate, pc.peakRate, pc.offPeakRate])

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 14,
      background: 'var(--bg-card)', overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-subtle)',
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {machineName}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
            {machineModel}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Cost</div>
          <div style={{
            fontSize: '1.15rem', fontWeight: 900, fontFamily: 'var(--font-mono)',
            color: totalCost > 0 ? 'var(--brand)' : 'var(--text-muted)',
          }}>
            ৳{f2(totalCost)}
          </div>
          {netUnit > 0 && (
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {f2(netUnit)} kWh
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Mode toggle — auto-selected from DB */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
          background: '#F0F2F8', padding: 3, borderRadius: 8,
        }}>
          {[
            { val: 'total',    label: 'Total Unit' },
            { val: 'peakhour', label: 'Peak / Off-Peak' },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setMode(val)} style={{
              padding: '7px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-main)', fontWeight: 700, fontSize: '0.75rem',
              background: mode === val ? 'var(--bg-card)' : 'transparent',
              color: mode === val ? 'var(--brand)' : 'var(--text-muted)',
              boxShadow: mode === val ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.12s',
            }}>{label}</button>
          ))}
        </div>

        {/* Total unit mode */}
        {mode === 'total' && (
          <>
            <NumField
              label="Meter Reading"
              value={inputUnit}
              onChange={setInputUnit}
              sub={prevInput}
            />
            {/* Inline formula */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: 8,
              background: 'var(--brand-light)', border: '1px solid var(--brand-mid)',
              fontSize: '0.75rem',
            }}>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                ({f2(inputUnit)} − {f2(prevInput)}) × ৳{f2(pc.totalRate)}
              </span>
              <span style={{ fontWeight: 800, color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>
                ৳{f2(totalCost)}
              </span>
            </div>
          </>
        )}

        {/* Peak / off-peak mode */}
        {mode === 'peakhour' && (
          <>
            <NumField label="Peak Reading" value={peakUnit} onChange={setPeakUnit} sub={prevPeak} accent="amber" />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '7px 10px', borderRadius: 7,
              background: 'var(--amber-light)', border: '1px solid #FCD34D',
              fontSize: '0.72rem', marginTop: -4,
            }}>
              <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                ({f2(peakUnit)} − {f2(prevPeak)}) × ৳{f2(pc.peakRate)}
              </span>
              <span style={{ fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                ৳{f2(peakCost)}
              </span>
            </div>

            <NumField label="Off-Peak Reading" value={offPeakUnit} onChange={setOffPeakUnit} sub={prevOffPeak} accent="violet" />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '7px 10px', borderRadius: 7,
              background: 'var(--violet-light)', border: '1px solid #C4B5FD',
              fontSize: '0.72rem', marginTop: -4,
            }}>
              <span style={{ color: 'var(--violet)', fontFamily: 'var(--font-mono)' }}>
                ({f2(offPeakUnit)} − {f2(prevOffPeak)}) × ৳{f2(pc.offPeakRate)}
              </span>
              <span style={{ fontWeight: 800, color: 'var(--violet)', fontFamily: 'var(--font-mono)' }}>
                ৳{f2(offPkCost)}
              </span>
            </div>
          </>
        )}

        {/* Net result */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '9px 12px', borderRadius: 8,
          background: netUnit > 0 ? 'var(--green-light)' : 'var(--bg-subtle)',
          border: `1px solid ${netUnit > 0 ? '#86EFAC' : 'var(--border)'}`,
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: netUnit > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
            Net consumed
          </span>
          <span style={{ fontWeight: 900, fontFamily: 'var(--font-mono)', color: netUnit > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
            {f2(netUnit)} kWh
          </span>
        </div>

      </div>
    </div>
  )
}

// ─── Month Card ───────────────────────────────────────────────────────────────
function MonthCard({ monthDate, defaultExpanded }) {
  const [open,      setOpen]      = useState(defaultExpanded)
  const [monthData, setMonthData] = useState(null)   // live from DB
  const [prevData,  setPrevData]  = useState(null)   // prev month from DB
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [err,       setErr]       = useState(null)

  const { user }     = useAuth()
  const { settings } = useSettings()
  const { t, lang }  = useLang()

  const mk      = key(monthDate)
  const pmk     = prev(monthDate)
  const mNum    = monthDate.getMonth()
  const year    = monthDate.getFullYear()
  const mLabel  = `${monthNames[lang]?.[mNum] ?? monthNames.en[mNum]} ${year}`
  const mShort  = monthShort[lang]?.[mNum] ?? monthShort.en[mNum]

  // Subscribe to this month — fires every time DB updates
  useEffect(() => {
    if (!user || !open) return
    const unsub = subscribeMonthReadings(user.uid, mk, data => {
      setMonthData(data)
      setErr(null)
    })
    return unsub
  }, [user, mk, open])

  // Fetch previous month once when opened
  useEffect(() => {
    if (!user || !open) return
    getAllReadings(user.uid)
      .then(all => setPrevData(all[pmk] || null))
      .catch(() => {})
  }, [user, pmk, open])

  // Local edits to readings (before save)
  const localReadings = useRef({})

  const handleChange = useCallback((machineId, reading) => {
    localReadings.current[machineId] = reading
    setSaved(false)
  }, [])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setErr(null)
    // Merge local edits into monthData readings
    const base = monthData?.readings || {}
    const merged = { ...base, ...localReadings.current }
    try {
      await saveMonthReadings(user.uid, { monthKey: mk, readings: merged })
      setSaved(true)
      localReadings.current = {}
      setTimeout(() => setSaved(false), 2500)
    } catch(e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Aggregate totals from saved DB readings
  const readings   = Object.values(monthData?.readings || {})
  const totalUnit  = readings.reduce((s, r) => s + fp(r.totalUnit), 0)
  const totalCost  = readings.reduce((s, r) => s + fp(r.totalCost), 0)

  return (
    <div style={{
      border: `1px solid ${open ? 'var(--brand-mid)' : 'var(--border)'}`,
      borderRadius: 14, background: 'var(--bg-card)',
      boxShadow: open ? '0 2px 12px rgba(37,99,235,0.07)' : 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}>

      {/* Month header — tap to expand */}
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-main)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Month pill */}
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: open ? 'var(--brand)' : 'var(--bg-subtle)',
            color: open ? 'white' : 'var(--text-muted)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, lineHeight: 1.2, transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: '0.78rem' }}>{mShort}</span>
            <span style={{ fontSize: '0.55rem', opacity: 0.75 }}>{year}</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: open ? 'var(--brand)' : 'var(--text-primary)' }}>
              {mLabel}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 1 }}>
              {settings.machines.length} {t('machineCount')}
              {prevData && <span style={{ color: 'var(--green)', marginLeft: 6 }}>· prev data ✓</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {totalCost > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>
                ৳{f2(totalCost)}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {f2(totalUnit)} kWh
              </div>
            </div>
          )}
          <span style={{
            fontSize: '0.7rem', color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
            display: 'inline-block',
          }}>▼</span>
        </div>
      </button>

      {/* Expanded */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>

          {/* Rate info strip */}
          <div style={{
            padding: '8px 16px', display: 'flex', gap: 12, flexWrap: 'wrap',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-subtle)',
            fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}>
            <span>Total <span style={{ color: 'var(--brand)' }}>৳{f2(settings.priceConfig.totalRate)}</span></span>
            <span>Peak <span style={{ color: 'var(--amber)' }}>৳{f2(settings.priceConfig.peakRate)}</span></span>
            <span>Off-Peak <span style={{ color: 'var(--violet)' }}>৳{f2(settings.priceConfig.offPeakRate)}</span></span>
            <span style={{ marginLeft: 'auto', color: 'var(--green-600)', fontSize: '0.65rem', fontWeight: 600, fontFamily: 'var(--font-main)' }}>
              Live from DB
            </span>
          </div>

          {err && (
            <div style={{ margin: '10px 14px 0', padding: '8px 12px', borderRadius: 8, background: 'var(--red-light)', color: 'var(--red)', fontSize: '0.78rem', fontWeight: 600, border: '1px solid #FECACA' }}>
              ⚠ {err}
            </div>
          )}

          {/* Machine cards */}
          <div style={{
            padding: '12px 12px 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 10,
          }}>
            {settings.machines.map(m => (
              <MachineCard
                key={m.id}
                machineId={m.id}
                machineName={m.name}
                machineModel={m.model}
                // Pass full saved reading from DB — restores mode + all fields
                saved={monthData?.readings?.[m.id] || null}
                prevReading={prevData?.readings?.[m.id] || null}
                onChange={r => handleChange(m.id, r)}
              />
            ))}
          </div>

          {/* Save bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', margin: '12px 0 0',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-subtle)',
            flexWrap: 'wrap', gap: 8,
            position: 'sticky', bottom: 0, zIndex: 10,
          }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {t('totalUnits')}
                </div>
                <div style={{ fontWeight: 900, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                  {f2(totalUnit)} kWh
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {t('totalCost')}
                </div>
                <div style={{ fontWeight: 900, color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>
                  ৳{f2(totalCost)}
                </div>
              </div>
            </div>
            <button
              className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '10px 22px' }}
            >
              {saving ? '⏳ Saving...' : saved ? '✅ Saved' : '💾 Save Month'}
            </button>
          </div>

        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MachinesPage() {
  const { t } = useLang()
  const now   = new Date()
  const months = Array.from({ length: 12 }, (_, i) => subMonths(startOfMonth(now), i))

  return (
    <div style={{ padding: '20px 16px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 className="section-title">🔧 {t('machineBilling')}</h1>
        <p className="section-sub">{t('machineBillingDesc')}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {months.map((m, i) => (
          <MonthCard key={key(m)} monthDate={m} defaultExpanded={i === 0} />
        ))}
      </div>
    </div>
  )
}
