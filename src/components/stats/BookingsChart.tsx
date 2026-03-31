'use client'

import { useMemo, useState, useRef } from 'react'
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

export function BookingsChart({ data }: BookingsChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

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
    const height = 300
    const padding = { top: 20, right: 20, bottom: 50, left: 50 }

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
      const v = Math.round((t / (yTickCount - 1)) * maxY)
      return { y: yForValue(v), label: String(v) }
    })

    return { width, height, padding, maxY, minY, pathD, dots, xTicks, yTicks }
  }, [points])

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    const mx = ((e.clientX - rect.left) / rect.width) * chart.width

    // Position tooltip relative to container using real mouse coords
    const relX = e.clientX - containerRect.left
    const relY = e.clientY - containerRect.top

    setTooltipPos({ x: relX, y: relY })

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
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a7a92]">
          Réservations confirmées
        </p>
        <h3 className="mt-1 text-base font-bold text-[#2A1F2D]">
          Évolution des réservations
        </h3>
      </div>

      {isEmpty ? (
        <div className="rounded-[16px] border border-[#EDE8F0] bg-[#F5F0F7] px-5 py-6 text-sm text-[#8a7a92]">
          Aucune donnée à afficher sur la période sélectionnée.
        </div>
      ) : (
        <div className="relative" ref={containerRef}>
          {/* Tooltip — positioned relative to the container using mouse coords */}
          {hoverIndex !== null && chart.dots[hoverIndex] ? (
            <div
              className="pointer-events-none absolute z-10 rounded-[14px] border border-primary/15 bg-white px-3.5 py-2.5 text-xs text-[#2A1F2D] shadow-[0_4px_16px_rgba(20,0,50,0.12)]"
              style={{
                left: Math.min(tooltipPos.x + 16, (containerRef.current?.offsetWidth ?? 300) - 180),
                top: Math.max(tooltipPos.y - 50, 4),
              }}
            >
              <div className="font-bold text-[13px]">{formatShortDate(chart.dots[hoverIndex].date)}</div>
              <div className="mt-0.5 text-[#8a7a92]">
                <span className="font-bold text-primary text-[13px]">{chart.dots[hoverIndex].count}</span>{' '}
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
            onMouseMove={handleMouseMove}
          >
            <rect x={0} y={0} width={chart.width} height={chart.height} fill="transparent" rx={24} />

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
                  fontSize="16"
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

            {/* Area */}
            <path
              d={`${chart.pathD} L ${chart.dots[chart.dots.length - 1].x.toFixed(
                2
              )} ${(chart.height - chart.padding.bottom).toFixed(2)} L ${chart.dots[0].x.toFixed(
                2
              )} ${(chart.height - chart.padding.bottom).toFixed(2)} Z`}
              fill="rgba(200, 109, 215, 0.08)"
            />

            {/* Line */}
            <path
              d={chart.pathD}
              fill="none"
              stroke="rgba(200, 109, 215, 1)"
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Dots */}
            {chart.dots.map((d, i) => {
              const active = hoverIndex === i
              return (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={active ? 7 : 4.5}
                  fill={active ? 'rgba(156, 68, 175, 1)' : 'rgba(200, 109, 215, 1)'}
                  stroke="white"
                  strokeWidth={2.5}
                />
              )
            })}

            {/* Hover guide */}
            {hoverIndex !== null && chart.dots[hoverIndex] ? (
              <line
                x1={chart.dots[hoverIndex].x}
                x2={chart.dots[hoverIndex].x}
                y1={chart.padding.top}
                y2={chart.height - chart.padding.bottom}
                stroke="rgba(200, 109, 215, 0.15)"
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
