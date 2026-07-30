#!/bin/bash
set -e

# Setup script for BookMeUp Phase 2-3 files
# Run from the BookMeUp18 directory

echo "Creating directories..."
mkdir -p "src/components/dashboard"
mkdir -p "src/app/dashboard"
mkdir -p "src/app/dashboard/services"
mkdir -p "src/app/dashboard/availability"
mkdir -p "src/app/dashboard/calendar"
mkdir -p "src/app/dashboard/clients"
mkdir -p "src/app/dashboard/settings/account"
mkdir -p "src/app/dashboard/settings/subscription"
mkdir -p "src/app/book/[slug]"

echo "Creating src/components/dashboard/sidebar.tsx..."
cat > "src/components/dashboard/sidebar.tsx" << 'ENDOFFILE'
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import {
  LayoutDashboard,
  Scissors,
  Calendar,
  Clock,
  Users,
  Settings,
  CreditCard,
  Sparkles,
  ChevronLeft,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/services", icon: Scissors, label: "Services" },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendrier" },
  { href: "/dashboard/availability", icon: Clock, label: "Disponibilités" },
  { href: "/dashboard/clients", icon: Users, label: "Clientèle" },
]

const BOTTOM_ITEMS = [
  { href: "/dashboard/settings/account", icon: Settings, label: "Paramètres" },
  { href: "/dashboard/settings/subscription", icon: CreditCard, label: "Abonnement" },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 border-r border-[var(--border-default)] bg-[var(--bg-secondary)] transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[var(--border-default)]">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <Sparkles className="h-6 w-6 text-terracotta shrink-0" />
          {!collapsed && (
            <span className="font-heading text-lg font-bold text-[var(--text-primary)] whitespace-nowrap">
              BookMeUp
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
                isActive
                  ? "bg-terracotta/10 text-terracotta"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="py-4 px-3 space-y-1 border-t border-[var(--border-default)]">
        {BOTTOM_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
                isActive
                  ? "bg-terracotta/10 text-terracotta"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors w-full"
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 shrink-0 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span>Réduire</span>}
        </button>
      </div>
    </aside>
  )
}
ENDOFFILE

echo "Creating src/components/dashboard/topbar.tsx..."
cat > "src/components/dashboard/topbar.tsx" << 'ENDOFFILE'
"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/use-auth"
import { useTheme } from "@/components/shared/theme-provider"
import { cn } from "@/lib/utils/cn"
import {
  Bell,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  Sparkles,
  LayoutDashboard,
  Scissors,
  Calendar,
  Clock,
  Users,
  CreditCard,
} from "lucide-react"

const MOBILE_NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/services", icon: Scissors, label: "Services" },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendrier" },
  { href: "/dashboard/availability", icon: Clock, label: "Disponibilités" },
  { href: "/dashboard/clients", icon: Users, label: "Clientèle" },
  { href: "/dashboard/settings/account", icon: Settings, label: "Paramètres" },
  { href: "/dashboard/settings/subscription", icon: CreditCard, label: "Abonnement" },
]

