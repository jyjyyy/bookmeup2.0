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
        className="hidden md:flex w-[260px] flex-col flex-shrink-0 border-r border-[#EDE8F0]"
        style={{
          background: 'linear-gradient(180deg, #FDFBFE 0%, #F8F4FA 100%)',
          minHeight: '100vh',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        {/* Pro card at top */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3 p-3 rounded-[16px] bg-white border border-primary/10 shadow-[0_4px_16px_rgba(20,0,50,0.04)]">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-primary to-[#9C44AF] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {avatarLetter}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#2A1F2D] truncate">{displayName}</p>
              <p className="text-xs text-[#8a7a92] truncate">Plan {plan}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-4 py-2 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b5a8bc] px-3 mb-2">
            Menu
          </p>
          {NAV_ITEMS.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-sm font-medium transition-all ${
                isActive(href)
                  ? 'bg-gradient-to-r from-primary/10 to-secondary text-[#2A1F2D] shadow-[0_2px_8px_rgba(200,109,215,0.1)]'
                  : 'text-[#7A6B80] hover:bg-white hover:text-[#2A1F2D] hover:shadow-[0_2px_8px_rgba(20,0,50,0.04)]'
              }`}
            >
              <span
                className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-base flex-shrink-0 ${
                  isActive(href) ? 'bg-white shadow-sm' : 'bg-[#F5F0F7]'
                }`}
              >
                {icon}
              </span>
              {label}
            </Link>
          ))}
        </nav>

        {/* Bottom branding */}
        <div className="px-5 py-4 border-t border-[#EDE8F0]">
          <p className="text-[11px] text-[#b5a8bc] font-medium">
            Propulsé par <span className="gradient-text font-bold">BookMeUp</span>
          </p>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-[#EDE8F0] px-6 py-0 h-[72px] flex items-center gap-4 sticky top-0 z-40">
          {/* Burger mobile */}
          <button
            className="md:hidden p-2.5 rounded-[12px] hover:bg-secondary transition-colors"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Navigation"
          >
            <span className="block w-5 h-0.5 bg-[#2A1F2D] mb-1.5 rounded-full" />
            <span className="block w-5 h-0.5 bg-[#2A1F2D] mb-1.5 rounded-full" />
            <span className="block w-5 h-0.5 bg-[#2A1F2D] rounded-full" />
          </button>

          <div>
            <h1 className="text-base font-bold text-[#2A1F2D] leading-tight">
              Bonjour, {displayName} 👋
            </h1>
            <p className="text-xs text-[#8a7a92]">Tableau de bord professionnel</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary text-primary border border-primary/15">
              Plan {plan}
            </span>
          </div>
        </header>

        {/* Mobile nav */}
        {mobileNavOpen && (
          <nav className="md:hidden border-b border-[#EDE8F0] px-4 py-3 flex flex-col gap-1 bg-white/95 backdrop-blur-xl animate-fadeIn">
            {NAV_ITEMS.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-sm font-medium transition-all ${
                  isActive(href)
                    ? 'bg-gradient-to-r from-primary/10 to-secondary text-[#2A1F2D]'
                    : 'text-[#7A6B80] hover:bg-secondary hover:text-[#2A1F2D]'
                }`}
              >
                <span className="w-8 h-8 rounded-[10px] bg-[#F5F0F7] flex items-center justify-center text-base">{icon}</span>
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Content */}
        <main className="flex-1 px-5 py-8 md:px-10 md:py-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
