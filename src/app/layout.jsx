// ─── Root Layout (Server Component) ──────────────────────────────────────────
// This file MUST be a Server Component (no 'use client') so Next.js can
// export `metadata`. Client providers are moved to Providers.jsx.

import './globals.css'
import { Providers } from './Providers'

export const metadata = {
  title: 'FactoryBill — Energy Manager',
  description: 'Machine billing & electricity management for factories',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
