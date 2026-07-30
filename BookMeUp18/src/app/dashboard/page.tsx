"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/motion"
import Link from "next/link"
import {
  Calendar,
  Clock,
  Euro,
  Users,
  ArrowRight,
  Scissors,
  Plus,
} from "lucide-react"
import type { Booking, Service } from "@/lib/types"

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [todayBookings, setTodayBookings] = useState<Booking[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchData() {
      try {
        const today = new Date().toISOString().split("T")[0]

        // RDV du jour
        const todayQ = query(
          collection(db, "bookings"),
          where("pro_id", "==", user!.uid),
          where("date", "==", today),
          where("status", "in", ["confirmed", "pending"]),
          orderBy("start_time", "asc")
        )
        const todaySnap = await getDocs(todayQ)
        const todayData = todaySnap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking))
        setTodayBookings(todayData)

        // Prochains RDV (7 jours)
        const upcomingQ = query(
          collection(db, "bookings"),
          where("pro_id", "==", user!.uid),
          where("date", ">=", today),
          where("status", "in", ["confirmed", "pending"]),
          orderBy("date", "asc"),
          orderBy("start_time", "asc"),
          limit(10)
        )
        const upcomingSnap = await getDocs(upcomingQ)
        setUpcomingBookings(upcomingSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)))

        // Services
        const servicesQ = query(
          collection(db, "services"),
          where("pro_id", "==", user!.uid),
          where("is_active", "==", true)
        )
        const servicesSnap = await getDocs(servicesQ)
        setServices(servicesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Service)))
      } catch (err) {
        console.error("Dashboard fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const todayRevenue = todayBookings.reduce(
    (sum, b) => sum + (b.pricing_snapshot?.price || 0),
    0
  )

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome */}
      <FadeIn>
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Bonjour{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""} !
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Voici votre journée en un coup d&apos;œil.
          </p>
        </div>
      </FadeIn>

      {/* KPIs */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4" staggerDelay={0.05}>
        <StaggerItem>
          <KpiCard
            icon={Calendar}
            label="RDV aujourd'hui"
            value={todayBookings.length.toString()}
            color="terracotta"
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            icon={Euro}
            label="CA estimé"
            value={`${todayRevenue} €`}
            color="sage"
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            icon={Scissors}
            label="Services actifs"
            value={services.length.toString()}
            color="prune"
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            icon={Users}
            label="Clientes ce mois"
            value="—"
            color="info"
          />
        </StaggerItem>
      </StaggerContainer>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Prochains RDV */}
        <FadeIn delay={0.2} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Prochains rendez-vous</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/calendar">
                  Voir tout <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <EmptyState
                  message="Aucun rendez-vous à venir"
                  action="Partagez votre lien de réservation pour recevoir vos premiers RDV."
                />
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 5).map((booking) => (
                    <BookingRow key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Quick actions */}
        <FadeIn delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="secondary" className="w-full justify-start" asChild>
                <Link href="/dashboard/services">
                  <Plus className="h-4 w-4" />
                  Ajouter un service
                </Link>
              </Button>
              <Button variant="secondary" className="w-full justify-start" asChild>
                <Link href="/dashboard/availability">
                  <Clock className="h-4 w-4" />
                  Modifier mes horaires
                </Link>
              </Button>
              <Button variant="secondary" className="w-full justify-start" asChild>
                <Link href="/dashboard/settings/account">
                  <Users className="h-4 w-4" />
                  Mon profil public
                </Link>
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
}) {
  const colorMap: Record<string, string> = {
    terracotta: "bg-terracotta/10 text-terracotta",
    sage: "bg-sage/10 text-sage-dark",
    prune: "bg-prune/10 text-prune",
    info: "bg-info/10 text-info",
  }
  return (
    <Card>
      <CardContent className="p-5">
        <div className={`w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center mb-3 ${colorMap[color] || colorMap.terracotta}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}

function BookingRow({ booking }: { booking: Booking }) {
  const isToday = booking.date === new Date().toISOString().split("T")[0]
  return (
    <div className="flex items-center gap-4 p-3 rounded-[var(--radius-md)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)]/30 transition-colors">
      <div className="flex flex-col items-center min-w-[52px]">
        <span className="text-xs text-[var(--text-muted)]">
          {isToday ? "Auj." : formatDateShort(booking.date)}
        </span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          {booking.start_time}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
          {booking.client_name}
        </p>
        <p className="text-xs text-[var(--text-muted)] truncate">
          {booking.pricing_snapshot?.label}
        </p>
      </div>
      <Badge variant={booking.status === "confirmed" ? "success" : "default"}>
        {booking.status === "confirmed" ? "Confirmé" : "En attente"}
      </Badge>
    </div>
  )
}

function EmptyState({ message, action }: { message: string; action: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-3">
        <Calendar className="h-6 w-6 text-[var(--text-muted)]" />
      </div>
      <p className="font-medium text-[var(--text-primary)]">{message}</p>
      <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs mx-auto">{action}</p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
        <div className="h-4 w-64 bg-[var(--bg-muted)] rounded mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <div className="h-64 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)]" />
    </div>
  )
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}
