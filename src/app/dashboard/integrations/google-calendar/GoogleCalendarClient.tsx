'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'   // ✅ AJOUT ICI
import { motion } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Loader } from '@/components/ui/loader'

interface GoogleCalendarStatus {
  connected: boolean
  googleEmail?: string
  autoSync?: boolean
}

export function GoogleCalendarClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null)
  const [plan, setPlan] = useState<'starter' | 'pro' | 'premium' | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get current user
        const currentUser = await getCurrentUser()

        if (!currentUser.user || !currentUser.profile) {
          router.push('/auth/login')
          return
        }

        if (currentUser.profile.role !== 'pro') {
          router.push('/')
          return
        }

        const uid = currentUser.user.uid

        // Get pro plan
        const proDoc = await getDoc(doc(db, 'pros', uid))
        let userPlan: 'starter' | 'pro' | 'premium' = 'starter'
        if (proDoc.exists()) {
          const proData = proDoc.data()
          userPlan = (proData?.plan as 'starter' | 'pro' | 'premium') || 'starter'
        }
        setPlan(userPlan)

        // Only load status if premium
        if (userPlan === 'premium') {
          // Load Google Calendar status
          const statusRes = await fetch('/api/google-calendar/status')
          if (statusRes.ok) {
            const statusData = await statusRes.json()
            setStatus(statusData)
          } else {
            // If API returns error, assume not connected
            setStatus({ connected: false, autoSync: false })
          }
        }
      } catch (err: any) {
        console.error('Error loading Google Calendar data:', err)
        setError(err.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleConnect = async () => {
    try {
      setConnecting(true)
      setError(null)

      const response = await fetch('/api/google-calendar/auth-url')
      if (!response.ok) {
        throw new Error('Erreur lors de la génération de l\'URL de connexion')
      }

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL de connexion non disponible')
      }
    } catch (err: any) {
      console.error('Error connecting:', err)
      setError(err.message || 'Erreur lors de la connexion')
      setConnecting(false)
    }
  }

  const handleToggleSync = async (enabled: boolean) => {
    try {
      setToggling(true)
      setError(null)

      const response = await fetch('/api/google-calendar/toggle-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la modification')
      }

      // Reload status
      const statusRes = await fetch('/api/google-calendar/status')
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setStatus(statusData)
      }
    } catch (err: any) {
      console.error('Error toggling sync:', err)
      setError(err.message || 'Erreur lors de la modification')
    } finally {
      setToggling(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter Google Calendar ?')) {
      return
    }

    try {
      setDisconnecting(true)
      setError(null)

      const response = await fetch('/api/google-calendar/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la déconnexion')
      }

      // Reload status
      const statusRes = await fetch('/api/google-calendar/status')
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setStatus(statusData)
      }
    } catch (err: any) {
      console.error('Error disconnecting:', err)
      setError(err.message || 'Erreur lors de la déconnexion')
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    )
  }

  // Check if user is premium
  if (plan !== 'premium') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="rounded-[32px] p-12 text-center max-w-2xl mx-auto">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Fonctionnalité Premium
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Cette fonctionnalité est réservée aux comptes Premium.
          </p>
          <Link href="/dashboard/subscription">
            <Button size="lg" className="rounded-[32px] text-lg px-8">
              Passer au Premium
            </Button>
          </Link>
        </Card>
      </motion.div>
    )
  }

  // Premium user - show integration UI
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="rounded-[32px] shadow-bookmeup p-8 max-w-3xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-[32px] text-sm">
            {error}
          </div>
        )}

        {!status?.connected ? (
          // Not connected
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-slate-900">
              Connectez Google Calendar
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Synchronisez automatiquement vos rendez-vous BookMeUp avec votre
              calendrier Google.
            </p>
            <Button
              onClick={handleConnect}
              disabled={connecting}
              size="lg"
              className="rounded-[32px] text-lg px-8"
            >
              {connecting ? 'Connexion...' : 'Se connecter avec Google'}
            </Button>
          </div>
        ) : (
          // Connected
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Google Calendar connecté
                </h2>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span>Connecté à : {status.googleEmail || 'Google Calendar'}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Synchronisation automatique
                  </h3>
                  <p className="text-sm text-gray-600">
                    Les nouveaux rendez-vous seront automatiquement ajoutés à
                    votre calendrier Google.
                  </p>
                </div>
                <Switch
                  checked={status.autoSync ?? false}
                  onChange={(e) => handleToggleSync(e.target.checked)}
                  disabled={toggling}
                />
              </div>

              <Button
                onClick={handleDisconnect}
                disabled={disconnecting}
                variant="outline"
                className="rounded-[32px] text-red-600 hover:text-red-700 hover:border-red-300 border-red-200"
              >
                {disconnecting ? 'Déconnexion...' : 'Déconnecter'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