export function Topbar() {
  const { profile, signOut } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      <header className="h-16 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] flex items-center px-4 sm:px-6 sticky top-0 z-40">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 -ml-2 mr-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Mobile logo */}
        <Link href="/dashboard" className="lg:hidden flex items-center gap-2 mr-auto">
          <Sparkles className="h-5 w-5 text-terracotta" />
          <span className="font-heading text-lg font-bold text-[var(--text-primary)]">BookMeUp</span>
        </Link>

        {/* Spacer desktop */}
        <div className="hidden lg:block flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label={resolvedTheme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-terracotta rounded-full" />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-terracotta/15 flex items-center justify-center">
                <User className="h-4 w-4 text-terracotta" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-[var(--text-primary)] max-w-[120px] truncate">
                {profile?.name || "Mon compte"}
              </span>
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] z-50 py-1">
                  <Link
                    href="/dashboard/settings/account"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </Link>
                  <button
                    onClick={() => { signOut(); setProfileOpen(false) }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/5 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-[var(--bg-secondary)] z-50 lg:hidden border-r border-[var(--border-default)] p-4">
            <div className="flex items-center justify-between mb-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-terracotta" />
                <span className="font-heading text-lg font-bold text-[var(--text-primary)]">BookMeUp</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-[var(--text-muted)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {MOBILE_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
ENDOFFILE

echo "Creating src/app/dashboard/layout.tsx..."
cat > "src/app/dashboard/layout.tsx" << 'ENDOFFILE'
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  // Redirect si pas connecté
  if (!loading && !user) {
    router.push("/auth/login")
    return null
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
ENDOFFILE

echo "Creating src/app/dashboard/page.tsx..."
cat > "src/app/dashboard/page.tsx" << 'ENDOFFILE'
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
ENDOFFILE

echo "Progress: 4/11 files created"

echo "Creating src/app/dashboard/services/page.tsx..."
cat > "src/app/dashboard/services/page.tsx" << 'ENDOFFILE'
"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/motion"
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Clock,
  Euro,
  Scissors,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import type { Service } from "@/lib/types"

type ServiceFormData = {
  name: string
  description: string
  price: string
  duration: string
  category: string
}

const EMPTY_FORM: ServiceFormData = {
  name: "",
  description: "",
  price: "",
  duration: "30",
  category: "",
}

const CATEGORIES = [
  "Coiffure",
  "Coloration",
  "Soins capillaires",
  "Esthétique",
  "Manucure",
  "Maquillage",
  "Massage",
  "Épilation",
  "Autre",
]

const DURATIONS = [15, 30, 45, 60, 75, 90, 120]

export default function ServicesPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ServiceFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const fetchServices = useCallback(async () => {
    if (!user) return
    try {
      const q = query(
        collection(db, "services"),
        where("pro_id", "==", user.uid)
      )
      const snap = await getDocs(q)
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Service))
        .sort((a, b) => (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1))
      setServices(data)
    } catch (err) {
      console.error("Fetch services error:", err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError("")
    setShowForm(true)
  }

  function openEdit(service: Service) {
    setForm({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category || "",
    })
    setEditingId(service.id)
    setError("")
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError("")
  }

  async function handleSave() {
    if (!user) return
    if (!form.name.trim()) { setError("Le nom est requis"); return }
    if (!form.price || parseFloat(form.price) < 0) { setError("Le prix doit être un nombre positif"); return }

    setSaving(true)
    setError("")

    try {
      const data = {
        pro_id: user.uid,
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        duration: parseInt(form.duration),
        category: form.category || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }

      if (editingId) {
        await updateDoc(doc(db, "services", editingId), data)
      } else {
        await addDoc(collection(db, "services"), {
          ...data,
          created_at: new Date().toISOString(),
        })
      }

      closeForm()
      await fetchServices()
    } catch (err) {
      console.error("Save service error:", err)
      setError("Erreur lors de la sauvegarde. Réessayez.")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(service: Service) {
    try {
      await updateDoc(doc(db, "services", service.id), {
        is_active: !service.is_active,
        updated_at: new Date().toISOString(),
      })
      await fetchServices()
    } catch (err) {
      console.error("Toggle service error:", err)
    }
  }

  async function handleDelete(serviceId: string) {
    setDeletingId(serviceId)
    try {
      await deleteDoc(doc(db, "services", serviceId))
      await fetchServices()
    } catch (err) {
      console.error("Delete service error:", err)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <ServicesSkeleton />
  }

  const activeCount = services.filter((s) => s.is_active).length
  const inactiveCount = services.filter((s) => !s.is_active).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Mes services
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              {activeCount} actif{activeCount > 1 ? "s" : ""}
              {inactiveCount > 0 && ` · ${inactiveCount} inactif${inactiveCount > 1 ? "s" : ""}`}
            </p>
          </div>
          <Button onClick={openCreate} size="md">
            <Plus className="h-4 w-4" />
            Ajouter un service
          </Button>
        </div>
      </FadeIn>

      {/* Form modal/overlay */}
      {showForm && (
        <FadeIn>
          <Card className="border-2 border-[var(--border-accent)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {editingId ? "Modifier le service" : "Nouveau service"}
              </CardTitle>
              <button
                onClick={closeForm}
                className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nom du service *"
                placeholder="Ex : Coupe femme, Balayage, Soin visage..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Description
                </label>
                <textarea
                  className="w-full rounded-[var(--radius-md)] px-4 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] border-2 border-[var(--border-default)] placeholder:text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--border-subtle)] focus:border-[var(--border-accent)] focus:outline-none resize-none"
                  rows={3}
                  placeholder="Décrivez votre prestation..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prix (€) *"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="35"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    Durée
                  </label>
                  <select
                    className="h-11 w-full rounded-[var(--radius-md)] px-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] border-2 border-[var(--border-default)] transition-colors duration-200 hover:border-[var(--border-subtle)] focus:border-[var(--border-accent)] focus:outline-none"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  >
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d >= 60 ? `${Math.floor(d / 60)}h${d % 60 ? d % 60 : ""}` : `${d} min`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Catégorie
                </label>
                <select
                  className="h-11 w-full rounded-[var(--radius-md)] px-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] border-2 border-[var(--border-default)] transition-colors duration-200 hover:border-[var(--border-subtle)] focus:border-[var(--border-accent)] focus:outline-none"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Sans catégorie</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-error bg-error/5 rounded-[var(--radius-md)] p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Enregistrer" : "Créer le service"}
                </Button>
                <Button variant="ghost" onClick={closeForm}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Services list */}
      {services.length === 0 && !showForm ? (
        <FadeIn>
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
                  <Scissors className="h-7 w-7 text-[var(--text-muted)]" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-1">
                  Aucun service
                </h3>
                <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto mb-6">
                  Commencez par ajouter vos prestations. Vos clientes pourront ensuite les réserver en ligne.
                </p>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Ajouter mon premier service
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <StaggerContainer className="space-y-3" staggerDelay={0.04}>
          {services.map((service) => (
            <StaggerItem key={service.id}>
              <ServiceCard
                service={service}
                onEdit={() => openEdit(service)}
                onToggle={() => handleToggleActive(service)}
                onDelete={() => handleDelete(service.id)}
                deleting={deletingId === service.id}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  )
}

/* ── Sub-components ── */

function ServiceCard({
  service,
  onEdit,
  onToggle,
  onDelete,
  deleting,
}: {
  service: Service
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  return (
    <Card className={!service.is_active ? "opacity-60" : ""}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-terracotta/10 flex items-center justify-center shrink-0">
            <Scissors className="h-5 w-5 text-terracotta" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {service.name}
              </h3>
              {service.category && (
                <Badge variant="outline">{service.category}</Badge>
              )}
              {!service.is_active && (
                <Badge variant="warning">Inactif</Badge>
              )}
            </div>
            {service.description && (
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">
                {service.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <Euro className="h-3.5 w-3.5" />
                {service.price} €
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {service.duration >= 60
                  ? `${Math.floor(service.duration / 60)}h${service.duration % 60 ? service.duration % 60 : ""}`
                  : `${service.duration} min`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggle}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              title={service.is_active ? "Désactiver" : "Activer"}
            >
              {service.is_active ? (
                <ToggleRight className="h-5 w-5 text-sage" />
              ) : (
                <ToggleLeft className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={onEdit}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              title="Modifier"
            >
              <Pencil className="h-4 w-4" />
            </button>

            {showConfirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onDelete(); setShowConfirmDelete(false) }}
                  disabled={deleting}
                  className="p-2 rounded-[var(--radius-md)] text-error hover:bg-error/10 transition-colors"
                  title="Confirmer la suppression"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  title="Annuler"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-error/10 hover:text-error transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ServicesSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div>
          <div className="h-8 w-40 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
          <div className="h-4 w-24 bg-[var(--bg-muted)] rounded mt-2" />
        </div>
        <div className="h-11 w-44 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)]" />
      ))}
    </div>
  )
}
ENDOFFILE

echo "Progress: 5/11 files created"

echo "Creating src/app/dashboard/availability/page.tsx..."
cat > "src/app/dashboard/availability/page.tsx" << 'ENDOFFILE'
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/motion"
import {
  Clock,
  Save,
  Loader2,
  Check,
  Plus,
  Trash2,
  CalendarOff,
} from "lucide-react"
import type { Availability, TimeSlot } from "@/lib/types"
import { DAYS_FR } from "@/lib/types"

const DEFAULT_SLOT: TimeSlot = { start: "09:00", end: "18:00" }

const DEFAULT_AVAILABILITY: Availability[] = [
  { day: 0, enabled: false, slots: [] },
  { day: 1, enabled: true, slots: [{ start: "09:00", end: "19:00" }] },
  { day: 2, enabled: true, slots: [{ start: "09:00", end: "19:00" }] },
  { day: 3, enabled: true, slots: [{ start: "09:00", end: "19:00" }] },
  { day: 4, enabled: true, slots: [{ start: "09:00", end: "19:00" }] },
  { day: 5, enabled: true, slots: [{ start: "09:00", end: "19:00" }] },
  { day: 6, enabled: true, slots: [{ start: "09:00", end: "13:00" }] },
]

const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 22; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
  }
}

export default function AvailabilityPage() {
  const { user } = useAuth()
  const [schedule, setSchedule] = useState<Availability[]>(DEFAULT_AVAILABILITY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    async function fetchAvailability() {
      try {
        const ref = doc(db, "availability", user!.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data()
          if (data.schedule) {
            setSchedule(data.schedule)
          }
        }
      } catch (err) {
        console.error("Fetch availability error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAvailability()
  }, [user])

  function toggleDay(dayIndex: number) {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === dayIndex
          ? {
              ...d,
              enabled: !d.enabled,
              slots: !d.enabled && d.slots.length === 0 ? [{ ...DEFAULT_SLOT }] : d.slots,
            }
          : d
      )
    )
    setSaved(false)
  }

  function updateSlot(dayIndex: number, slotIndex: number, field: "start" | "end", value: string) {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === dayIndex
          ? {
              ...d,
              slots: d.slots.map((s, i) =>
                i === slotIndex ? { ...s, [field]: value } : s
              ),
            }
          : d
      )
    )
    setSaved(false)
  }

  function addSlot(dayIndex: number) {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === dayIndex
          ? {
              ...d,
              slots: [...d.slots, { start: "14:00", end: "18:00" }],
            }
          : d
      )
    )
    setSaved(false)
  }

  function removeSlot(dayIndex: number, slotIndex: number) {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === dayIndex
          ? {
              ...d,
              slots: d.slots.filter((_, i) => i !== slotIndex),
            }
          : d
      )
    )
    setSaved(false)
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await setDoc(doc(db, "availability", user.uid), {
        pro_id: user.uid,
        schedule,
        updated_at: new Date().toISOString(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Save availability error:", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AvailabilitySkeleton />
  }

  // Reorder: Monday first (1,2,3,4,5,6,0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Disponibilités
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Configurez vos créneaux d&apos;ouverture hebdomadaires.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving || saved}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Sauvegarde..." : saved ? "Enregistré !" : "Enregistrer"}
          </Button>
        </div>
      </FadeIn>

      {/* Schedule */}
      <StaggerContainer className="space-y-3" staggerDelay={0.04}>
        {orderedDays.map((dayNum) => {
          const day = schedule.find((d) => d.day === dayNum)!
          return (
            <StaggerItem key={dayNum}>
              <Card>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    {/* Toggle + day name */}
                    <button
                      onClick={() => toggleDay(dayNum)}
                      className={`mt-0.5 w-10 h-6 rounded-full relative transition-colors duration-200 shrink-0 ${
                        day.enabled
                          ? "bg-terracotta"
                          : "bg-[var(--bg-muted)]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                          day.enabled ? "translate-x-4 left-0.5" : "left-0.5 translate-x-0"
                        }`}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${day.enabled ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                        {DAYS_FR[dayNum]}
                      </p>

                      {day.enabled ? (
                        <div className="mt-3 space-y-2">
                          {day.slots.map((slot, si) => (
                            <div key={si} className="flex items-center gap-2">
                              <select
                                className="h-9 rounded-[var(--radius-sm)] px-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none"
                                value={slot.start}
                                onChange={(e) => updateSlot(dayNum, si, "start", e.target.value)}
                              >
                                {TIME_OPTIONS.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              <span className="text-xs text-[var(--text-muted)]">à</span>
                              <select
                                className="h-9 rounded-[var(--radius-sm)] px-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--border-accent)] focus:outline-none"
                                value={slot.end}
                                onChange={(e) => updateSlot(dayNum, si, "end", e.target.value)}
                              >
                                {TIME_OPTIONS.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              {day.slots.length > 1 && (
                                <button
                                  onClick={() => removeSlot(dayNum, si)}
                                  className="p-1.5 rounded text-[var(--text-muted)] hover:text-error hover:bg-error/5 transition-colors"
                                  title="Supprimer ce créneau"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => addSlot(dayNum)}
                            className="flex items-center gap-1.5 text-xs text-terracotta hover:text-terracotta/80 transition-colors mt-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Ajouter un créneau
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
                          <CalendarOff className="h-3.5 w-3.5" />
                          Fermé
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          )
        })}
      </StaggerContainer>

      {/* Info */}
      <FadeIn delay={0.3}>
        <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] p-4">
          <p className="font-medium text-[var(--text-secondary)] mb-1">Bon à savoir</p>
          <p>
            Ces créneaux définissent vos heures d&apos;ouverture générales.
            Vous pouvez ajouter des exceptions (congés, fermetures exceptionnelles)
            depuis le calendrier.
          </p>
        </div>
      </FadeIn>
    </div>
  )
}

function AvailabilitySkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div>
          <div className="h-8 w-48 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
          <div className="h-4 w-64 bg-[var(--bg-muted)] rounded mt-2" />
        </div>
        <div className="h-11 w-36 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
      </div>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="h-20 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)]" />
      ))}
    </div>
  )
}
ENDOFFILE

echo "Progress: 6/11 files created"

echo "Creating src/app/dashboard/calendar/page.tsx..."
cat > "src/app/dashboard/calendar/page.tsx" << 'ENDOFFILE'
"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/shared/motion"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import type { Booking } from "@/lib/types"

const DAYS_HEADER = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

export default function CalendarPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    if (!user) return
    async function fetchBookings() {
      try {
        const startOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-01`
        const endOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-31`
        const q = query(
          collection(db, "bookings"),
          where("pro_id", "==", user!.uid),
          where("date", ">=", startOfMonth),
          where("date", "<=", endOfMonth)
        )
        const snap = await getDocs(q)
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)))
      } catch (err) {
        console.error("Fetch bookings error:", err)
      } finally {
        setLoading(false)
      }
    }
    setLoading(true)
    fetchBookings()
  }, [user, year, month])

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6 // Sunday -> 6

    const days: (number | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
    // Pad to full weeks
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [year, month])

  // Bookings per date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of bookings) {
      const arr = map.get(b.date) || []
      arr.push(b)
      map.set(b.date, arr)
    }
    return map
  }, [bookings])

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
    setSelectedBooking(null)
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
    setSelectedBooking(null)
  }

  function goToday() {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today.toISOString().split("T")[0])
    setSelectedBooking(null)
  }

  function selectDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelectedDate(dateStr)
    setSelectedBooking(null)
  }

  async function updateBookingStatus(bookingId: string, status: "confirmed" | "cancelled") {
    setUpdatingStatus(true)
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status,
        ...(status === "cancelled" ? { cancelled_at: new Date().toISOString(), cancelled_by: "pro" } : {}),
      })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      )
      setSelectedBooking((prev) => prev && prev.id === bookingId ? { ...prev, status } : prev)
    } catch (err) {
      console.error("Update booking error:", err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const selectedDayBookings = selectedDate
    ? (bookingsByDate.get(selectedDate) || []).sort((a, b) => a.start_time.localeCompare(b.start_time))
    : []

  const todayStr = new Date().toISOString().split("T")[0]
  const monthLabel = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Calendrier
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>
              Aujourd&apos;hui
            </Button>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-[var(--text-primary)] min-w-[140px] text-center capitalize">
                {monthLabel}
              </span>
              <button
                onClick={nextMonth}
                className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <FadeIn delay={0.1} className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              {/* Header row */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_HEADER.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-[var(--text-muted)] py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    if (day === null) {
                      return <div key={idx} className="aspect-square" />
                    }
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    const dayBookings = bookingsByDate.get(dateStr) || []
                    const isToday = dateStr === todayStr
                    const isSelected = dateStr === selectedDate
                    const hasBookings = dayBookings.length > 0
                    const pending = dayBookings.filter((b) => b.status === "pending").length

                    return (
                      <button
                        key={idx}
                        onClick={() => selectDay(day)}
                        className={`aspect-square rounded-[var(--radius-sm)] flex flex-col items-center justify-center gap-0.5 text-sm transition-colors relative ${
                          isSelected
                            ? "bg-terracotta text-white"
                            : isToday
                            ? "bg-terracotta/10 text-terracotta font-semibold"
                            : "text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                        }`}
                      >
                        <span>{day}</span>
                        {hasBookings && (
                          <div className="flex gap-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/80" : "bg-terracotta"}`} />
                            {pending > 0 && (
                              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/50" : "bg-warning"}`} />
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Day detail */}
        <FadeIn delay={0.2}>
          <Card>
            <CardContent className="p-4">
              {selectedDate ? (
                <>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-4 capitalize">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>

                  {selectedDayBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--text-muted)]">Aucun RDV ce jour</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayBookings.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          className={`w-full text-left p-3 rounded-[var(--radius-md)] border transition-colors ${
                            selectedBooking?.id === b.id
                              ? "border-terracotta bg-terracotta/5"
                              : "border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                              {b.start_time} — {b.end_time}
                            </span>
                            <Badge
                              variant={
                                b.status === "confirmed"
                                  ? "success"
                                  : b.status === "cancelled"
                                  ? "error"
                                  : "default"
                              }
                            >
                              {b.status === "confirmed"
                                ? "Confirmé"
                                : b.status === "cancelled"
                                ? "Annulé"
                                : b.status === "completed"
                                ? "Terminé"
                                : "En attente"}
                            </Badge>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">{b.client_name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{b.pricing_snapshot?.label}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Booking detail */}
                  {selectedBooking && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-default)] space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Détails du RDV
                        </p>
                        <button
                          onClick={() => setSelectedBooking(null)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <p className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <User className="h-3.5 w-3.5" />
                          {selectedBooking.client_name}
                        </p>
                        <p className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <Clock className="h-3.5 w-3.5" />
                          {selectedBooking.start_time} — {selectedBooking.end_time}
                        </p>
                        <p className="text-[var(--text-muted)]">
                          {selectedBooking.pricing_snapshot?.label} · {selectedBooking.pricing_snapshot?.price} €
                        </p>
                      </div>

                      {selectedBooking.status === "pending" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => updateBookingStatus(selectedBooking.id, "confirmed")}
                            disabled={updatingStatus}
                          >
                            {updatingStatus ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Confirmer
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")}
                            disabled={updatingStatus}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Annuler
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--text-muted)]">
                    Sélectionnez un jour pour voir les RDV
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}
ENDOFFILE

echo "Progress: 7/11 files created"

echo "Creating src/app/dashboard/clients/page.tsx..."
cat > "src/app/dashboard/clients/page.tsx" << 'ENDOFFILE'
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
ENDOFFILE

echo "Progress: 8/11 files created"

echo "Creating src/app/dashboard/settings/account/page.tsx..."
cat > "src/app/dashboard/settings/account/page.tsx" << 'ENDOFFILE'
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FadeIn } from "@/components/shared/motion"
import {
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Save,
  Loader2,
  Check,
  Link2,
  Copy,
} from "lucide-react"
import type { ProProfile } from "@/lib/types"

export default function AccountSettingsPage() {
  const { user, profile } = useAuth()
  const [proProfile, setProProfile] = useState<ProProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  // Form state
  const [businessName, setBusinessName] = useState("")
  const [description, setDescription] = useState("")
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [instagram, setInstagram] = useState("")
  const [facebook, setFacebook] = useState("")
  const [website, setWebsite] = useState("")

  useEffect(() => {
    if (!user) return
    async function fetchPro() {
      try {
        const ref = doc(db, "pros", user!.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data() as ProProfile
          setProProfile(data)
          setBusinessName(data.business_name || "")
          setDescription(data.description || "")
          setCity(data.city || "")
          setAddress(data.address || "")
          setPhone(data.phone || "")
          setInstagram(data.socials?.instagram || "")
          setFacebook(data.socials?.facebook || "")
          setWebsite(data.socials?.website || "")
        }
      } catch (err) {
        console.error("Fetch pro profile error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPro()
  }, [user])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, "pros", user.uid), {
        business_name: businessName.trim(),
        description: description.trim(),
        city: city.trim(),
        address: address.trim(),
        phone: phone.trim(),
        socials: {
          instagram: instagram.trim(),
          facebook: facebook.trim(),
          website: website.trim(),
        },
        updated_at: new Date().toISOString(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Save profile error:", err)
    } finally {
      setSaving(false)
    }
  }

  function copyBookingLink() {
    if (!proProfile?.slug) return
    const link = `${window.location.origin}/book/${proProfile.slug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)]" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Mon profil
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Gérez les informations de votre page publique.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving || saved}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Sauvegarde..." : saved ? "Enregistré !" : "Enregistrer"}
          </Button>
        </div>
      </FadeIn>

      {/* Booking link */}
      {proProfile?.slug && (
        <FadeIn delay={0.05}>
          <Card className="border-terracotta/20 bg-terracotta/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[var(--radius-md)] bg-terracotta/15 flex items-center justify-center shrink-0">
                  <Link2 className="h-4 w-4 text-terracotta" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Votre lien de réservation
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {typeof window !== "undefined" ? window.location.origin : ""}/book/{proProfile.slug}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={copyBookingLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copié !" : "Copier"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Business info */}
      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-terracotta" />
              Informations professionnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nom de l'établissement"
              placeholder="Ex : Mila Beauty Lyon"
              value={businessName}
              onChange={(e) => { setBusinessName(e.target.value); setSaved(false) }}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Description
              </label>
              <textarea
                className="w-full rounded-[var(--radius-md)] px-4 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] border-2 border-[var(--border-default)] placeholder:text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--border-subtle)] focus:border-[var(--border-accent)] focus:outline-none resize-none"
                rows={4}
                placeholder="Présentez votre salon / activité..."
                value={description}
                onChange={(e) => { setDescription(e.target.value); setSaved(false) }}
              />
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Contact & address */}
      <FadeIn delay={0.15}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-terracotta" />
              Coordonnées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Ville"
                placeholder="Lyon"
                value={city}
                onChange={(e) => { setCity(e.target.value); setSaved(false) }}
              />
              <Input
                label="Téléphone"
                placeholder="06 12 34 56 78"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setSaved(false) }}
              />
            </div>
            <Input
              label="Adresse complète"
              placeholder="12 rue de la Paix, 69001 Lyon"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setSaved(false) }}
            />
          </CardContent>
        </Card>
      </FadeIn>

      {/* Socials */}
      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-terracotta" />
              Réseaux sociaux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Instagram"
              placeholder="@votre_compte"
              value={instagram}
              onChange={(e) => { setInstagram(e.target.value); setSaved(false) }}
            />
            <Input
              label="Facebook"
              placeholder="URL de votre page"
              value={facebook}
              onChange={(e) => { setFacebook(e.target.value); setSaved(false) }}
            />
            <Input
              label="Site web"
              placeholder="https://..."
              value={website}
              onChange={(e) => { setWebsite(e.target.value); setSaved(false) }}
            />
          </CardContent>
        </Card>
      </FadeIn>

      {/* Email (read-only) */}
      <FadeIn delay={0.25}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-terracotta" />
              Compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label="Email"
              value={profile?.email || ""}
              disabled
              hint="L'email ne peut pas être modifié ici."
            />
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
ENDOFFILE

echo "Progress: 9/11 files created"

echo "Creating src/app/dashboard/settings/subscription/page.tsx..."
cat > "src/app/dashboard/settings/subscription/page.tsx" << 'ENDOFFILE'
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/shared/motion"
import {
  CreditCard,
  Check,
  Star,
  Zap,
  Crown,
  ArrowRight,
} from "lucide-react"
import type { ProProfile, SubscriptionPlan } from "@/lib/types"
import { PLAN_LIMITS, PLAN_LABELS } from "@/lib/types"

const PLANS: {
  id: SubscriptionPlan
  name: string
  price: number
  icon: React.ElementType
  features: string[]
  highlight?: boolean
}[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    icon: Star,
    features: [
      "5 services maximum",
      "50 réservations / mois",
      "Statistiques de base",
      "Page de réservation",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    icon: Zap,
    highlight: true,
    features: [
      "20 services",
      "Réservations illimitées",
      "Statistiques avancées",
      "Sync Google Calendar",
      "Support prioritaire",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 39,
    icon: Crown,
    features: [
      "Services illimités",
      "Réservations illimitées",
      "Analytics complets",
      "Google Calendar + SMS",
      "Export données",
      "Support VIP",
    ],
  },
]

export default function SubscriptionPage() {
  const { user } = useAuth()
  const [proProfile, setProProfile] = useState<ProProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function fetchPro() {
      try {
        const ref = doc(db, "pros", user!.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setProProfile(snap.data() as ProProfile)
        }
      } catch (err) {
        console.error("Fetch pro error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPro()
  }, [user])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[var(--bg-muted)] rounded-[var(--radius-md)]" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </div>
    )
  }

  const currentPlan = proProfile?.plan || "starter"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <FadeIn>
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Abonnement
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Vous êtes actuellement sur le plan{" "}
            <span className="font-semibold text-terracotta">
              {PLAN_LABELS[currentPlan]}
            </span>
          </p>
        </div>
      </FadeIn>

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((plan, idx) => {
          const isCurrent = plan.id === currentPlan
          return (
            <FadeIn key={plan.id} delay={0.05 * (idx + 1)}>
              <Card
                className={`relative ${
                  plan.highlight && !isCurrent
                    ? "border-2 border-terracotta"
                    : isCurrent
                    ? "border-2 border-sage"
                    : ""
                }`}
              >
                {plan.highlight && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="bg-terracotta text-white border-0">
                      Populaire
                    </Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="success">Plan actuel</Badge>
                  </div>
                )}

                <CardContent className="p-6 pt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-[var(--radius-md)] bg-terracotta/10 flex items-center justify-center">
                      <plan.icon className="h-5 w-5 text-terracotta" />
                    </div>
                    <h3 className="text-lg font-heading font-bold text-[var(--text-primary)]">
                      {plan.name}
                    </h3>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">
                      {plan.price}€
                    </span>
                    <span className="text-sm text-[var(--text-muted)]"> / mois</span>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <Check className="h-4 w-4 text-sage shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Plan actuel
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlight ? "primary" : "outline"}
                      className="w-full"
                      onClick={() => {
                        // TODO: Stripe checkout
                        alert("L'intégration Stripe sera disponible prochainement !")
                      }}
                    >
                      {plan.price > (PLANS.find((p) => p.id === currentPlan)?.price || 0)
                        ? "Passer à ce plan"
                        : "Changer de plan"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          )
        })}
      </div>

      {/* Info */}
      <FadeIn delay={0.25}>
        <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] p-4">
          <p className="font-medium text-[var(--text-secondary)] mb-1">Informations</p>
          <p>
            Tous les plans incluent votre page de réservation publique et les rappels automatiques par email.
            Vous pouvez changer de plan ou annuler à tout moment. Le paiement est géré via Stripe de manière sécurisée.
          </p>
        </div>
      </FadeIn>
    </div>
  )
}
ENDOFFILE

echo "Progress: 10/11 files created"

echo "Creating src/app/book/[slug]/page.tsx..."
cat > "src/app/book/[slug]/page.tsx" << 'ENDOFFILE'
"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore"
import { db } from "@/lib/db/firebase-client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/shared/motion"
import Link from "next/link"
import {
  Sparkles,
  MapPin,
  Phone,
  Star,
  Clock,
  Euro,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  User,
  Mail,
  Loader2,
  ArrowLeft,
  Instagram,
  Globe,
  Facebook,
  CheckCircle2,
  Copy,
} from "lucide-react"
import type { ProProfile, Service, Availability, Booking } from "@/lib/types"
import { DAYS_FR } from "@/lib/types"

/* ── Types internes ── */
type BookingStep = "services" | "date" | "time" | "info" | "confirm" | "success"

interface BookingForm {
  client_name: string
  client_email: string
  client_phone: string
}

/* ── Constantes ── */
const EMPTY_FORM: BookingForm = {
  client_name: "",
  client_email: "",
  client_phone: "",
}

export default function PublicBookingPage() {
  const params = useParams()
  const slug = params.slug as string

  // Data
  const [pro, setPro] = useState<(ProProfile & { uid: string }) | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [existingBookings, setExistingBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Booking flow
  const [step, setStep] = useState<BookingStep>("services")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date())

  /* ── Fetch pro data ── */
  useEffect(() => {
    async function fetchPro() {
      try {
        // Find pro by slug
        const q = query(collection(db, "pros"), where("slug", "==", slug))
        const snap = await getDocs(q)
        if (snap.empty) {
          setNotFound(true)
          setLoading(false)
          return
        }

        const proDoc = snap.docs[0]
        const proData = { uid: proDoc.id, ...proDoc.data() } as ProProfile & { uid: string }
        setPro(proData)

        // Fetch services
        const servicesQ = query(
          collection(db, "services"),
          where("pro_id", "==", proDoc.id),
          where("is_active", "==", true)
        )
        const servicesSnap = await getDocs(servicesQ)
        setServices(
          servicesSnap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Service))
            .sort((a, b) => a.price - b.price)
        )

        // Fetch availability
        const availRef = doc(db, "availability", proDoc.id)
        const availSnap = await getDoc(availRef)
        if (availSnap.exists()) {
          setAvailability(availSnap.data().schedule || [])
        }
      } catch (err) {
        console.error("Fetch pro error:", err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchPro()
  }, [slug])

  /* ── Fetch bookings for selected month ── */
  useEffect(() => {
    if (!pro) return
    async function fetchBookings() {
      const y = calendarDate.getFullYear()
      const m = calendarDate.getMonth()
      const start = `${y}-${String(m + 1).padStart(2, "0")}-01`
      const end = `${y}-${String(m + 1).padStart(2, "0")}-31`
      try {
        const q = query(
          collection(db, "bookings"),
          where("pro_id", "==", pro!.uid),
          where("date", ">=", start),
          where("date", "<=", end),
          where("status", "in", ["confirmed", "pending"])
        )
        const snap = await getDocs(q)
        setExistingBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)))
      } catch (err) {
        console.error("Fetch bookings error:", err)
      }
    }
    fetchBookings()
  }, [pro, calendarDate])

  /* ── Available time slots for selected date ── */
  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return []

    const dateObj = new Date(selectedDate + "T00:00:00")
    const dayOfWeek = dateObj.getDay() // 0=dim
    const dayAvail = availability.find((a) => a.day === dayOfWeek)

    if (!dayAvail || !dayAvail.enabled || dayAvail.slots.length === 0) return []

    const duration = selectedService.duration
    const dayBookings = existingBookings.filter((b) => b.date === selectedDate)

    const slots: string[] = []

    for (const slot of dayAvail.slots) {
      const [startH, startM] = slot.start.split(":").map(Number)
      const [endH, endM] = slot.end.split(":").map(Number)
      const slotStartMin = startH * 60 + startM
      const slotEndMin = endH * 60 + endM

      // Generate slots every 15 min
      for (let t = slotStartMin; t + duration <= slotEndMin; t += 15) {
        const h = Math.floor(t / 60)
        const m = t % 60
        const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
        const endT = t + duration
        const endTimeStr = `${Math.floor(endT / 60).toString().padStart(2, "0")}:${(endT % 60).toString().padStart(2, "0")}`

        // Check conflicts
        const conflict = dayBookings.some((b) => {
          const [bh, bm] = b.start_time.split(":").map(Number)
          const [beh, bem] = b.end_time.split(":").map(Number)
          const bStart = bh * 60 + bm
          const bEnd = beh * 60 + bem
          return t < bEnd && endT > bStart
        })

        if (!conflict) {
          slots.push(timeStr)
        }
      }
    }

    // Filter past slots for today
    const today = new Date().toISOString().split("T")[0]
    if (selectedDate === today) {
      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes() + 30 // 30 min buffer
      return slots.filter((s) => {
        const [h, m] = s.split(":").map(Number)
        return h * 60 + m >= nowMin
      })
    }

    return slots
  }, [selectedDate, selectedService, availability, existingBookings])

  /* ── Submit booking ── */
  async function handleSubmit() {
    if (!pro || !selectedService || !selectedDate || !selectedTime) return
    if (!form.client_name.trim()) { setError("Votre nom est requis"); return }
    if (!form.client_email.trim() || !form.client_email.includes("@")) {
      setError("Un email valide est requis")
      return
    }
    if (!form.client_phone.trim()) { setError("Votre téléphone est requis"); return }

    setSubmitting(true)
    setError("")

    try {
      const endMin =
        selectedTime.split(":").map(Number).reduce((h, m) => h * 60 + m, 0) +
        selectedService.duration
      const endTime = `${Math.floor(endMin / 60).toString().padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`

      const bookingData = {
        pro_id: pro.uid,
        service_id: selectedService.id,
        client_name: form.client_name.trim(),
        client_email: form.client_email.trim().toLowerCase(),
        client_phone: form.client_phone.trim(),
        date: selectedDate,
        start_time: selectedTime,
        end_time: endTime,
        status: "pending",
        pricing_snapshot: {
          label: selectedService.name,
          price: selectedService.price,
          duration: selectedService.duration,
        },
        created_at: new Date().toISOString(),
      }

      const ref = await addDoc(collection(db, "bookings"), bookingData)
      setBookingId(ref.id)
      setStep("success")
    } catch (err) {
      console.error("Submit booking error:", err)
      setError("Erreur lors de la réservation. Réessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Render ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Chargement...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-terracotta mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-2">
            Page introuvable
          </h1>
          <p className="text-[var(--text-muted)] mb-6">
            Ce professionnel n&apos;existe pas ou a désactivé sa page.
          </p>
          <Button variant="secondary" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!pro) return null

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <Sparkles className="h-5 w-5 text-terracotta" />
            <span className="font-heading text-lg font-bold text-[var(--text-primary)]">BookMeUp</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Pro profile header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar placeholder */}
            <div className="w-24 h-24 rounded-[var(--radius-lg)] bg-terracotta/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-10 w-10 text-terracotta" />
            </div>
            <div className="flex-1">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                {pro.business_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[var(--text-secondary)]">
                {pro.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {pro.city}
                  </span>
                )}
                {pro.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-warning fill-warning" />
                    {pro.rating} ({pro.review_count} avis)
                  </span>
                )}
              </div>
              {pro.description && (
                <p className="text-sm text-[var(--text-muted)] mt-3 max-w-lg">
                  {pro.description}
                </p>
              )}
              {/* Socials */}
              <div className="flex items-center gap-3 mt-3">
                {pro.socials?.instagram && (
                  <a
                    href={`https://instagram.com/${pro.socials.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {pro.socials?.facebook && (
                  <a
                    href={pro.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {pro.socials?.website && (
                  <a
                    href={pro.socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Step indicator */}
        {step !== "success" && (
          <FadeIn delay={0.05}>
            <div className="flex items-center gap-2">
              {(["services", "date", "time", "info", "confirm"] as BookingStep[]).map((s, idx) => {
                const steps: BookingStep[] = ["services", "date", "time", "info", "confirm"]
                const currentIdx = steps.indexOf(step)
                const thisIdx = idx
                const labels = ["Service", "Date", "Heure", "Infos", "Confirmer"]
                return (
                  <div key={s} className="flex items-center gap-2">
                    {idx > 0 && (
                      <div className={`w-6 h-0.5 ${thisIdx <= currentIdx ? "bg-terracotta" : "bg-[var(--border-default)]"}`} />
                    )}
                    <div
                      className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                        thisIdx < currentIdx
                          ? "bg-terracotta/10 text-terracotta"
                          : thisIdx === currentIdx
                          ? "bg-terracotta text-white"
                          : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                      }`}
                    >
                      {thisIdx < currentIdx ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                      <span className="hidden sm:inline">{labels[idx]}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </FadeIn>
        )}

        {/* ────────── STEP 1 : Services ────────── */}
        {step === "services" && (
          <FadeIn>
            <div>
              <h2 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-4">
                Choisissez une prestation
              </h2>
              {services.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-[var(--text-muted)]">
                      Aucun service disponible pour le moment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <StaggerContainer className="space-y-3" staggerDelay={0.04}>
                  {services.map((service) => (
                    <StaggerItem key={service.id}>
                      <button
                        onClick={() => {
                          setSelectedService(service)
                          setStep("date")
                        }}
                        className={`w-full text-left p-4 rounded-[var(--radius-md)] border-2 transition-all hover:shadow-[var(--shadow-soft)] ${
                          selectedService?.id === service.id
                            ? "border-terracotta bg-terracotta/5"
                            : "border-[var(--border-default)] bg-[var(--bg-secondary)] hover:border-[var(--border-subtle)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                              {service.name}
                            </h3>
                            {service.description && (
                              <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {service.duration >= 60
                                  ? `${Math.floor(service.duration / 60)}h${service.duration % 60 || ""}`
                                  : `${service.duration} min`}
                              </span>
                              {service.category && (
                                <Badge variant="outline">{service.category}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="text-lg font-bold text-terracotta">{service.price} €</p>
                          </div>
                        </div>
                      </button>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </div>
          </FadeIn>
        )}

        {/* ────────── STEP 2 : Date ────────── */}
        {step === "date" && (
          <FadeIn>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setStep("services")}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                  Choisissez une date
                </h2>
              </div>

              {/* Selected service recap */}
              {selectedService && (
                <div className="mb-4 p-3 bg-terracotta/5 rounded-[var(--radius-md)] border border-terracotta/20 text-sm">
                  <span className="font-medium text-[var(--text-primary)]">{selectedService.name}</span>
                  <span className="text-[var(--text-muted)]">
                    {" "}· {selectedService.duration} min · {selectedService.price} €
                  </span>
                </div>
              )}

              <MiniCalendar
                calendarDate={calendarDate}
                onMonthChange={setCalendarDate}
                selectedDate={selectedDate}
                onSelectDate={(d) => {
                  setSelectedDate(d)
                  setSelectedTime(null)
                  setStep("time")
                }}
                availability={availability}
              />
            </div>
          </FadeIn>
        )}

        {/* ────────── STEP 3 : Time ────────── */}
        {step === "time" && (
          <FadeIn>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => { setStep("date"); setSelectedTime(null) }}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                  Choisissez un créneau
                </h2>
              </div>

              {/* Date recap */}
              <div className="mb-4 p-3 bg-terracotta/5 rounded-[var(--radius-md)] border border-terracotta/20 text-sm">
                <span className="font-medium text-[var(--text-primary)]">{selectedService?.name}</span>
                <span className="text-[var(--text-muted)]">
                  {" "}· {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>

              {availableSlots.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--text-muted)]">
                      Aucun créneau disponible ce jour.
                    </p>
                    <Button variant="secondary" size="sm" className="mt-4" onClick={() => setStep("date")}>
                      Choisir une autre date
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => {
                        setSelectedTime(time)
                        setStep("info")
                      }}
                      className={`py-3 px-2 rounded-[var(--radius-md)] text-sm font-medium transition-all border-2 ${
                        selectedTime === time
                          ? "border-terracotta bg-terracotta text-white"
                          : "border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-terracotta/50"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* ────────── STEP 4 : Client info ────────── */}
        {step === "info" && (
          <FadeIn>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setStep("time")}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                  Vos coordonnées
                </h2>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <Input
                    label="Nom complet *"
                    placeholder="Marie Dupont"
                    value={form.client_name}
                    onChange={(e) => { setForm({ ...form, client_name: e.target.value }); setError("") }}
                  />
                  <Input
                    label="Email *"
                    type="email"
                    placeholder="marie@exemple.com"
                    value={form.client_email}
                    onChange={(e) => { setForm({ ...form, client_email: e.target.value }); setError("") }}
                  />
                  <Input
                    label="Téléphone *"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={form.client_phone}
                    onChange={(e) => { setForm({ ...form, client_phone: e.target.value }); setError("") }}
                  />

                  {error && (
                    <p className="text-sm text-error">{error}</p>
                  )}

                  <Button onClick={() => {
                    if (!form.client_name.trim()) { setError("Votre nom est requis"); return }
                    if (!form.client_email.trim() || !form.client_email.includes("@")) { setError("Un email valide est requis"); return }
                    if (!form.client_phone.trim()) { setError("Votre téléphone est requis"); return }
                    setError("")
                    setStep("confirm")
                  }} className="w-full">
                    Continuer
                  </Button>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        )}

        {/* ────────── STEP 5 : Confirm ────────── */}
        {step === "confirm" && selectedService && selectedDate && selectedTime && (
          <FadeIn>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setStep("info")}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">
                  Confirmez votre réservation
                </h2>
              </div>

              <Card>
                <CardContent className="p-6 space-y-5">
                  {/* Recap */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-terracotta mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Professionnel</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{pro.business_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-terracotta mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Prestation</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {selectedService.name}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {selectedService.duration} min · {selectedService.price} €
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-terracotta mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Date & heure</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">
                          {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {selectedTime} —{" "}
                          {(() => {
                            const [h, m] = selectedTime.split(":").map(Number)
                            const endMin = h * 60 + m + selectedService.duration
                            return `${Math.floor(endMin / 60).toString().padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-terracotta mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Vos coordonnées</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{form.client_name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{form.client_email} · {form.client_phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--border-default)] pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-[var(--text-secondary)]">Total</span>
                      <span className="text-xl font-bold text-[var(--text-primary)]">{selectedService.price} €</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mb-4">
                      Le paiement se fera sur place. Votre réservation sera confirmée par le professionnel.
                    </p>

                    {error && <p className="text-sm text-error mb-3">{error}</p>}

                    <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
                      {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Check className="h-5 w-5" />
                      )}
                      {submitting ? "Réservation en cours..." : "Confirmer la réservation"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        )}

        {/* ────────── SUCCESS ────────── */}
        {step === "success" && selectedService && selectedDate && selectedTime && (
          <FadeIn>
            <Card className="border-sage/30 bg-sage/5">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-sage-dark" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Réservation envoyée !
                </h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">
                  Votre demande de rendez-vous a été envoyée à <strong>{pro.business_name}</strong>.
                  Vous recevrez une confirmation par email à <strong>{form.client_email}</strong>.
                </p>

                <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-4 text-left max-w-sm mx-auto mb-6 space-y-2">
                  <p className="text-sm">
                    <span className="text-[var(--text-muted)]">Prestation :</span>{" "}
                    <span className="font-medium text-[var(--text-primary)]">{selectedService.name}</span>
                  </p>
                  <p className="text-sm capitalize">
                    <span className="text-[var(--text-muted)]">Date :</span>{" "}
                    <span className="font-medium text-[var(--text-primary)]">
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-[var(--text-muted)]">Heure :</span>{" "}
                    <span className="font-medium text-[var(--text-primary)]">{selectedTime}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-[var(--text-muted)]">Prix :</span>{" "}
                    <span className="font-medium text-[var(--text-primary)]">{selectedService.price} €</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setStep("services")
                      setSelectedService(null)
                      setSelectedDate(null)
                      setSelectedTime(null)
                      setForm(EMPTY_FORM)
                      setBookingId(null)
                    }}
                  >
                    Réserver un autre créneau
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/">Retour à l&apos;accueil</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-default)] bg-[var(--bg-secondary)] mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <Link href="/" className="flex items-center gap-1 hover:text-[var(--text-primary)]">
            <Sparkles className="h-4 w-4 text-terracotta" />
            BookMeUp
          </Link>
          <p>Propulsé par BookMeUp</p>
        </div>
      </footer>
    </div>
  )
}

/* ── Mini Calendar Component ── */

function MiniCalendar({
  calendarDate,
  onMonthChange,
  selectedDate,
  onSelectDate,
  availability,
}: {
  calendarDate: Date
  onMonthChange: (d: Date) => void
  selectedDate: string | null
  onSelectDate: (d: string) => void
  availability: Availability[]
}) {
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6

    const days: (number | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [year, month])

  const todayStr = new Date().toISOString().split("T")[0]
  const monthLabel = calendarDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

  function isDayAvailable(day: number): boolean {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    // Past dates
    if (dateStr < todayStr) return false
    const dateObj = new Date(dateStr + "T00:00:00")
    const dow = dateObj.getDay()
    const dayAvail = availability.find((a) => a.day === dow)
    return !!dayAvail?.enabled && dayAvail.slots.length > 0
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => onMonthChange(new Date(year, month - 1, 1))}
            className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">
            {monthLabel}
          </span>
          <button
            onClick={() => onMonthChange(new Date(year, month + 1, 1))}
            className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-[var(--text-muted)] py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={idx} className="aspect-square" />

            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const available = isDayAvailable(day)
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate

            return (
              <button
                key={idx}
                disabled={!available}
                onClick={() => onSelectDate(dateStr)}
                className={`aspect-square rounded-[var(--radius-sm)] flex items-center justify-center text-sm transition-colors ${
                  isSelected
                    ? "bg-terracotta text-white font-semibold"
                    : available
                    ? isToday
                      ? "bg-terracotta/10 text-terracotta font-semibold hover:bg-terracotta/20"
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                    : "text-[var(--text-muted)]/40 cursor-not-allowed"
                }`}
              >
                {day}
              </button>
            )
          })}
        </div>

        <p className="text-xs text-[var(--text-muted)] mt-3 text-center">
          Les jours disponibles sont cliquables
        </p>
      </CardContent>
    </Card>
  )
}
ENDOFFILE

echo "Progress: 11/11 files created - COMPLETE!"
echo ""
echo "All files successfully created in:"
echo "  src/components/dashboard/"
echo "  src/app/dashboard/"
echo "  src/app/book/[slug]/"
echo ""
echo "Run this script from the BookMeUp18 directory:"
echo "  cd BookMeUp18 && bash ../setup-phase2-3.sh"
