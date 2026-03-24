import { StatsCard } from '@/components/stats/StatsCard'

export interface StatsGridProps {
  totalRevenue: number | string
  upcomingBookings: number | string
  activeServices: number | string
}

export function StatsGrid({
  totalRevenue,
  upcomingBookings,
  activeServices,
}: StatsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Chiffre d'affaires encaissé"
        value={totalRevenue}
        subtitle="Basé sur les rendez-vous réalisés et encaissés sur place"
      />
      <StatsCard
        title="Réservations à venir"
        value={upcomingBookings}
        subtitle="Après aujourd'hui"
      />
      <StatsCard title="Services actifs" value={activeServices} subtitle="En ligne" />
    </div>
  )
}


