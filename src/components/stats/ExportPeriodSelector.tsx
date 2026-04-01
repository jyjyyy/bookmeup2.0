'use client'

import { useState, useMemo } from 'react'

export type ExportMode = '7d' | '30d' | 'month' | 'year'

export interface ExportPeriodSelection {
  mode: ExportMode
  /** For 'month': target month as Date. For 'year': target year as Date. */
  target?: Date
}

interface ExportPeriodSelectorProps {
  value: ExportPeriodSelection
  onChange: (value: ExportPeriodSelection) => void
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export default function ExportPeriodSelector({ value, onChange }: ExportPeriodSelectorProps) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const selectedMonth = value.target ? value.target.getMonth() : currentMonth
  const selectedYear = value.target ? value.target.getFullYear() : currentYear

  const years = useMemo(() => {
    const arr: number[] = []
    for (let y = currentYear; y >= currentYear - 3; y--) {
      arr.push(y)
    }
    return arr
  }, [currentYear])

  const handleModeChange = (mode: ExportMode) => {
    if (mode === 'month') {
      onChange({ mode, target: new Date(selectedYear, selectedMonth, 1) })
    } else if (mode === 'year') {
      onChange({ mode, target: new Date(selectedYear, 0, 1) })
    } else {
      onChange({ mode })
    }
  }

  const handleMonthChange = (month: number) => {
    onChange({ mode: 'month', target: new Date(selectedYear, month, 1) })
  }

  const handleYearChange = (year: number) => {
    if (value.mode === 'month') {
      onChange({ mode: 'month', target: new Date(year, selectedMonth, 1) })
    } else {
      onChange({ mode: 'year', target: new Date(year, 0, 1) })
    }
  }

  const pillClass = (active: boolean) =>
    `px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
      active
        ? 'bg-primary text-white shadow-[0_2px_8px_rgba(200,109,215,0.3)]'
        : 'text-[#8a7a92] hover:bg-[#F5F0F7] hover:text-[#2A1F2D]'
    }`

  return (
    <div className="space-y-3">
      {/* Mode pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button type="button" onClick={() => handleModeChange('7d')} className={pillClass(value.mode === '7d')}>
          7 jours
        </button>
        <button type="button" onClick={() => handleModeChange('30d')} className={pillClass(value.mode === '30d')}>
          30 jours
        </button>
        <button type="button" onClick={() => handleModeChange('month')} className={pillClass(value.mode === 'month')}>
          Par mois
        </button>
        <button type="button" onClick={() => handleModeChange('year')} className={pillClass(value.mode === 'year')}>
          Par année
        </button>
      </div>

      {/* Month/Year selectors */}
      {(value.mode === 'month' || value.mode === 'year') && (
        <div className="flex items-center gap-2 flex-wrap">
          {value.mode === 'month' && (
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              className="px-3 py-1.5 rounded-[10px] border border-[#EDE8F0] bg-white text-sm text-[#2A1F2D] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            >
              {MONTHS_FR.map((label, i) => (
                <option key={i} value={i}>{label}</option>
              ))}
            </select>
          )}
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="px-3 py-1.5 rounded-[10px] border border-[#EDE8F0] bg-white text-sm text-[#2A1F2D] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
