'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { StatsGrid } from '@/components/stats/StatsGrid'
import PeriodSelector, { type PeriodSelectorValue } from '@/components/stats/PeriodSelector'
import { BookingsChart } from '@/components/stats/BookingsChart'
import { RevenueChart } from '@/components/stats/RevenueChart'
import { ServiceStats } from '@/components/stats/ServiceStats'
import { PremiumKpis } from '@/components/stats/PremiumKpis'
import { LockedPremiumBlock } from '@/components/stats/LockedPremiumBlock'
import { getCurrentUser } from '@/lib/auth'
import { getStarterStats } from '@/lib/stats/starterStats'
import { getProStats, type ProStats } from '@/lib/stats/proStats'
import { getPremiumStats, type PremiumStats } from '@/lib/stats/premiumStats'
import { checkSubscriptionStatus } from '@/lib/subscription'
import { getAccountingExportData } from '@/lib/exports/exportData'
import { generateAccountingCsv } from '@/lib/exports/exportCsv'
import { downloadCsvFile } from '@/lib/exports/downloadCsvClient'
import { generateAccountingPdf } from '@/lib/exports/exportPdf'

export default function DashboardPage() {
  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    totalBookings: number
    totalRevenue: number
    upcomingBookings: number
    activeServices: number
  } | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState<'starter' | 'pro' | 'premium'>('starter')

  const [period, setPeriod] = useState<PeriodSelectorValue>('7d')
  const [proStatsLoading, setProStatsLoading] = useState(false)
  const [proStatsError, setProStatsError] = useState<string | null>(null)
  const [proStats, setProStats] = useState<ProStats | null>(null)

  const [premiumStatsLoading, setPremiumStatsLoading] = useState(false)
  const [premiumStatsError, setPremiumStatsError] = useState<string | null>(null)
  const [premiumStats, setPremiumStats] = useState<PremiumStats | null>(null)

  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setStatsError(null)
        setLoadingStats(true)

        const current = await getCurrentUser()
        if (!current.user) return

        setUserId(current.user.uid)

        // Read plan (UI-gating only, no guard changes)
        const sub = await checkSubscriptionStatus(current.user.uid)
        setPlan((sub.plan as any) || 'starter')

        const computed = await getStarterStats(current.user.uid)
        setStats(computed)
      } catch (err) {
        console.error('[Dashboard] Error loading starter stats:', err)
        setStatsError('Impossible de charger vos statistiques pour le moment.')
      } finally {
        setLoadingStats(false)
      }
    }

    load()
  }, [])

  const isProOrPremium = plan === 'pro' || plan === 'premium'

  useEffect(() => {
    const loadProStats = async () => {
      if (!userId) return
      if (!isProOrPremium) {
        setProStats(null)
        setProStatsError(null)
        setProStatsLoading(false)
        return
      }

      try {
        setProStatsError(null)
        setProStatsLoading(true)
        const computed = await getProStats(userId, period)
        setProStats(computed)
      } catch (err) {
        console.error('[Dashboard] Error loading pro stats:', err)
        setProStatsError('Impossible de charger les statistiques avancées pour le moment.')
        setProStats(null)
      } finally {
        setProStatsLoading(false)
      }
    }

    loadProStats()
  }, [userId, period, isProOrPremium])

  useEffect(() => {
    const loadPremiumStats = async () => {
      if (!userId) return

      // Strict gating:
      // - only Premium plan calls getPremiumStats
      // - Pro shows locked UI
      // - Starter sees nothing
      if (plan !== 'premium') {
        setPremiumStats(null)
        setPremiumStatsError(null)
        setPremiumStatsLoading(false)
        return
      }

      try {
        setPremiumStatsError(null)
        setPremiumStatsLoading(true)
        const computed = await getPremiumStats(userId, period)
        setPremiumStats(computed)
      } catch (err) {
        console.error('[Dashboard] Error loading premium stats:', err)
        setPremiumStatsError('Impossible de charger les statistiques Premium pour le moment.')
        setPremiumStats(null)
      } finally {
        setPremiumStatsLoading(false)
      }
    }

    loadPremiumStats()
  }, [userId, period, plan])

  const periodLabel = useMemo(() => {
    return period === '7d' ? '7 derniers jours' : '30 derniers jours'
  }, [period])

  const revenueLabel = useMemo(() => {
    const amount = stats?.totalRevenue ?? 0
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }, [stats?.totalRevenue])

  const handleExportCsv = async () => {
    if (!userId) return
    if (plan !== 'premium') return

    try {
      setExportLoading(true)

      const exportData = await getAccountingExportData(userId, period)
      const csvs = generateAccountingCsv(exportData)

      downloadCsvFile('resume_comptabilite.csv', csvs.resume)
      downloadCsvFile('revenu_par_service.csv', csvs.byService)
      downloadCsvFile('revenu_par_client.csv', csvs.byClient)
      downloadCsvFile('revenu_par_mois.csv', csvs.byMonth)
    } catch (error) {
      console.error("[Dashboard] Erreur lors de l'export comptable CSV :", error)
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportPdf = async () => {
    if (!userId) return
    if (plan !== 'premium') return

    try {
      setExportLoading(true)

      const exportData = await getAccountingExportData(userId, period)
      generateAccountingPdf(exportData, {
        periodLabel,
        exportedAt: new Date(),
      })
    } catch (error) {
      console.error("[Dashboard] Erreur lors de l'export comptable PDF :", error)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec message de bienvenue */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#2A1F2D] mb-3">
          Tableau de bord
        </h1>
        <p className="text-lg text-slate-600">
          Bienvenue sur votre espace professionnel BookMeUp
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="space-y-4">
        {statsError ? (
          <div className="rounded-[32px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {statsError}
          </div>
        ) : null}

        {loadingStats ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader />
            <span>Chargement des statistiques…</span>
          </div>
        ) : null}

        <StatsGrid
          totalBookings={loadingStats ? '…' : stats?.totalBookings ?? 0}
          totalRevenue={loadingStats ? '…' : revenueLabel}
          upcomingBookings={loadingStats ? '…' : stats?.upcomingBookings ?? 0}
          activeServices={loadingStats ? '…' : stats?.activeServices ?? 0}
        />
      </div>

      {/* Statistiques avancées (Pro / Premium uniquement) */}
      <Card className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-bookmeup">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Statistiques avancées
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#2A1F2D]">
              Analyse de votre activité
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Réservations, revenus et performance par service.
            </p>
          </div>

          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        {!isProOrPremium ? (
          <div className="mt-6 rounded-[24px] border border-primary/15 bg-secondary/40 px-5 py-6">
            <p className="text-sm font-semibold text-[#2A1F2D]">
              🔒 Statistiques avancées indisponibles avec le plan Starter
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Passez à <span className="font-medium text-primary">Pro</span> ou{' '}
              <span className="font-medium text-primary">Premium</span> pour accéder aux graphiques
              et à l’analyse détaillée.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {proStatsError ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {proStatsError}
              </div>
            ) : null}

            {proStatsLoading ? (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader />
                <span>Chargement des statistiques avancées…</span>
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <BookingsChart data={proStats?.bookingsByDate ?? []} />
              <RevenueChart
                data={(proStats?.revenueByDate ?? []).map((d) => ({
                  date: d.date,
                  total: d.revenue,
                }))}
              />
            </div>

            <ServiceStats
              data={(proStats?.statsByService ?? []).map((s) => ({
                serviceName: s.serviceName,
                bookings: s.bookings,
                revenue: s.revenue,
              }))}
            />
          </div>
        )}
      </Card>

      {/* Section Premium (Premium uniquement / Pro = verrouillé / Starter = rien) */}
      {plan !== 'starter' ? (
        <div className="space-y-4">
          {plan === 'premium' ? (
            <>
              {premiumStatsError ? (
                <div className="rounded-[32px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {premiumStatsError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {premiumStatsLoading ? (
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Loader />
                    <span>Chargement des statistiques Premium…</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    Accédez à vos indicateurs avancés et exportez votre comptabilité au format CSV ou PDF.
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={exportLoading || !userId}
                    className="rounded-[32px] px-5 py-2 text-sm font-semibold shadow-bookmeup disabled:opacity-60"
                    variant="primary"
                  >
                    {exportLoading ? 'Export en cours…' : 'Exporter en CSV'}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={exportLoading || !userId}
                    className="rounded-[32px] px-5 py-2 text-sm font-semibold shadow-bookmeup disabled:opacity-60"
                    variant="primary"
                  >
                    {exportLoading ? 'Export PDF en cours…' : 'Exporter en PDF'}
                  </Button>
                </div>
              </div>

              <PremiumKpis
                periodLabel={periodLabel}
                comparison={
                  premiumStats?.periodComparison ?? {
                    bookings: { current: 0, previous: 0, changePercent: 0 },
                    revenue: { current: 0, previous: 0, changePercent: 0 },
                  }
                }
                occupancyRate={premiumStats?.occupancyRate ?? 0}
                cancellations={premiumStats?.cancellations ?? { count: 0, rate: 0 }}
                uniqueClients={premiumStats?.uniqueClients ?? 0}
              />
            </>
          ) : (
            <LockedPremiumBlock />
          )}
        </div>
      ) : null}

      {/* Message de bienvenue amélioré */}
      <Card className="rounded-[32px] border-2 border-primary/20 bg-gradient-to-br from-secondary/40 to-white p-8 shadow-bookmeup">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">✨</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-[#2A1F2D] mb-3">
              Bienvenue sur votre espace beauté
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Ajoutez vos services, définissez vos horaires et commencez à accepter
              des réservations en ligne en quelques minutes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}


