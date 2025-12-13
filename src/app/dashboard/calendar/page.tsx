'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { CalendarClient } from './CalendarClient'
import { Loader } from '@/components/ui/loader'

export default function CalendarPage() {
  const router = useRouter()
  const [proId, setProId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await getCurrentUser()

        // Vérifier l'authentification
        if (!currentUser.user) {
          router.replace('/auth/login?redirect=/dashboard/calendar')
          return
        }

        // Vérifier le rôle pro
        if (!currentUser.profile || currentUser.profile.role !== 'pro') {
          router.replace('/')
          return
        }

        setProId(currentUser.user.uid)
      } catch (error) {
        console.error('[Calendar] Error loading user:', error)
        router.replace('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader />
          <p>Chargement du calendrier…</p>
        </div>
      </div>
    )
  }

  if (!proId) {
    return null
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <CalendarClient proId={proId} />
      </div>
    </div>
  )
}
