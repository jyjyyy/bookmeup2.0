'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
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
import ExportPeriodSelector, { type ExportPeriodSelection } from '@/components/stats/ExportPeriodSelector'
import { TodayAppointments } from '@/components/dashboard/TodayAppointments'
import { useStatsRefresh } from '@/lib/hooks/useStatsRefresh'

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 rounded-[20px] bg-gradient-to-br from-primary/5 to-secondary/30" />
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState<'starter' | 'pro' | 'premium' | null>(null)

  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    totalBookings: number
    totalRevenue: number
    upcomingBookings: number
    activeServices: number
  } | null>(null)

  const [period, setPeriod] = useState<PeriodSelectorValue>('7d')
  const [proStatsLoading, setProStatsLoading] = useState(false)
  const [proStatsError, setProStatsError] = useState<string | null>(null)
  const [proStats, setProStats] = useState<ProStats | null>(null)

  const [premiumStatsLoading, setPremiumStatsLoading] = useState(false)
  const [premiumStatsError, setPremiumStatsError] = useState<string | null>(null)
  const [premiumStats, setPremiumStats] = useState<PremiumStats | null>(null)

  const [exportLoading, setExportLoading] = useState(false)
  const [proSlug, setProSlug] = useState<string | null>(null)
  const [exportPeriod, setExportPeriod] = useState<ExportPeriodSelection>({ mode: '30d' })

  const isProOrPremium = plan === 'pro' || plan === 'premium'

  const loadAllStats = useCallback(async () => {
    try {
      setStatsError(null)
      setLoadingStats(true)

      const current = await getCurrentUser()
      if (!current.user) return

      const uid = current.user.uid
      setUserId(uid)

      const [sub, computed] = await Promise.all([
        checkSubscriptionStatus(uid),
        getStarterStats(uid),
      ])

      const resolvedPlan = (sub.plan as 'starter' | 'pro' | 'premium') || null
      setPlan(resolvedPlan)
      setStats(computed)
      setLoadingStats(false)

      // Load pro slug for public profile link
      try {
        const { doc, getDoc } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebaseClient')
        const proDoc = await getDoc(doc(db, 'pros', uid))
        if (proDoc.exists()) {
          const proData = proDoc.data()
          if (proData?.slug) setProSlug(proData.slug)
        }
      } catch {}


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

  useStatsRefresh(loadAllStats)

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

  const handleExportCsv = async () => {
    if (!userId || plan !== 'premium') return
    try {
      setExportLoading(true)
      const result = await getAccountingExportData(userId, exportPeriod.mode, exportPeriod.target)
      const csvs = generateAccountingCsv(result.data)
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
      const result = await getAccountingExportData(userId, exportPeriod.mode, exportPeriod.target)
      generateAccountingPdf(result.data, { periodLabel: result.periodLabel, exportedAt: new Date() })
    } catch (err) {
      console.error("[Dashboard] Erreur export PDF :", err)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[#9C44AF] text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Tableau de bord
        </div>
        <h1 className="text-2xl font-extrabold text-[#2A1F2D] mb-1">
          Vue d&apos;ensemble
        </h1>
        <p className="text-sm text-[#8a7a92]">
          Suivez votre activité et gérez votre espace professionnel.
        </p>
      </motion.div>

      {/* No subscription alert */}
      {!loadingStats && plan === null && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-[22px] border border-orange-200/60 bg-gradient-to-r from-orange-50 to-amber-50/50 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-[0_4px_20px_rgba(20,0,50,0.04)]"
        >
          <div className="w-12 h-12 rounded-[14px] bg-orange-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">⚠️</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-orange-800 mb-0.5">
              Aucun abonnement actif
            </p>
            <p className="text-xs text-orange-700/80">
              Choisissez un abonnement pour débloquer toutes les fonctionnalités.
            </p>
          </div>
          <a
            href="/dashboard/settings/subscription"
            className="btn-gradient text-white px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap shadow-[0_4px_16px_rgba(200,109,215,0.3)] hover:shadow-[0_6px_24px_rgba(200,109,215,0.4)] hover:-translate-y-0.5 transition-all"
          >
            Choisir un abonnement
          </a>
        </motion.div>
      )}

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {statsError && (
          <div className="rounded-[18px] border border-red-200/60 bg-red-50/80 px-5 py-4 text-sm text-red-700 flex items-center gap-3 mb-4 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-[10px] bg-red-100 flex items-center justify-center shrink-0 text-sm">⚠️</div>
            <p>{statsError}</p>
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
      </motion.div>

      {/* Today's appointments */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
      >
        <TodayAppointments proId={userId} />
      </motion.div>

      {/* Advanced stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-[24px] border border-primary/8 bg-white p-7 shadow-[0_4px_24px_rgba(20,0,50,0.04)]"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-primary/15 to-secondary flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📈</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2A1F2D]">
                Statistiques avancées
              </h2>
              <p className="text-xs text-[#8a7a92] mt-0.5">
                Réservations, revenus et performance par service.
              </p>
            </div>
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        {!isProOrPremium ? (
          <div className="rounded-[18px] border border-primary/10 bg-gradient-to-br from-[#F5F0F7] to-secondary/30 px-6 py-7 text-center">
            <div className="w-12 h-12 rounded-[14px] bg-white shadow-sm border border-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">🔒</span>
            </div>
            <p className="text-sm font-bold text-[#2A1F2D] mb-1">
              Statistiques avancées indisponibles
            </p>
            <p className="text-xs text-[#8a7a92]">
              Passez à <span className="font-semibold text-primary">Pro</span> ou{' '}
              <span className="font-semibold text-primary">Premium</span> pour accéder aux graphiques.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {proStatsError && (
              <div className="rounded-[16px] border border-red-200/60 bg-red-50/80 px-4 py-3 text-sm text-red-700 flex items-center gap-3">
                <span className="text-sm">⚠️</span>
                <p>{proStatsError}</p>
              </div>
            )}
            {proStatsLoading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-sm text-[#8a7a92]">
                <Loader />
                <span>Chargement des statistiques avancées…</span>
              </div>
            ) : (
              <>
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-[20px] border border-[#EDE8F0] p-5 bg-[#FDFBFE]">
                    <BookingsChart data={proStats?.bookingsByDate ?? []} />
                  </div>
                  <div className="rounded-[20px] border border-[#EDE8F0] p-5 bg-[#FDFBFE]">
                    <RevenueChart
                      data={(proStats?.revenueByDate ?? []).map((d) => ({
                        date: d.date,
                        total: d.revenue,
                      }))}
                    />
                  </div>
                </div>
                <div className="rounded-[20px] border border-[#EDE8F0] p-5 bg-[#FDFBFE]">
                  <ServiceStats
                    data={(proStats?.statsByService ?? []).map((s) => ({
                      serviceName: s.serviceName,
                      bookings: s.bookings,
                      revenue: s.revenue,
                    }))}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>

      {/* Premium section */}
      {plan !== null && plan !== 'starter' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="space-y-5"
        >
          {plan === 'premium' ? (
            <>
              {premiumStatsError && (
                <div className="rounded-[16px] border border-red-200/60 bg-red-50/80 px-4 py-3 text-sm text-red-700 flex items-center gap-3">
                  <span>⚠️</span> {premiumStatsError}
                </div>
              )}
              <div className="rounded-[20px] bg-white border border-primary/8 p-5 shadow-[0_4px_20px_rgba(20,0,50,0.04)] space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {premiumStatsLoading ? (
                    <div className="flex items-center gap-3 text-sm text-[#8a7a92]">
                      <Loader />
                      <span>Chargement des statistiques Premium…</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center text-sm">
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#2A1F2D]">Exports comptables</p>
                        <p className="text-xs text-[#8a7a92]">Choisissez la période et exportez vos données.</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      disabled={exportLoading || !userId}
                      className="px-5 py-2.5 rounded-full text-xs font-bold border border-[#EDE8F0] text-[#2A1F2D] hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                    >
                      {exportLoading ? 'Export…' : 'Exporter CSV'}
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      disabled={exportLoading || !userId}
                      className="px-5 py-2.5 rounded-full text-xs font-bold btn-gradient shadow-[0_4px_16px_rgba(200,109,215,0.3)] disabled:opacity-50"
                    >
                      {exportLoading ? 'Export…' : 'Exporter PDF'}
                    </button>
                  </div>
                </div>
                <ExportPeriodSelector value={exportPeriod} onChange={setExportPeriod} />
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
        </motion.div>
      )}

      {/* Welcome card + Public profile */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-[24px] border border-primary/10 bg-gradient-to-br from-white via-secondary/20 to-primary/5 p-7 shadow-[0_4px_24px_rgba(20,0,50,0.04)] overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
        <div className="flex flex-col sm:flex-row items-start gap-4 relative">
          <div className="w-14 h-14 rounded-[16px] bg-white shadow-[0_4px_16px_rgba(20,0,50,0.06)] border border-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">✨</span>
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-[#2A1F2D] mb-1.5">
              Bienvenue sur votre espace beauté
            </h2>
            <p className="text-sm text-[#8a7a92] leading-relaxed mb-3">
              Ajoutez vos services, définissez vos horaires et commencez à accepter
              des réservations en ligne en quelques minutes.
            </p>
            {proSlug && (
              <a
                href={`/pro/${proSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Voir mon profil public
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
