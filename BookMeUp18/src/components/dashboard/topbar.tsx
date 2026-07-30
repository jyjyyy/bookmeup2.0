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
