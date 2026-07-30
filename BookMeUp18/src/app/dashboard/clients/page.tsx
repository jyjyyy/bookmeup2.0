"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/motion"
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  Ban,
  User,
} from "lucide-react"
import type { Booking } from "@/lib/types"

interface ClientSummary {
  name: string
  email: string
  phone: string
  bookingCount: number
  lastDate: string
  statuses: Record<string, number>
}

export default function ClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!user) return

    async function fetchClients() {
      try {
        const q = query(
          collection(db, "bookings"),
          where("pro_id", "==", user!.uid)
        )
        const snap = await getDocs(q)
        const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking))

        // Group by email
        const map = new Map<string, ClientSummary>()
        for (const b of bookings) {
          const key = b.client_email.toLowerCase()
          const existing = map.get(key)
          if (existing) {
            existing.bookingCount++
            if (b.date > existing.lastDate) existing.lastDate = b.date
            existing.statuses[b.status] = (existing.statuses[b.status] || 0) + 1
            // Update name/phone if newer
            if (!existing.phone && b.client_phone) existing.phone = b.client_phone
          } else {
            map.set(key, {
              name: b.client_name,
              email: b.client_email,
              phone: b.client_phone,
              bookingCount: 1,
              lastDate: b.date,
              statuses: { [b.status]: 1 },
            })
          }
        }

        const sorted = Array.from(map.values()).sort(
          (a, b) => b.lastDate.localeCompare(a.lastDate)
        )
        setClients(sorted)
      } catch (err) {
        console.error("Fetch clients error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [user])

  const filtered = searchTerm
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.includes(searchTerm)
      )
    : clients

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
        <div className="h-11 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)]" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Clientèle
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {clients.length} client{clients.length > 1 ? "e" : ""}
            {clients.length > 1 ? "s" : ""} au total
          </p>
        </div>
      </FadeIn>

      {/* Search */}
      <FadeIn delay={0.05}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            className="w-full h-11 rounded-[var(--radius-md)] pl-11 pr-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] border-2 border-[var(--border-default)] placeholder:text-[var(--text-muted)] transition-colors hover:border-[var(--border-subtle)] focus:border-[var(--border-accent)] focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </FadeIn>

      {/* List */}
      {filtered.length === 0 ? (
        <FadeIn>
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
                  <Users className="h-7 w-7 text-[var(--text-muted)]" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-1">
                  {searchTerm ? "Aucun résultat" : "Aucune cliente"}
                </h3>
                <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
                  {searchTerm
                    ? "Essayez avec d'autres termes de recherche."
                    : "Vos clientes apparaîtront ici après leur première réservation."}
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <StaggerContainer className="space-y-3" staggerDelay={0.03}>
          {filtered.map((client) => (
            <StaggerItem key={client.email}>
              <Card>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-prune/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-prune" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {client.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </span>
                        {client.phone && (
                          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4 shrink-0">
                      <div className="text-center">
                        <p className="text-lg font-bold text-[var(--text-primary)]">
                          {client.bookingCount}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">RDV</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-[var(--text-secondary)]">
                          {formatDateShort(client.lastDate)}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">Dernier</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  )
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}
