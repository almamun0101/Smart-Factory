'use client'
// ─── Calculation Page ─────────────────────────────────────────────────────────
// Combines electricity recharges + machine costs per month.
// Shows:
//  - Grand total summary cards at top
//  - Per-month accordion cards:
//    - Total recharge → net meter balance (after deductions)
//    - Per-machine cost breakdown
//    - Final: net balance − machine costs = remaining / deficit

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useLang } from '@/context/LangContext'
import { getAllReadings, subscribeRecharges } from '@/lib/db'
import { format, parseISO, isSameMonth, startOfMonth } from 'date-fns'
import { monthNames, monthShort } from '@/lib/i18n'

// ─── Small summary stat card ──────────────────────────────────────────────────
function StatCard({ icon, label, value, color = 'blue', sub }) {
  const colors = {
    blue:   { bg: 'var(--brand-light)',   text: 'var(--brand)',  border: 'var(--brand-mid)' },
    green:  { bg: 'var(--green-light)',   text: 'var(--green)',  border: '#86EFAC' },
    amber:  { bg: 'var(--amber-light)',   text: 'var(--amber)',  border: '#FCD34D' },
    red:    { bg: 'var(--red-light)',     text: 'var(--red)',    border: '#FECACA' },
    violet: { bg: 'var(--violet-light)',  text: 'var(--violet)', border: '#C4B5FD' },
  }
  const c = colors[color] || colors.blue
  return (
    <div style={{ flex: 1, minWidth: 140, padding: '16px', borderRadius: 14, background: c.bg, border: `1px solid ${c.border}` }}>
      <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: c.text, fontFamily: 'var(--font-mono)' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2, fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  )
}

