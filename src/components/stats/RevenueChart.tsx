'use client'

import { useMemo, useState, useRef } from 'react'
import { Card } from '@/components/ui/card'

export interface RevenueChartPoint {
  date: string // YYYY-MM-DD
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
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const points = useMemo(() => {
    return (data || [])
      .filter((p) => p && typeof p.date === 'string')
      .map((p) => ({
        date: p.date.slice(0, 10),
        total: Number.isFinite(p.total) ? p.total : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [data])

  const totalRevenue = useMemo(
    () => points.reduce((sum, p) => sum + (p.total > 0 ? p.total : 0), 0),
    [points]
  )

  const isEmpty = points.length === 0 || totalRevenue <= 0

  const chart = useMemo(() => {
    const width = 900
    const height = 300
    const padding = { top: 20, right: 20, bottom: 50, left: 65 }

    const innerW = width - padding.left - padding.right
    const innerH = height - padding.top - padding.bottom

    const maxY = Math.max(0, ...points.map((p) => (p.total > 0 ? p.total : 0)))
    const minY = 0

    const barCount = Math.max(1, points.length)
    const gap = barCount > 1 ? 10 : 0
    const barW = barCount > 1 ? (innerW - gap * (barCount - 1)) / barCount : innerW * 0.28
    const barOffset = barCount > 1 ? 0 : innerW * 0.36

    const xForIndex = (i: number) =>
      padding.left + barOffset + i * (barW + gap) + barW / 2
    const xBarLeft = (i: number) =>
      padding.left + barOffset + i * (barW + gap)

    const yForValue = (v: number) => {
      if (maxY === 0) return padding.top + innerH
      const t = (v - minY) / (maxY - minY)
      return padding.top + (1 - t) * innerH
    }

    const bars = points.map((p, i) => {
      const v = p.total > 0 ? p.total : 0
      const y = yForValue(v)
      const x = xBarLeft(i)
      const h = padding.top + innerH - y
      return { x, y, w: barW, h, date: p.date, total: v, cx: xForIndex(i) }
    })

    const tickCount = points.length <= 7 ? points.length : 5
    const xTickIndexes =
      tickCount === points.length
        ? Array.from({ length: points.length }, (_, i) => i)
        : Array.from({ length: tickCount }, (_, t) =>
            Math.round((t / (tickCount - 1)) * (points.length - 1))
          )

    const xTicks = Array.from(new Set(xTickIndexes)).map((i) => ({
      x: xForIndex(i),
      label: formatShortDate(points[i].date),
    }))

    const yTickCount = 4
    const yTicks = Array.from({ length: yTickCount }, (_, t) => {
      const v = (t / (yTickCount - 1)) * maxY
      return { y: yForValue(v), label: formatEUR(Math.round(v)) }
    })

    return { width, height, padding, bars, xTicks, yTicks }
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

    let nearest = 0
    let best = Infinity
    for (let i = 0; i < chart.bars.length; i++) {
      const dx = Math.abs(chart.bars[i].cx - mx)
      if (dx < best) {
        best = dx
        nearest = i
      }
    }
    setHoverIndex(nearest)
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a7a92]">
          Chiffre d&apos;affaires
        </p>
        <h3 className="mt-1 text-base font-bold text-[#2A1F2D]">
          Revenu payé par jour
        </h3>
      </div>

      {isEmpty ? (
        <div className="rounded-[16px] border border-[#EDE8F0] bg-[#F5F0F7] px-5 py-6 text-sm text-[#8a7a92]">
          Aucun revenu à afficher sur la période sélectionnée.
        </div>
      ) : (
        <div className="relative" ref={containerRef}>
          {/* Tooltip */}
          {hoverIndex !== null && chart.bars[hoverIndex] ? (
            <div
              className="pointer-events-none absolute z-10 rounded-[14px] border border-primary/15 bg-white px-3.5 py-2.5 text-xs text-[#2A1F2D] shadow-[0_4px_16px_rgba(20,0,50,0.12)]"
              style={{
                left: Math.min(tooltipPos.x + 16, (containerRef.current?.offsetWidth ?? 300) - 190),
                top: Math.max(tooltipPos.y - 50, 4),
              }}
            >
              <div className="font-bold text-[13px]">{formatShortDate(chart.bars[hoverIndex].date)}</div>
              <div className="mt-0.5 text-[#8a7a92]">
                <span className="font-bold text-primary text-[13px]">
                  {formatEUR(chart.bars[hoverIndex].total)}
                </span>
              </div>
            </div>
          ) : null}

          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="w-full h-auto"
            role="img"
            aria-label="Graphique du chiffre d'affaires"
            onMouseLeave={() => setHoverIndex(null)}
            onMouseMove={handleMouseMove}
          >
            {/* Y grid + labels */}
            {chart.yTicks.map((t, idx) => (
              <g key={idx}>
                <line
                  x1={chart.padding.left}
                  x2={chart.width - chart.padding.right}
                  y1={t.y}
                  y2={t.y}
                  stroke="rgba(15, 23, 42, 0.06)"
                  strokeWidth={1}
                />
                <text
                  x={chart.padding.left - 12}
                  y={t.y + 5}
                  textAnchor="end"
                  fontSize="15"
                  fontWeight="500"
                  fill="#8a7a92"
                >
                  {t.label}
                </text>
              </g>
            ))}

            {/* X axis */}
            <line
              x1={chart.padding.left}
              x2={chart.width - chart.padding.right}
              y1={chart.height - chart.padding.bottom}
              y2={chart.height - chart.padding.bottom}
              stroke="rgba(15, 23, 42, 0.08)"
              strokeWidth={1}
            />

            {/* X labels */}
            {chart.xTicks.map((t, idx) => (
              <text
                key={idx}
                x={t.x}
                y={chart.height - chart.padding.bottom + 28}
                textAnchor="middle"
                fontSize="15"
                fontWeight="500"
                fill="#8a7a92"
              >
                {t.label}
              </text>
            ))}

            {/* Bars */}
            {chart.bars.map((b, i) => {
              const active = hoverIndex === i
              return (
                <rect
                  key={i}
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx={10}
                  fill={active ? 'rgba(156, 68, 175, 0.95)' : 'rgba(200, 109, 215, 0.8)'}
                  stroke={active ? 'rgba(156, 68, 175, 1)' : 'transparent'}
                  strokeWidth={2}
                />
              )
            })}

            {/* Hover guide */}
            {hoverIndex !== null && chart.bars[hoverIndex] ? (
              <line
                x1={chart.bars[hoverIndex].cx}
                x2={chart.bars[hoverIndex].cx}
                y1={chart.padding.top}
                y2={chart.height - chart.padding.bottom}
                stroke="rgba(200, 109, 215, 0.12)"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            ) : null}
          </svg>
        </div>
      )}
    </div>
  )
}
