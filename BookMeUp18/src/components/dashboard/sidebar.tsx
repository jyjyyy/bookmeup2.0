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
