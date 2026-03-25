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
  { href: '/dashboard', label: '📊 Tableau de bord' },
  { href: '/dashboard/services', label: '🛠️ Services' },
  { href: '/dashboard/calendar', label: '📅 Calendrier' },
  { href: '/dashboard/availability', label: '⏱️ Disponibilités' },
  { href: '/dashboard/clients', label: '🚫 Clients bloqués' },
  { href: '/dashboard/settings', label: '🔧 Paramètres' },
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader />
          <p>Chargement du tableau de bord…</p>
        </div>
      </div>
    )
  }

  const { profile } = current
  const displayName = profile?.name || profile?.email || 'Votre tableau de bord'

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname?.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 flex-col border-r bg-white/80 px-4 py-6 shadow-sm md:flex">
        <div className="mb-8 px-3">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">BookMeUp</p>
          <p className="mt-1 text-sm font-medium text-gray-800 truncate">{displayName}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 text-sm">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-[32px] px-3 py-2 transition-colors ${
                isActive(href)
                  ? 'bg-pink-50 text-primary font-medium'
                  : 'text-gray-700 hover:bg-pink-50 hover:text-primary'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between border-b bg-white/80 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Burger mobile */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-pink-50 transition-colors"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Navigation"
            >
              <span className="block w-5 h-0.5 bg-gray-600 mb-1" />
              <span className="block w-5 h-0.5 bg-gray-600 mb-1" />
              <span className="block w-5 h-0.5 bg-gray-600" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Tableau de bord</p>
              <h1 className="text-lg font-semibold text-gray-900">Bonjour, {displayName}</h1>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Plan actuel :{' '}
            <span className="rounded-full bg-pink-50 px-3 py-1 font-medium text-primary">
              {plan}
            </span>
          </div>
        </header>

        {/* Nav mobile déroulante */}
        {mobileNavOpen && (
          <nav className="md:hidden bg-white border-b px-4 py-3 flex flex-col gap-1 shadow-sm">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                className={`rounded-[24px] px-3 py-2 text-sm transition-colors ${
                  isActive(href)
                    ? 'bg-pink-50 text-primary font-medium'
                    : 'text-gray-700 hover:bg-pink-50 hover:text-primary'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        <main className="flex-1 bg-gray-50 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
