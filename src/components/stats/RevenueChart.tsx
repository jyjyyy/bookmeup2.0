'use client'

import { useMemo, useState, useRef } from 'react'

export interface RevenueChartPoint {
  date: string
  total: number
}

export interface RevenueChartProps {
  data: RevenueChartPoint[]
}

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function formatEUR(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

/** Build a smooth cubic bezier path through points */
function smoothPath(dots: Array<{ x: number; y: number }>): string {
  if (dots.length < 2) return dots.map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.x} ${d.y}`).join(' ')

  let path = `M ${dots[0].x} ${dots[0].y}`
  for (let i = 0; i < dots.length - 1; i++) {
    const p0 = dots[Math.max(i - 1, 0)]
    const p1 = dots[i]
    const p2 = dots[i + 1]
    const p3 = dots[Math.min(i + 2, dots.length - 1)]

    const tension = 0.3
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return path
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const points = useMemo(() => {
    return (data || [])
      .filter((p) => p && typeof p.date === 'string')
      .map((p) => ({ date: p.date.slice(0, 10), total: Number.isFinite(p.total) ? p.total : 0 }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [data])

  const totalRevenue = useMemo(() => points.reduce((sum, p) => sum + (p.total > 0 ? p.total : 0), 0), [points])
  const isEmpty = points.length === 0 || totalRevenue <= 0

  const chart = useMemo(() => {
    const width = 900
    const height = 300
    const padding = { top: 24, right: 24, bottom: 50, left: 65 }

    if (points.length === 0) {
      return { width, height, padding, curvePath: '', areaPath: '', dots: [] as Array<{ x: number; y: number; date: string; total: number }>, xTicks: [] as Array<{ x: number; label: string }>, yTicks: [] as Array<{ y: number; label: string }> }
    }

    const maxY = Math.max(1, ...points.map((p) => (p.total > 0 ? p.total : 0)))
    const innerW = width - padding.left - padding.right
    const innerH = height - padding.top - padding.bottom

    const xForIndex = (i: number) => {
      if (points.length === 1) return padding.left + innerW / 2
      return padding.left + (i / (points.length - 1)) * innerW
    }
    const yForValue = (v: number) => {
      const t = v / maxY
      return padding.top + (1 - t) * innerH
    }

    const dots = points.map((p, i) => ({ x: xForIndex(i), y: yForValue(p.total > 0 ? p.total : 0), date: p.date, total: p.total > 0 ? p.total : 0 }))

    const curvePath = smoothPath(dots)
    const baseline = padding.top + innerH
    const areaPath = `${curvePath} L ${dots[dots.length - 1].x} ${baseline} L ${dots[0].x} ${baseline} Z`

    const tickCount = points.length <= 7 ? points.length : 5
    const xTickIndexes = tickCount === points.length
      ? Array.from({ length: points.length }, (_, i) => i)
      : Array.from({ length: tickCount }, (_, t) => Math.round((t / (tickCount - 1)) * (points.length - 1)))
    const xTicks = Array.from(new Set(xTickIndexes)).map((i) => ({ x: xForIndex(i), label: formatShortDate(points[i].date) }))

    const yTickCount = 4
    const yTicks = Array.from({ length: yTickCount }, (_, t) => {
      const v = (t / (yTickCount - 1)) * maxY
      return { y: yForValue(v), label: formatEUR(Math.round(v)) }
    })

    return { width, height, padding, curvePath, areaPath, dots, xTicks, yTicks }
  }, [points])

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    const mx = ((e.clientX - rect.left) / rect.width) * chart.width
    const relX = e.clientX - containerRect.left
    const relY = e.clientY - containerRect.top
    setTooltipPos({ x: relX, y: relY })

    let nearest = 0, best = Infinity
    for (let i = 0; i < chart.dots.length; i++) {
      const dx = Math.abs(chart.dots[i].x - mx)
      if (dx < best) { best = dx; nearest = i }
    }
    setHoverIndex(nearest)
  }

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a7a92]">Chiffre d&apos;affaires</p>
          <h3 className="mt-1 text-base font-bold text-[#2A1F2D]">Revenu par jour</h3>
        </div>
        {!isEmpty && (
          <div className="text-right">
            <p className="text-[11px] text-[#8a7a92]">Total période</p>
            <p className="text-lg font-extrabold bg-gradient-to-r from-primary to-[#9C44AF] bg-clip-text text-transparent">{formatEUR(totalRevenue)}</p>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="rounded-[16px] border border-[#EDE8F0] bg-[#F5F0F7] px-5 py-6 text-sm text-[#8a7a92]">
          Aucun revenu à afficher sur la période sélectionnée.
        </div>
      ) : (
        <div className="relative" ref={containerRef}>
          {hoverIndex !== null && chart.dots[hoverIndex] && (
            <div
              className="pointer-events-none absolute z-10 rounded-[14px] border border-emerald-200/40 bg-white px-3.5 py-2.5 shadow-[0_4px_16px_rgba(20,0,50,0.12)]"
              style={{
                left: Math.min(tooltipPos.x + 16, (containerRef.current?.offsetWidth ?? 300) - 190),
                top: Math.max(tooltipPos.y - 50, 4),
              }}
            >
              <div className="font-bold text-[13px] text-[#2A1F2D]">{formatShortDate(chart.dots[hoverIndex].date)}</div>
              <div className="mt-0.5 text-[#8a7a92] text-xs">
                <span className="font-bold text-emerald-600 text-[13px]">{formatEUR(chart.dots[hoverIndex].total)}</span>
              </div>
            </div>
          )}

          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="w-full h-auto" onMouseLeave={() => setHoverIndex(null)} onMouseMove={handleMouseMove}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(16,185,129,0.2)" />
                <stop offset="100%" stopColor="rgba(16,185,129,0.01)" />
              </linearGradient>
            </defs>

            {chart.yTicks.map((t, idx) => (
              <g key={idx}>
                <line x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={t.y} y2={t.y} stroke="rgba(15,23,42,0.05)" strokeWidth={1} strokeDasharray="4 4" />
                <text x={chart.padding.left - 12} y={t.y + 5} textAnchor="end" fontSize="14" fontWeight="500" fill="#8a7a92">{t.label}</text>
              </g>
            ))}

            {chart.xTicks.map((t, idx) => (
              <text key={idx} x={t.x} y={chart.height - chart.padding.bottom + 28} textAnchor="middle" fontSize="14" fontWeight="500" fill="#8a7a92">{t.label}</text>
            ))}

            {/* Gradient area */}
            <path d={chart.areaPath} fill="url(#revenueGrad)" />

            {/* Smooth curve */}
            <path d={chart.curvePath} fill="none" stroke="rgba(16,185,129,1)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

            {/* Dots */}
            {chart.dots.map((d, i) => {
              const active = hoverIndex === i
              return (
                <g key={i}>
                  {active && <circle cx={d.x} cy={d.y} r={14} fill="rgba(16,185,129,0.1)" />}
                  <circle cx={d.x} cy={d.y} r={active ? 6 : 4} fill={active ? '#059669' : '#10B981'} stroke="white" strokeWidth={2.5} />
                </g>
              )
            })}

            {hoverIndex !== null && chart.dots[hoverIndex] && (
              <line x1={chart.dots[hoverIndex].x} x2={chart.dots[hoverIndex].x} y1={chart.padding.top} y2={chart.height - chart.padding.bottom} stroke="rgba(16,185,129,0.12)" strokeWidth={1.5} strokeDasharray="5 4" />
            )}
          </svg>
        </div>
      )}
    </div>
  )
}
