'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'

export interface BookingsChartPoint {
  date: string // YYYY-MM-DD
  count: number
}

export interface BookingsChartProps {
  data: BookingsChartPoint[]
}

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function BookingsChart({ data }: BookingsChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [hoverX, setHoverX] = useState<number>(0)
  const [hoverY, setHoverY] = useState<number>(0)

  const points = useMemo(() => {
    const clean = (data || [])
      .filter((p) => p && typeof p.date === 'string')
      .map((p) => ({
        date: p.date.slice(0, 10),
        count: Number.isFinite(p.count) ? p.count : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
    return clean
  }, [data])

  const isEmpty = points.length === 0

  const chart = useMemo(() => {
    const width = 900
    const height = 280
    const padding = { top: 18, right: 18, bottom: 44, left: 44 }

    if (points.length === 0) {
      return {
        width,
        height,
        padding,
        maxY: 0,
        minY: 0,
        pathD: '',
        dots: [] as Array<{ x: number; y: number; date: string; count: number }>,
        xTicks: [] as Array<{ x: number; label: string }>,
        yTicks: [] as Array<{ y: number; label: string }>,
      }
    }

    const maxY = Math.max(0, ...points.map((p) => p.count))
    const minY = 0
    const innerW = width - padding.left - padding.right
    const innerH = height - padding.top - padding.bottom

    const xForIndex = (i: number) => {
      if (points.length === 1) return padding.left + innerW / 2
      return padding.left + (i / (points.length - 1)) * innerW
    }
    const yForValue = (v: number) => {
      if (maxY === 0) return padding.top + innerH
      const t = (v - minY) / (maxY - minY)
      return padding.top + (1 - t) * innerH
    }

    const dots = points.map((p, i) => ({
      x: xForIndex(i),
      y: yForValue(p.count),
      date: p.date,
      count: p.count,
    }))

    const pathD = dots
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.x.toFixed(2)} ${d.y.toFixed(2)}`)
      .join(' ')

    // X ticks: 3 or 5 labels depending on length (avoid clutter)
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

    // Y ticks: 4 lines
    const yTickCount = 4
    const yTicks = Array.from({ length: yTickCount }, (_, t) => {
      const v = Math.round((t / (yTickCount - 1)) * maxY)
      return { y: yForValue(v), label: String(v) }
    })

    return { width, height, padding, maxY, minY, pathD, dots, xTicks, yTicks }
  }, [points])

  return (
    <Card className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-bookmeup">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Réservations confirmées
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[#2A1F2D]">
            Évolution des réservations
          </h3>
        </div>
        <div className="text-xs text-slate-500">Période sélectionnée</div>
      </div>

      {isEmpty ? (
        <div className="mt-6 rounded-[24px] border border-slate-100 bg-slate-50 px-5 py-6 text-sm text-slate-600">
          Aucune donnée à afficher sur la période sélectionnée.
        </div>
      ) : (
        <div className="mt-6 relative">
          {/* Tooltip */}
          {hoverIndex !== null && chart.dots[hoverIndex] ? (
            <div
              className="pointer-events-none absolute z-10 rounded-[16px] border border-primary/15 bg-white px-3 py-2 text-xs text-[#2A1F2D] shadow-bookmeup"
              style={{
                left: clamp(hoverX + 12, 8, chart.width - 180),
                top: clamp(hoverY - 40, 8, chart.height - 64),
                width: 168,
              }}
            >
              <div className="font-semibold">{formatShortDate(chart.dots[hoverIndex].date)}</div>
              <div className="mt-1 text-slate-600">
                <span className="font-medium text-primary">{chart.dots[hoverIndex].count}</span>{' '}
                réservation{chart.dots[hoverIndex].count > 1 ? 's' : ''}
              </div>
            </div>
          ) : null}

          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="w-full h-auto"
            role="img"
            aria-label="Graphique des réservations confirmées"
            onMouseLeave={() => setHoverIndex(null)}
            onMouseMove={(e) => {
              const svg = e.currentTarget
              const rect = svg.getBoundingClientRect()
              const mx = ((e.clientX - rect.left) / rect.width) * chart.width
              const my = ((e.clientY - rect.top) / rect.height) * chart.height

              setHoverX(mx)
              setHoverY(my)

              // Nearest point by X
              let nearest = 0
              let best = Infinity
              for (let i = 0; i < chart.dots.length; i++) {
                const dx = Math.abs(chart.dots[i].x - mx)
                if (dx < best) {
                  best = dx
                  nearest = i
                }
              }
              setHoverIndex(nearest)
            }}
          >
            {/* Background */}
            <rect
              x={0}
              y={0}
              width={chart.width}
              height={chart.height}
              fill="transparent"
              rx={24}
            />

            {/* Y grid + labels */}
            {chart.yTicks.map((t, idx) => (
              <g key={idx}>
                <line
                  x1={chart.padding.left}
                  x2={chart.width - chart.padding.right}
                  y1={t.y}
                  y2={t.y}
                  stroke="rgba(15, 23, 42, 0.08)"
                  strokeWidth={1}
                />
                <text
                  x={chart.padding.left - 10}
                  y={t.y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="rgba(15, 23, 42, 0.55)"
                >
                  {t.label}
                </text>
              </g>
            ))}

            {/* X axis line */}
            <line
              x1={chart.padding.left}
              x2={chart.width - chart.padding.right}
              y1={chart.height - chart.padding.bottom}
              y2={chart.height - chart.padding.bottom}
              stroke="rgba(15, 23, 42, 0.10)"
              strokeWidth={1}
            />

            {/* X labels */}
            {chart.xTicks.map((t, idx) => (
              <text
                key={idx}
                x={t.x}
                y={chart.height - chart.padding.bottom + 24}
                textAnchor="middle"
                fontSize="12"
                fill="rgba(15, 23, 42, 0.55)"
              >
                {t.label}
              </text>
            ))}

            {/* Line */}
            <path
              d={chart.pathD}
              fill="none"
              stroke="rgba(200, 109, 215, 1)"
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Area under line (subtle) */}
            <path
              d={`${chart.pathD} L ${chart.dots[chart.dots.length - 1].x.toFixed(
                2
              )} ${(chart.height - chart.padding.bottom).toFixed(2)} L ${chart.dots[0].x.toFixed(
                2
              )} ${(chart.height - chart.padding.bottom).toFixed(2)} Z`}
              fill="rgba(200, 109, 215, 0.10)"
            />

            {/* Dots */}
            {chart.dots.map((d, i) => {
              const active = hoverIndex === i
              return (
                <g key={i}>
                  <circle
                    cx={d.x}
                    cy={d.y}
                    r={active ? 6 : 4}
                    fill={active ? 'rgba(156, 68, 175, 1)' : 'rgba(200, 109, 215, 1)'}
                    stroke="white"
                    strokeWidth={2}
                  />
                </g>
              )
            })}

            {/* Hover vertical guide */}
            {hoverIndex !== null && chart.dots[hoverIndex] ? (
              <line
                x1={chart.dots[hoverIndex].x}
                x2={chart.dots[hoverIndex].x}
                y1={chart.padding.top}
                y2={chart.height - chart.padding.bottom}
                stroke="rgba(200, 109, 215, 0.18)"
                strokeWidth={2}
              />
            ) : null}
          </svg>
        </div>
      )}
    </Card>
  )
}


