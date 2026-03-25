'use client'

// Note: This is a Client Component. Authentication is handled via API routes
// that read cookies server-side. We use fetch with credentials: 'include' to send cookies.
// DO NOT import or use cookies() from 'next/headers' here - it's server-only.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
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
      <div className="py-12">
        <Card className="rounded-[32px] p-6 bg-red-50 border-red-200">
          <div className="text-red-700">
            <p className="font-semibold mb-2">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#2A1F2D] mb-2">
          Clients bloqués
        </h1>
        <p className="text-slate-600">
          Gérez les clients ayant annulé ou manqué trop de rendez-vous.
        </p>
      </div>

      {/* Liste des clients bloqués ou état vide */}
      {clients.length === 0 ? (
        <Card className="rounded-[32px] p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-[#2A1F2D] mb-3">
              Aucun client bloqué pour le moment
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Les clients ayant annulé ou manqué trop de rendez-vous apparaîtront ici.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {clients.map((client) => (
            <Card key={client.id} className="rounded-[32px] p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Informations client */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[#2A1F2D]">
                      {client.name || client.email || 'Client anonyme'}
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                      Bloqué
                    </span>
                  </div>
                  {client.name && client.email && (
                    <p className="text-sm text-slate-600 mb-3">{client.email}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <div>
                      <span className="font-medium">Annulations :</span>{' '}
                      <span className="text-[#2A1F2D]">{client.cancelCount}</span>
                    </div>
                    <div>
                      <span className="font-medium">Absences :</span>{' '}
                      <span className="text-[#2A1F2D]">{client.noShowCount}</span>
                    </div>
                    <div>
                      <span className="font-medium">Total :</span>{' '}
                      <span className="text-[#2A1F2D]">
                        {client.cancelCount + client.noShowCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton débloquer */}
                <div className="flex-shrink-0">
                  <Button
                    onClick={() => handleUnblock(client.id)}
                    disabled={unblocking === client.id}
                    className="rounded-[32px] bg-primary text-white hover:bg-primaryDark transition-colors disabled:opacity-50"
                  >
                    {unblocking === client.id ? 'Déblocage...' : 'Débloquer'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

