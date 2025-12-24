import { Card } from '@/components/ui/card'

export interface ServiceStatsItem {
  serviceName: string
  bookings: number
  revenue: number
}

export interface ServiceStatsProps {
  data: ServiceStatsItem[]
}

function formatEUR(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function ServiceStats({ data }: ServiceStatsProps) {
  const items = Array.isArray(data) ? data : []

  return (
    <Card className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-bookmeup">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Performance par service
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[#2A1F2D]">
            Services les plus performants
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Triés par chiffre d’affaires (descendant)
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-slate-100 bg-slate-50 px-5 py-6 text-sm text-slate-600">
          Aucune donnée à afficher sur la période sélectionnée.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-100 bg-white">
          <div className="grid grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            <div className="col-span-7">Service</div>
            <div className="col-span-2 text-right">Réservations</div>
            <div className="col-span-3 text-right">Revenu</div>
          </div>

          <ul className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <li key={`${item.serviceName}-${idx}`} className="px-5 py-4">
                <div className="grid grid-cols-12 items-center gap-3">
                  <div className="col-span-7 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#2A1F2D]">
                          {item.serviceName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 text-right text-sm font-semibold text-[#2A1F2D]">
                    {Number.isFinite(item.bookings) ? item.bookings : 0}
                  </div>

                  <div className="col-span-3 text-right text-sm font-bold text-primary">
                    {formatEUR(Number.isFinite(item.revenue) ? item.revenue : 0)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* NOTE: This component is UI-only and does not sort. Provide data already sorted by revenue desc. */}
    </Card>
  )
}