// ─── Per-month calculation card ───────────────────────────────────────────────
function MonthCalcCard({ monthKey, monthData, recharges, deductionConfig, machines, index }) {
  const [expanded, setExpanded] = useState(index === 0)
  const { t, lang } = useLang()

  const monthDate = new Date(monthKey + '-01')
  const monthNum = monthDate.getMonth()
  const year = monthDate.getFullYear()
  const monthLabel = `${monthNames[lang]?.[monthNum]} ${year}`
  const shortLabel = monthShort[lang]?.[monthNum]

  // Filter recharges for this month
  const monthRecharges = recharges.filter(r => isSameMonth(parseISO(r.date), monthDate))
  const totalRecharge = monthRecharges.reduce((s, r) => s + r.amount, 0)
  const localAmount = monthRecharges.filter(r => r.source === 'local').reduce((s, r) => s + r.amount, 0)

  // Net meter balance after deductions
  const localSurcharge = localAmount * (deductionConfig.localSurchargePercent / 100)
  const gross = totalRecharge + localSurcharge
  const vat = gross * (deductionConfig.vatPercent / 100)
  const netMeter = gross - vat - deductionConfig.demandCharge - deductionConfig.meterCharge

  // Machine totals
  const readings = Object.values(monthData?.readings || {})
  const totalMachineCost = readings.reduce((s, r) => s + (r.totalCost || 0), 0)
  const totalMachineUnit = readings.reduce((s, r) => s + (r.totalUnit || 0), 0)

  // Final: what's left after paying all machines
  const remaining = netMeter - totalMachineCost
  const isPositive = remaining >= 0

  if (totalRecharge === 0 && totalMachineCost === 0) return null

  return (
    <div className="card animate-up" style={{
      overflow: 'hidden',
      borderColor: expanded ? (isPositive ? '#86EFAC' : '#FECACA') : 'var(--border)',
      transition: 'border-color 0.2s ease',
    }}>
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
            background: expanded ? (isPositive ? 'linear-gradient(135deg, #16A34A, #4ADE80)' : 'linear-gradient(135deg, #DC2626, #F87171)') : 'var(--bg-subtle)',
            color: expanded ? 'white' : 'var(--text-muted)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.65rem', lineHeight: 1.2,
            boxShadow: expanded ? `0 2px 8px ${isPositive ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}` : 'none',
            transition: 'all 0.2s ease',
          }}>
            <span style={{ fontSize: '0.9rem' }}>{shortLabel}</span>
            <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>{year}</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{monthLabel}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {monthRecharges.length} {t('rechargeCount')} · {readings.length} {t('machineCount')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {isPositive ? t('remaining') : t('deficit')}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: isPositive ? 'var(--green)' : 'var(--red)' }}>
              ৳{Math.abs(remaining).toFixed(0)}
            </div>
          </div>
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)', transition: 'transform 0.2s ease', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="animate-up" style={{ padding: '0 16px 16px' }}>
          {/* Stat row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <StatCard icon="⚡" label={t('totalRecharge')} value={`৳${totalRecharge.toFixed(0)}`} color="amber" />
            <StatCard icon="🔌" label={t('netMeterBalance')} value={`৳${netMeter.toFixed(0)}`} color="blue" />
            <StatCard icon="🔧" label={t('machineCost')} value={`৳${totalMachineCost.toFixed(0)}`} color="violet" sub={`${totalMachineUnit.toFixed(0)} kWh`} />
            <StatCard
              icon={isPositive ? '✅' : '⚠️'}
              label={isPositive ? t('remainingBalance') : t('netDeficit')}
              value={`৳${Math.abs(remaining).toFixed(0)}`}
              color={isPositive ? 'green' : 'red'}
            />
          </div>

          {/* Machine breakdown table */}
          {readings.length > 0 && (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 14 }}>
              <div style={{ padding: '10px 14px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🔧 {t('machineBreakdown')}
                </span>
              </div>
              {machines.map(m => {
                const r = monthData?.readings?.[m.id]
                if (!r) return null
                return (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderBottom: '1px solid var(--border)',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 6, fontFamily: 'var(--font-mono)' }}>{m.model}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{r.totalUnit?.toFixed(1)} kWh</span>
                      <span style={{ fontWeight: 800, color: 'var(--brand)', fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>৳{r.totalCost?.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Final calculation */}
          <div style={{
            padding: '14px 16px', borderRadius: 12,
            background: isPositive ? 'var(--green-light)' : 'var(--red-light)',
            border: `1px solid ${isPositive ? '#86EFAC' : '#FECACA'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('netMeterBalance')}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>৳{netMeter.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>− {t('machineCost')}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--red)' }}>৳{totalMachineCost.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${isPositive ? '#86EFAC' : '#FECACA'}`, paddingTop: 10 }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{isPositive ? t('remainingBalance') : t('netDeficit')}</span>
              <span style={{ fontWeight: 900, fontSize: '1.15rem', fontFamily: 'var(--font-mono)', color: isPositive ? 'var(--green)' : 'var(--red)' }}>
                ৳{Math.abs(remaining).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Calculation Page ────────────────────────────────────────────────────
export default function CalculationPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { t } = useLang()

  const [allReadings, setAllReadings] = useState({})
  const [recharges, setRecharges] = useState([])

  useEffect(() => {
    if (!user) return
    getAllReadings(user.uid).then(setAllReadings)
    return subscribeRecharges(user.uid, setRecharges)
  }, [user])

  // Collect all months that have either recharges or readings
  const monthKeys = Array.from(new Set([
    ...Object.keys(allReadings),
    ...recharges.map(r => format(startOfMonth(parseISO(r.date)), 'yyyy-MM')),
  ])).sort((a, b) => b.localeCompare(a))

  // Grand totals across all time
  const grandRecharge = recharges.reduce((s, r) => s + r.amount, 0)
  const grandMachine = Object.values(allReadings).reduce(
    (s, m) => s + Object.values(m.readings || {}).reduce((ss, r) => ss + (r.totalCost || 0), 0), 0
  )
  const grandNet = grandRecharge - grandMachine

  return (
    <div style={{ padding: '28px 24px', maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-title">📊 {t('calculation')}</h1>
        <p className="section-sub">{t('calculationDesc')}</p>
      </div>

      {/* Grand totals */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard icon="⚡" label={t('allTimeRecharge')} value={`৳${grandRecharge.toFixed(0)}`} color="amber" />
        <StatCard icon="🔧" label={t('allTimeMachineCost')} value={`৳${grandMachine.toFixed(0)}`} color="blue" />
        <StatCard
          icon={grandNet >= 0 ? '✅' : '⚠️'}
          label={grandNet >= 0 ? t('netBalance') : t('netDeficit')}
          value={`৳${Math.abs(grandNet).toFixed(0)}`}
          color={grandNet >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Empty state */}
      {monthKeys.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t('noCalcData')}</p>
        </div>
      )}

      {/* Month cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {monthKeys.map((key, i) => (
          <MonthCalcCard
            key={key}
            monthKey={key}
            monthData={allReadings[key] || null}
            recharges={recharges}
            deductionConfig={settings.deductionConfig}
            machines={settings.machines}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
