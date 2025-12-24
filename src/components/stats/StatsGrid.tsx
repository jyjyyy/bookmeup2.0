import { StatsCard } from '@/components/stats/StatsCard'

export interface StatsGridProps {
  totalBookings: number | string
  totalRevenue: number | string
  upcomingBookings: number | string
  activeServices: number | string
}

export function StatsGrid({
  totalBookings,
  totalRevenue,
  upcomingBookings,
  activeServices,
}: StatsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Réservations confirmées"
        value={totalBookings}
        subtitle="Total"
      />
      <StatsCard
        title="Chiffre d’affaires (payé)"
        value={totalRevenue}
        subtitle="Uniquement les réservations payées"
      />
      <StatsCard
        title="Réservations à venir"
        value={upcomingBookings}
        subtitle="Après aujourd’hui"
      />
      <StatsCard title="Services actifs" value={activeServices} subtitle="En ligne" />
    </div>
  )
}


