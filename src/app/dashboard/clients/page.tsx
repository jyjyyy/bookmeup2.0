'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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

        const currentUser = await getCurrentUser()

        if (!currentUser.user || !currentUser.profile) {
          router.push('/auth/login')
          return
        }

        if (currentUser.profile.role !== 'pro') {
          router.push('/search')
          return
        }

        const subscriptionStatus = await checkSubscriptionStatus(currentUser.user.uid)

        if (!subscriptionStatus.hasActiveSubscription) {
          router.push('/dashboard/settings/subscription')
          return
        }

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
        <div className="bg-red-50/80 border border-red-200/60 rounded-[18px] p-5 flex items-center gap-3 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-[12px] bg-red-100 flex items-center justify-center text-lg shrink-0">⚠️</div>
          <div>
            <p className="font-bold text-sm text-red-700 mb-0.5">Erreur</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Gestion
        </div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">
          Clients bloqués
        </h1>
        <p className="text-sm text-[#8a7a92]">
          Gérez les clients ayant annulé ou manqué trop de rendez-vous.
        </p>
      </motion.div>

      {/* Count badge */}
      {clients.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="flex items-center gap-2"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-white border border-red-200/40 shadow-[0_2px_8px_rgba(20,0,50,0.03)]">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-sm font-bold text-[#2A1F2D]">{clients.length}</span>
            <span className="text-xs text-[#8a7a92]">client{clients.length > 1 ? 's' : ''} bloqué{clients.length > 1 ? 's' : ''}</span>
          </div>
        </motion.div>
      )}

      {/* Empty state or client list */}
      {clients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-[28px] border border-primary/10 p-16 text-center shadow-[0_8px_40px_rgba(20,0,50,0.05)]"
        >
          <div className="max-w-sm mx-auto">
            <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center mx-auto mb-6 text-4xl shadow-[0_4px_16px_rgba(16,185,129,0.1)]">
              ✅
            </div>
            <h2 className="text-xl font-extrabold text-[#2A1F2D] mb-2">
              Aucun client bloqué
            </h2>
            <p className="text-sm text-[#8a7a92] leading-relaxed">
              Les clients ayant annulé ou manqué trop de rendez-vous apparaîtront ici automatiquement.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {clients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-[20px] border border-[#EDE8F0] shadow-[0_4px_20px_rgba(20,0,50,0.04)] hover:shadow-[0_6px_28px_rgba(20,0,50,0.07)] hover:border-primary/12 transition-all duration-300 p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-red-50 to-red-100/50 flex items-center justify-center flex-shrink-0 border border-red-200/40">
                      <span className="text-lg">🚫</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="text-sm font-bold text-[#2A1F2D]">
                          {client.name || client.email || 'Client anonyme'}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-bold border border-red-200/40 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          Bloqué
                        </span>
                      </div>
                      {client.name && client.email && (
                        <p className="text-xs text-[#8a7a92] mb-2.5">{client.email}</p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F0F7] text-xs">
                          <span className="text-[10px]">❌</span>
                          <span className="text-[#8a7a92]">Annulations :</span>
                          <span className="font-bold text-[#2A1F2D]">{client.cancelCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F0F7] text-xs">
                          <span className="text-[10px]">👻</span>
                          <span className="text-[#8a7a92]">Absences :</span>
                          <span className="font-bold text-[#2A1F2D]">{client.noShowCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleUnblock(client.id)}
                      disabled={unblocking === client.id}
                      className="btn-gradient rounded-full px-6 py-2.5 text-sm font-bold shadow-[0_4px_16px_rgba(200,109,215,0.3)] hover:shadow-[0_6px_24px_rgba(200,109,215,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      {unblocking === client.id ? 'Déblocage…' : 'Débloquer'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
