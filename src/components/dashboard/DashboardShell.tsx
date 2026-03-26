'use client'

import { ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getCurrentUser, CurrentUser } from '@/lib/auth'
import { checkSubscriptionStatus } from '@/lib/subscription'
import { Loader } from '@/components/ui/loader'
import Link from 'next/link'

interface DashboardShellProps {
  children: ReactNode
}

const NAV_ITEMS = [
  { href: '/dashboard', icon: '📊', label: 'Tableau de bord' },
  { href: '/dashboard/services', icon: '✂️', label: 'Services' },
  { href: '/dashboard/calendar', icon: '📅', label: 'Calendrier' },
  { href: '/dashboard/availability', icon: '⏱️', label: 'Disponibilités' },
  { href: '/dashboard/clients', icon: '🚫', label: 'Clients bloqués' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Paramètres' },
]

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [current, setCurrent] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<string>('Starter')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      const data = await getCurrentUser()

      if (!data.user) {
        router.replace('/auth/login?redirect=/dashboard')
        return
      }

      if (!data.profile || data.profile.role !== 'pro') {
        router.replace('/search')
        return
      }

      const isSubscriptionPage = pathname?.includes('/dashboard/settings/subscription')
      const subscriptionStatus = await checkSubscriptionStatus(data.user.uid)

      if (subscriptionStatus.plan) {
        const planCapitalized =
          subscriptionStatus.plan.charAt(0).toUpperCase() + subscriptionStatus.plan.slice(1)
        setPlan(planCapitalized)
      }

      if (!isSubscriptionPage && !subscriptionStatus.hasActiveSubscription) {
        router.replace('/dashboard/settings/subscription')
        return
      }

      setCurrent(data)
      setLoading(false)
    }

    load()
  }, [router, pathname])

  if (loading || !current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-[#7A6B80]">
          <Loader />
          <p className="text-sm">Chargement du tableau de bord…</p>
        </div>
      </div>
    )
  }

  const { profile } = current
  const displayName = profile?.name || profile?.email || 'Votre tableau de bord'
  const avatarLetter = (profile?.name || profile?.email || 'P')[0].toUpperCase()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname?.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── SIDEBAR DESKTOP ─────────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-[240px] flex-col flex-shrink-0"
        style={{
          background: 'linear-gradient(180deg, #2A1F2D 0%, #1e1225 100%)',
          minHeight: '100vh',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/8">
          <span className="text-xl font-extrabold gradient-text">BookMeUp</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-3 mb-2">
            Navigation
          </p>
          {NAV_ITEMS.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-all ${
                isActive(href)
                  ? 'bg-primary/20 text-white'
                  : 'text-white/55 hover:bg-white/7 hover:text-white/85'
              }`}
            >
              <span
                className={`w-8 h-8 rounded-[9px] flex items-center justify-center text-base flex-shrink-0 ${
                  isActive(href) ? 'bg-primary/30' : 'bg-white/5'
                }`}
              >
                {icon}
              </span>
              {label}
            </Link>
          ))}
        </nav>

        {/* Pro info at bottom */}
        <div className="px-4 py-4 border-t border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-[#9C44AF] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {avatarLetter}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white/85 truncate">{displayName}</p>
              <p className="text-xs text-white/40 truncate">Plan {plan}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Top bar */}
        <header className="glass border-b border-[#EDE8F0] px-5 py-0 h-[68px] flex items-center gap-4 sticky top-0 z-40">
          {/* Burger mobile */}
          <button
            className="md:hidden p-2 rounded-[10px] hover:bg-secondary transition-colors"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Navigation"
          >
            <span className="block w-5 h-0.5 bg-[#2A1F2D] mb-1.5" />
            <span className="block w-5 h-0.5 bg-[#2A1F2D] mb-1.5" />
            <span className="block w-5 h-0.5 bg-[#2A1F2D]" />
          </button>

          <div>
            <h1 className="text-base font-bold text-[#2A1F2D] leading-tight">
              Bonjour, {displayName} 👋
            </h1>
            <p className="text-xs text-[#7A6B80]">Tableau de bord professionnel</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary text-primary">
              Plan {plan}
            </span>
          </div>
        </header>

        {/* Mobile nav */}
        {mobileNavOpen && (
          <nav className="md:hidden border-b border-[#EDE8F0] px-4 py-3 flex flex-col gap-1 bg-white animate-fadeIn">
            {NAV_ITEMS.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-all ${
                  isActive(href)
                    ? 'bg-secondary text-primary'
                    : 'text-[#7A6B80] hover:bg-secondary hover:text-primary'
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Content */}
        <main className="flex-1 px-5 py-8 md:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
