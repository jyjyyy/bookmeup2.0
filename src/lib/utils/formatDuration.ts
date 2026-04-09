/**
 * Formate une durée en minutes en une chaîne lisible.
 * Ex: 30 → "30 min", 60 → "1h", 90 → "1h30", 120 → "2h", 150 → "2h30", 180 → "3h"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}
