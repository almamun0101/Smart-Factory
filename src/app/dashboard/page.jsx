'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect /dashboard → /dashboard/machines
export default function DashboardPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/machines') }, [router])
  return null
}
