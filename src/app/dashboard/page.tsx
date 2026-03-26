'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
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
import { useStatsRefresh } from '@/hooks/useStatsRefresh'

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 rounded-[24px] bg-primary/5" />
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState<'starter' | 'pro' | 'premium'>('starter')

  // Stats starter
  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    totalBookings: number
    totalRevenue: number
    upcomingBookings: number
    activeServices: number
  } | null>(null)

  // Stats pro/premium
  const [period, setPeriod] = useState<PeriodSelectorValue>('7d')
  const [proStatsLoading, setProStatsLoading] = useState(false)
  const [proStatsError, setProStatsError] = useState<string | null>(null)
  const [proStats, setProStats] = useState<ProStats | null>(null)

  const [premiumStatsLoading, setPremiumStatsLoading] = useState(false)
  const [premiumStatsError, setPremiumStatsError] = useState<string | null>(null)
  const [premiumStats, setPremiumStats] = useState<PremiumStats | null>(null)

  const [exportLoading, setExportLoading] = useState(false)

  const isProOrPremium = plan === 'pro' || plan === 'premium'

  // ── Chargement initial : toutes les stats en parallèle ──────────────────────
  const loadAllStats = useCallback(async () => {
    try {
      setStatsError(null)
      setLoadingStats(true)

      const current = await getCurrentUser()
      if (!current.user) return

      const uid = current.user.uid
      setUserId(uid)

      // Subscription + starter stats en parallèle
      const [sub, computed] = await Promise.all([
        checkSubscriptionStatus(uid),
        getStarterStats(uid),
      ])

      const resolvedPlan = (sub.plan as 'starter' | 'pro' | 'premium') ?? 'starter'
      setPlan(resolvedPlan)
      setStats(computed)
      setLoadingStats(false)

      // Pro / premium stats en parallèle (sans bloquer l'affichage starter)
      if (resolvedPlan === 'pro' || resolvedPlan === 'premium') {
        setProStatsLoading(true)
        const proPromise = getProStats(uid, period)
          .then((s) => setProStats(s))
          .catch(() => setProStatsError('Impossible de charger les statistiques avancées.'))
          .finally(() => setProStatsLoading(false))

        if (resolvedPlan === 'premium') {
          setPremiumStatsLoading(true)
          const premiumPromise = getPremiumStats(uid, period)
            .then((s) => setPremiumStats(s))
            .catch(() => setPremiumStatsError('Impossible de charger les statistiques Premium.'))
            .finally(() => setPremiumStatsLoading(false))
          await Promise.all([proPromise, premiumPromise])
        } else {
          await proPromise
        }
      }
    } catch (err) {
      console.error('[Dashboard] Error loading stats:', err)
      setStatsError('Impossible de charger vos statistiques pour le moment.')
      setLoadingStats(false)
    }
  }, [period])

  useEffect(() => {
    loadAllStats()
  }, [loadAllStats])

  // Refresh quand le calendrier met à jour une présence
  useStatsRefresh(loadAllStats)

  // ── Labels ──────────────────────────────────────────────────────────────────
  const periodLabel = useMemo(
    () => (period === '7d' ? '7 derniers jours' : '30 derniers jours'),
    [period]
  )

  const revenueLabel = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(stats?.totalRevenue ?? 0),
    [stats?.totalRevenue]
  )

  // ── Exports ─────────────────────────────────────────────────────────────────
  const handleExportCsv = async () => {
    if (!userId || plan !== 'premium') return
    try {
      setExportLoading(true)
      const data = await getAccountingExportData(userId, period)
      const csvs = generateAccountingCsv(data)
      downloadCsvFile('resume_comptabilite.csv', csvs.resume)
      downloadCsvFile('revenu_par_service.csv', csvs.byService)
      downloadCsvFile('revenu_par_client.csv', csvs.byClient)
      downloadCsvFile('revenu_par_mois.csv', csvs.byMonth)
    } catch (err) {
      console.error("[Dashboard] Erreur export CSV :", err)
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportPdf = async () => {
    if (!userId || plan !== 'premium') return
    try {
      setExportLoading(true)
      const data = await getAccountingExportData(userId, period)
      generateAccountingPdf(data, { periodLabel, exportedAt: new Date() })
    } catch (err) {
      console.error("[Dashboard] Erreur export PDF :", err)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#2A1F2D] mb-3">
          Tableau de bord
        </h1>
        <p className="text-lg text-[#7A6B80]">
          Bienvenue sur votre espace professionnel BookMeUp
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="space-y-4">
        {statsError && (
          <div className="rounded-[32px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {statsError}
          </div>
        )}
        {loadingStats ? (
          <StatsSkeleton />
        ) : (
          <StatsGrid
            totalRevenue={revenueLabel}
            upcomingBookings={stats?.upcomingBookings ?? 0}
            activeServices={stats?.activeServices ?? 0}
          />
        )}
      </div>

      {/* Statistiques avancées */}
      <Card className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-bookmeup">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Statistiques avancées
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#2A1F2D]">
              Analyse de votre activité
            </h2>
            <p className="mt-1 text-sm text-[#7A6B80]">
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
            <p className="mt-2 text-sm text-[#7A6B80]">
              Passez à <span className="font-medium text-primary">Pro</span> ou{' '}
              <span className="font-medium text-primary">Premium</span> pour accéder aux graphiques.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {proStatsError && (
              <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {proStatsError}
              </div>
            )}
            {proStatsLoading ? (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader />
                <span>Chargement des statistiques avancées…</span>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </Card>

      {/* Section Premium */}
      {plan !== 'starter' && (
        <div className="space-y-4">
          {plan === 'premium' ? (
            <>
              {premiumStatsError && (
                <div className="rounded-[32px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {premiumStatsError}
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {premiumStatsLoading ? (
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Loader />
                    <span>Chargement des statistiques Premium…</span>
                  </div>
                ) : (
                  <p className="text-sm text-[#7A6B80]">
                    Accédez à vos indicateurs avancés et exportez votre comptabilité.
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
                    {exportLoading ? 'Export PDF…' : 'Exporter en PDF'}
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
      )}

      {/* Message de bienvenue */}
      <Card className="rounded-[32px] border-2 border-primary/20 bg-gradient-to-br from-secondary/40 to-white p-8 shadow-bookmeup">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">✨</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-[#2A1F2D] mb-3">
              Bienvenue sur votre espace beauté
            </h2>
            <p className="text-base text-[#7A6B80] leading-relaxed">
              Ajoutez vos services, définissez vos horaires et commencez à accepter
              des réservations en ligne en quelques minutes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
