'use client'

import { ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getCurrentUser, CurrentUser, signOut } from '@/lib/auth'
import { checkSubscriptionStatus } from '@/lib/subscription'
import { Loader } from '@/components/ui/loader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [current, setCurrent] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<string>('Starter')

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

      // Check subscription status - exclude subscription page to avoid redirect loop
      const isSubscriptionPage = pathname?.includes('/dashboard/settings/subscription')
      const subscriptionStatus = await checkSubscriptionStatus(data.user.uid)
      
      // Set plan from subscription status (capitalize first letter)
      if (subscriptionStatus.plan) {
        const planCapitalized = subscriptionStatus.plan.charAt(0).toUpperCase() + subscriptionStatus.plan.slice(1)
        setPlan(planCapitalized)
      }
      
      if (!isSubscriptionPage) {
        if (!subscriptionStatus.hasActiveSubscription) {
          // Redirect to subscription page if no active subscription
          router.replace('/dashboard/settings/subscription')
          return
        }
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-white/80 px-4 py-6 shadow-sm md:flex">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            BookMeUp
          </p>
          <p className="mt-1 text-sm font-medium text-gray-800">{displayName}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 text-sm">
          <Link
            href="/dashboard"
            className="rounded-[32px] px-3 py-2 text-gray-700 hover:bg-pink-50 hover:text-primary transition-colors"
          >
            📊 Tableau de bord
          </Link>
          <Link
            href="/dashboard/services"
            className="rounded-[32px] px-3 py-2 text-gray-700 hover:bg-pink-50 hover:text-primary transition-colors"
          >
            🛠️ Services
          </Link>
          <Link
            href="/dashboard/calendar"
            className="rounded-[32px] px-3 py-2 text-gray-700 hover:bg-pink-50 hover:text-primary transition-colors"
          >
            📅 Calendrier
          </Link>
          <Link
            href="/dashboard/availability"
            className="rounded-[32px] px-3 py-2 text-gray-700 hover:bg-pink-50 hover:text-primary transition-colors"
          >
            ⏱️ Disponibilités
          </Link>
          <Link
            href="/dashboard/clients"
            className="rounded-[32px] px-3 py-2 text-gray-700 hover:bg-pink-50 hover:text-primary transition-colors"
          >
            🚫 Clients bloqués
          </Link>
          <Link
            href="/dashboard/settings"
            className="rounded-[32px] px-3 py-2 text-gray-700 hover:bg-pink-50 hover:text-primary transition-colors"
          >
            🔧 Paramètres
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white/80 px-4 py-3 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Tableau de bord
            </p>
            <h1 className="text-lg font-semibold text-gray-900">
              Bonjour, {displayName}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">
              Plan actuel :{' '}
              <span className="rounded-full bg-pink-50 px-3 py-1 font-medium text-primary">
                {plan}
              </span>
            </div>
            <Button
              variant="subtle"
              size="sm"
              onClick={async () => {
                try {
                  await signOut()
                  router.push('/')
                } catch (error) {
                  console.error('[DashboardShell] Error during logout:', error)
                }
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              Se déconnecter
            </Button>
          </div>
        </header>
        <main className="flex-1 bg-gray-50 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

