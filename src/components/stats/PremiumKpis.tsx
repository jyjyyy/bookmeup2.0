'use client'

import { Card } from '@/components/ui/card'

export interface PremiumKpisProps {
  periodLabel: string
  comparison: {
    bookings: { current: number; previous: number; changePercent: number }
    revenue: { current: number; previous: number; changePercent: number }
  }
  occupancyRate: number
  cancellations: { count: number; rate: number }
  uniqueClients: number
}

function formatEUR(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number, digits: number = 1): string {
  return (
    new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value) + ' %'
  )
}

function TrendBadge({ value }: { value: number }) {
  const isUp = value > 0
  const isDown = value < 0

  const label =
    value === 0
      ? '0 %'
      : `${isUp ? '+' : ''}${new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(value)} %`

  const symbol = isUp ? '▲' : isDown ? '▼' : '•'
  const classes = isUp
    ? 'bg-primary/10 text-primary border-primary/20'
    : isDown
      ? 'bg-[#9C44AF]/10 text-[#9C44AF] border-[#9C44AF]/20'
      : 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}
    >
      <span>{symbol}</span>
      <span>{label}</span>
    </span>
  )
}

export function PremiumKpis({
  periodLabel,
  comparison,
  occupancyRate,
  cancellations,
  uniqueClients,
}: PremiumKpisProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Premium
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[#2A1F2D]">
            Indicateurs clés — {periodLabel}
          </h3>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        {/* Évolution réservations */}
        <Card className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-bookmeup">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Évolution réservations
              </p>
              <p className="mt-3 text-4xl font-bold text-primary">
                {comparison.bookings.current}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                vs {comparison.bookings.previous} (période précédente)
              </p>
            </div>
            <TrendBadge value={comparison.bookings.changePercent} />
          </div>
        </Card>

        {/* Évolution chiffre d’affaires */}
        <Card className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-bookmeup">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Évolution chiffre d’affaires
              </p>
              <p className="mt-3 text-3xl font-bold text-primary">
                {formatEUR(comparison.revenue.current)}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                vs {formatEUR(comparison.revenue.previous)} (période précédente)
              </p>
            </div>
            <TrendBadge value={comparison.revenue.changePercent} />
          </div>
        </Card>

        {/* Taux d’occupation */}
        <Card className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-bookmeup">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Taux d’occupation
          </p>
          <p className="mt-3 text-4xl font-bold text-primary">
            {formatPercent(occupancyRate, 1)}
          </p>
          <p className="mt-2 text-sm text-slate-600">Sur la période sélectionnée</p>
        </Card>

        {/* Annulations */}
        <Card className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-bookmeup">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Annulations
          </p>
          <p className="mt-3 text-4xl font-bold text-primary">{cancellations.count}</p>
          <p className="mt-2 text-sm text-slate-600">
            Taux : {formatPercent(cancellations.rate, 1)}
          </p>
        </Card>

        {/* Clients uniques */}
        <Card className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-bookmeup">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Clients uniques
          </p>
          <p className="mt-3 text-4xl font-bold text-primary">{uniqueClients}</p>
          <p className="mt-2 text-sm text-slate-600">Sur la période sélectionnée</p>
        </Card>
      </div>
    </div>
  )
}


