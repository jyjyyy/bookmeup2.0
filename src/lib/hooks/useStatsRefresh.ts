'use client'

import { useEffect } from 'react'

/**
 * Écoute les événements de mise à jour des réservations
 * (storage cross-tab + custom event same-tab + visibilitychange)
 * et appelle le callback fourni à chaque fois.
 */
export function useStatsRefresh(onRefresh: () => void) {
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'bookingAttendanceUpdated') onRefresh()
    }
    const handleCustom = () => onRefresh()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') onRefresh()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('bookingAttendanceUpdated', handleCustom)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('bookingAttendanceUpdated', handleCustom)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [onRefresh])
}