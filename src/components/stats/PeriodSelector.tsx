export type PeriodSelectorValue = '7d' | '30d'

interface PeriodSelectorProps {
  value: PeriodSelectorValue
  onChange: (value: PeriodSelectorValue) => void
}

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 p-1 shadow-bookmeup-sm border border-primary/10">
      <button
        type="button"
        onClick={() => onChange('7d')}
        aria-pressed={value === '7d'}
        className={[
          'rounded-full px-4 py-2 text-sm font-medium transition-colors',
          value === '7d'
            ? 'bg-primary text-white shadow-bookmeup'
            : 'bg-transparent text-[#2A1F2D] hover:bg-secondary',
        ].join(' ')}
      >
        7 derniers jours
      </button>

      <button
        type="button"
        onClick={() => onChange('30d')}
        aria-pressed={value === '30d'}
        className={[
          'rounded-full px-4 py-2 text-sm font-medium transition-colors',
          value === '30d'
            ? 'bg-primary text-white shadow-bookmeup'
            : 'bg-transparent text-[#2A1F2D] hover:bg-secondary',
        ].join(' ')}
      >
        30 derniers jours
      </button>
    </div>
  )
}


