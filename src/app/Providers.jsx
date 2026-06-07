'use client'
// ─── Client Providers ─────────────────────────────────────────────────────────
// Separated from layout.jsx because layout.jsx must be a Server Component
// (for metadata export), but all context providers need 'use client'.
// ErrorBoundary here catches any crash and shows a readable error screen.

import { Component } from 'react'
import { LangProvider } from '@/context/LangContext'
import { AuthProvider } from '@/context/AuthContext'
import { SettingsProvider } from '@/context/SettingsContext'

// ─── Error Boundary ───────────────────────────────────────────────────────────
// Catches any unhandled React errors and shows details instead of blank screen.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#FFF8F8', padding: 24, fontFamily: 'sans-serif',
        }}>
          <div style={{
            maxWidth: 540, width: '100%', padding: 32, borderRadius: 16,
            background: 'white', border: '1px solid #FECACA',
            boxShadow: '0 4px 24px rgba(220,38,38,0.08)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>💥</div>
            <h2 style={{ color: '#DC2626', fontWeight: 800, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: 16 }}>
              The app crashed. Here is the error:
            </p>
            <pre style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
              padding: '12px 14px', fontSize: '0.78rem', color: '#DC2626',
              overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              marginBottom: 20,
            }}>
              {this.state.error?.message || String(this.state.error)}
              {'\n\n'}
              {this.state.error?.stack?.split('\n').slice(1, 6).join('\n')}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: '#DC2626', color: 'white', fontWeight: 700, fontSize: '0.875rem',
              }}
            >
              🔄 Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function Providers({ children }) {
  return (
    <ErrorBoundary>
      <LangProvider>
        <AuthProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </AuthProvider>
      </LangProvider>
    </ErrorBoundary>
  )
}
