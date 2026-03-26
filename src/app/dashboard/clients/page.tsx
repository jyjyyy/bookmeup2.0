'use client'

// Note: This is a Client Component. Authentication is handled via API routes
// that read cookies server-side. We use fetch with credentials: 'include' to send cookies.
// DO NOT import or use cookies() from 'next/headers' here - it's server-only.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ClientsSkeleton } from '@/components/ui/skeleton'
import { getCurrentUser } from '@/lib/auth'
import { checkSubscriptionStatus } from '@/lib/subscription'

interface BlockedClient {
  id: string
  name: string | null
  email: string | null
  cancelCount: number
  noShowCount: number
}

export default function ClientsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<BlockedClient[]>([])
  const [error, setError] = useState<string | null>(null)
  const [unblocking, setUnblocking] = useState<string | null>(null)

  useEffect(() => {
    const loadClients = async () => {
      try {
        setError(null)
        setLoading(true)

        // Vérifier l'authentification
        const currentUser = await getCurrentUser()
        
        if (!currentUser.user || !currentUser.profile) {
          router.push('/auth/login')
          return
        }

        if (currentUser.profile.role !== 'pro') {
          router.push('/search')
          return
        }

        // Vérifier l'abonnement
        const subscriptionStatus = await checkSubscriptionStatus(currentUser.user.uid)
        
        if (!subscriptionStatus.hasActiveSubscription) {
          router.push('/dashboard/settings/subscription')
          return
        }

        // Charger les clients bloqués
        const response = await fetch('/api/clients/blocked', {
          credentials: 'include',
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Erreur lors du chargement des clients bloqués')
        }

        const data = await response.json()
        setClients(data.clients || [])
      } catch (err: any) {
        console.error('[Clients Page] Error:', err)
        setError(err.message || 'Une erreur est survenue')
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [router])

  const handleUnblock = async (clientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir débloquer ce client ?')) {
      return
    }

    setUnblocking(clientId)

    try {
      const response = await fetch('/api/clients/unblock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ clientId }),
      })

      const data = await response.json()

      if (response.ok) {
        // Retirer le client de la liste
        setClients((prev) => prev.filter((c) => c.id !== clientId))
      } else {
        alert(data.error || 'Erreur lors du déblocage')
      }
    } catch (error) {
      console.error('[Clients Page] Unblock error:', error)
      alert('Erreur lors du déblocage')
    } finally {
      setUnblocking(null)
    }
  }

  if (loading) {
    return <ClientsSkeleton />
  }

  if (error) {
    return (
      <div className="py-6">
        <div className="bg-red-50 border border-red-200 rounded-[16px] p-5 text-red-700">
          <p className="font-semibold text-sm mb-1">Erreur</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">
          Clients bloqués
        </h1>
        <p className="text-sm text-[#7A6B80]">
          Gérez les clients ayant annulé ou manqué trop de rendez-vous.
        </p>
      </div>

      {/* Liste des clients bloqués ou état vide */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-[#EDE8F0] p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
            <h2 className="text-base font-bold text-[#2A1F2D] mb-2">
              Aucun client bloqué pour le moment
            </h2>
            <p className="text-sm text-[#7A6B80] leading-relaxed">
              Les clients ayant annulé ou manqué trop de rendez-vous apparaîtront ici.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <div key={client.id} className="bg-white rounded-[20px] border border-[#EDE8F0] shadow-bookmeup-sm p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-bold text-[#2A1F2D]">
                      {client.name || client.email || 'Client anonyme'}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                      Bloqué
                    </span>
                  </div>
                  {client.name && client.email && (
                    <p className="text-xs text-[#7A6B80] mb-2">{client.email}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-[#7A6B80]">
                    <span>Annulations : <strong className="text-[#2A1F2D]">{client.cancelCount}</strong></span>
                    <span>Absences : <strong className="text-[#2A1F2D]">{client.noShowCount}</strong></span>
                    <span>Total : <strong className="text-[#2A1F2D]">{client.cancelCount + client.noShowCount}</strong></span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Button
                    onClick={() => handleUnblock(client.id)}
                    disabled={unblocking === client.id}
                    className="btn-gradient rounded-[12px] text-sm font-semibold disabled:opacity-50"
                  >
                    {unblocking === client.id ? 'Déblocage…' : 'Débloquer'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

