import { Card } from '@/components/ui/card'

export interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <Card className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-bookmeup transition-shadow hover:shadow-bookmeup-lg">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
        {title}
      </p>
      <p className="mt-3 text-4xl font-bold text-primary">{value}</p>
      {subtitle ? (
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      ) : null}
    </Card>
  )
}


