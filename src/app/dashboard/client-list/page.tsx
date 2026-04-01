'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentUser } from '@/lib/auth'
import { checkSubscriptionStatus } from '@/lib/subscription'

interface ClientData {
  identifier: string
  name: string
  email: string
  bookingsCount: number
  totalRevenue: number
  lastBookingDate: string
}

export default function ClientListPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<ClientData[]>([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'bookings' | 'revenue' | 'recent'>('recent')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const currentUser = await getCurrentUser()
        if (!currentUser.user || !currentUser.profile) {
          router.push('/auth/login')
          return
        }
        if (currentUser.profile.role !== 'pro') {
          router.push('/')
          return
        }

        const sub = await checkSubscriptionStatus(currentUser.user.uid)
        if (!sub.hasActiveSubscription) {
          router.push('/dashboard/settings/subscription')
          return
        }

        const uid = currentUser.user.uid

        const { db } = await import('@/lib/firebaseClient')
        const { collection, query, where, getDocs } = await import('firebase/firestore')

        const q1 = query(collection(db, 'bookings'), where('proId', '==', uid))
        const q2 = query(collection(db, 'bookings'), where('pro_id', '==', uid))

        const snapshots = await Promise.allSettled([getDocs(q1), getDocs(q2)])
        const bookingsById = new Map<string, any>()

        for (const res of snapshots) {
          if (res.status !== 'fulfilled') continue
          res.value.forEach((doc) => {
            if (!bookingsById.has(doc.id)) bookingsById.set(doc.id, doc.data())
          })
        }

        // Aggregate by client
        const clientMap = new Map<string, ClientData>()

        for (const data of bookingsById.values()) {
          if (data.status === 'cancelled') continue

          const clientEmail = data.clientEmail ?? data.client_email ?? ''
          const clientName = data.clientName ?? data.client_name ?? ''
          const clientKey = clientEmail || clientName || 'unknown'

          if (clientKey === 'unknown') continue

          const existing = clientMap.get(clientKey) ?? {
            identifier: clientKey,
            name: clientName || clientEmail,
            email: clientEmail,
            bookingsCount: 0,
            totalRevenue: 0,
            lastBookingDate: '',
          }

          existing.bookingsCount += 1
          const price = Number(data.price ?? data.amount ?? data.total ?? 0)
          if (Number.isFinite(price)) existing.totalRevenue += price

          const date = typeof data.date === 'string' ? data.date.slice(0, 10) : ''
          if (date > existing.lastBookingDate) existing.lastBookingDate = date

          if (!existing.name && clientName) existing.name = clientName
          if (!existing.email && clientEmail) existing.email = clientEmail

          clientMap.set(clientKey, existing)
        }

        setClients(Array.from(clientMap.values()))
      } catch (error) {
        console.error('[ClientList] Error:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  const filtered = useMemo(() => {
    let list = clients
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      )
    }

    switch (sortBy) {
      case 'name':
        return [...list].sort((a, b) => a.name.localeCompare(b.name))
      case 'bookings':
        return [...list].sort((a, b) => b.bookingsCount - a.bookingsCount)
      case 'revenue':
        return [...list].sort((a, b) => b.totalRevenue - a.totalRevenue)
      case 'recent':
      default:
        return [...list].sort((a, b) => b.lastBookingDate.localeCompare(a.lastBookingDate))
    }
  }, [clients, search, sortBy])

  const formatEUR = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(v)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-sm text-[#8a7a92]">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        Chargement des clients…
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Clientèle
        </div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">Mes clients</h1>
        <p className="text-sm text-[#8a7a92]">
          Retrouvez tous vos clients avec leur historique de réservations et revenus.
        </p>
      </motion.div>

      {/* Search + Sort */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B5A8BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-[14px] border border-[#EDE8F0] bg-[#FDFBFE] text-sm text-[#2A1F2D] placeholder:text-[#B5A8BE] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {([['recent', 'Récents'], ['bookings', 'Réservations'], ['revenue', 'Revenus'], ['name', 'Nom']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                sortBy === key
                  ? 'bg-primary text-white shadow-[0_2px_8px_rgba(200,109,215,0.3)]'
                  : 'text-[#8a7a92] hover:bg-[#F5F0F7]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="flex items-center gap-4 flex-wrap"
      >
        <div className="px-4 py-2 rounded-full bg-white border border-primary/10 text-xs font-bold text-[#2A1F2D]">
          {clients.length} client{clients.length > 1 ? 's' : ''} au total
        </div>
        <div className="px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/60 text-xs font-bold text-emerald-600">
          {formatEUR(clients.reduce((s, c) => s + c.totalRevenue, 0))} de CA total
        </div>
      </motion.div>

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-[#EDE8F0] bg-[#F5F0F7] px-6 py-10 text-center">
          <p className="text-sm text-[#8a7a92]">
            {search ? 'Aucun client ne correspond à votre recherche.' : 'Aucun client pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((client, idx) => (
              <motion.div
                key={client.identifier}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="bg-white rounded-[18px] border border-primary/8 p-4 flex items-center gap-4 shadow-[0_2px_12px_rgba(20,0,50,0.03)] hover:shadow-[0_4px_16px_rgba(20,0,50,0.06)] transition-all"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {(client.name || '?')[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#2A1F2D] truncate">{client.name || 'Client'}</p>
                  <p className="text-[11px] text-[#8a7a92] truncate">{client.email || '—'}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-bold text-[#2A1F2D]">{client.bookingsCount}</p>
                    <p className="text-[10px] text-[#B5A8BE]">RDV</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-bold text-emerald-600">{formatEUR(client.totalRevenue)}</p>
                    <p className="text-[10px] text-[#B5A8BE]">Revenus</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-[#8a7a92]">
                      {client.lastBookingDate
                        ? new Date(`${client.lastBookingDate}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                        : '—'}
                    </p>
                    <p className="text-[10px] text-[#B5A8BE]">Dernier RDV</p>
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
